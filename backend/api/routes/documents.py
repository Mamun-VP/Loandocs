import os, uuid
from typing import List, Optional
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from models.database import get_db
from models.document import Document, DocumentFile, AuditLog
from models.user import User
from services.auth_service import get_current_user
from services.pipeline import process_document
from config import settings

router = APIRouter()

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    applicant_name: str = Form(...),
    co_applicant_name: Optional[str] = Form(None),
    loan_reference: Optional[str] = Form(None),
    loan_type: Optional[str] = Form(None),
    appraiser_name: Optional[str] = Form(None),
    assessment_months: int = Form(12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc_id = str(uuid.uuid4())
    doc = Document(id=doc_id, applicant_name=applicant_name, co_applicant_name=co_applicant_name,
        loan_reference=loan_reference, loan_type=loan_type, appraiser_name=appraiser_name,
        assessment_months=assessment_months, status="pending", uploaded_by=current_user.id)
    db.add(doc)

    for upload in files:
        ext = Path(upload.filename).suffix.lower()
        if ext not in {".pdf", ".csv", ".xlsx", ".xls"}:
            raise HTTPException(status_code=400, detail=f"Unsupported file: {upload.filename}")
        file_id = str(uuid.uuid4())
        save_dir = Path(settings.STORAGE_PATH) / str(datetime.now().year) / str(datetime.now().month) / doc_id
        save_dir.mkdir(parents=True, exist_ok=True)
        save_path = save_dir / f"{file_id}{ext}"
        content = await upload.read()
        save_path.write_bytes(content)
        db.add(DocumentFile(id=file_id, document_id=doc_id, original_filename=upload.filename,
            stored_path=str(save_path), file_type=ext.lstrip("."), file_size_bytes=len(content)))

    db.add(AuditLog(id=str(uuid.uuid4()), user_id=current_user.id, action="upload", document_id=doc_id, detail=f"{len(files)} file(s)"))
    db.commit()
    background_tasks.add_task(process_document, doc_id)
    return {"document_id": doc_id, "status": "pending", "message": "Processing started"}

@router.get("/")
def list_documents(skip: int = 0, limit: int = 50, status: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Document)
    if status:
        q = q.filter(Document.status == status)
    total = q.count()
    docs = q.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": [_doc_dict(d) for d in docs]}

@router.get("/{document_id}/status")
def get_status(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return {"document_id": document_id, "status": doc.status, "processing_step": doc.processing_step, "error_message": doc.error_message, "ai_confidence": doc.ai_confidence}

@router.get("/{document_id}/download")
def download_pdf(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not doc.summary or not doc.summary.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not available")
    if not os.path.exists(doc.summary.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file missing")
    db.add(AuditLog(id=str(uuid.uuid4()), user_id=current_user.id, action="download", document_id=document_id))
    db.commit()
    fname = f"BSA_{doc.applicant_name.replace(' ','_')}_{document_id[:8]}.pdf"
    return FileResponse(doc.summary.pdf_path, media_type="application/pdf", filename=fname)

@router.post("/{document_id}/retry")
async def retry_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if doc.status != "failed":
        raise HTTPException(status_code=400, detail="Only failed documents can be retried")
    if not doc.files:
        raise HTTPException(status_code=400, detail="No files attached to this document")
    doc.status = "pending"
    doc.error_message = None
    doc.processing_step = None
    doc.processed_at = None
    db.add(AuditLog(id=str(uuid.uuid4()), user_id=current_user.id, action="retry", document_id=document_id))
    db.commit()
    background_tasks.add_task(process_document, document_id)
    return {"document_id": document_id, "status": "pending", "message": "Processing restarted"}

@router.get("/{document_id}")
def get_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    db.add(AuditLog(id=str(uuid.uuid4()), user_id=current_user.id, action="view", document_id=document_id))
    db.commit()
    return _doc_dict(doc)

def _doc_dict(doc):
    return {"id": doc.id, "applicant_name": doc.applicant_name, "co_applicant_name": doc.co_applicant_name,
        "loan_reference": doc.loan_reference, "loan_type": doc.loan_type, "appraiser_name": doc.appraiser_name,
        "status": doc.status, "processing_step": doc.processing_step, "error_message": doc.error_message,
        "ai_confidence": doc.ai_confidence, "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "processed_at": doc.processed_at.isoformat() if doc.processed_at else None,
        "files": [{"id": f.id, "filename": f.original_filename, "type": f.file_type, "size": f.file_size_bytes} for f in doc.files],
        "has_summary": doc.summary is not None}
