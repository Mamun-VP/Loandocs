from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.document import Document, AuditLog
from models.user import User
from services.auth_service import get_current_user
import uuid

router = APIRouter()

@router.get("/{document_id}")
def get_summary(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.summary:
        raise HTTPException(status_code=404, detail="Summary not yet generated")
    s = doc.summary
    db.add(AuditLog(id=str(uuid.uuid4()), user_id=current_user.id, action="view_summary", document_id=document_id))
    db.commit()
    return {
        "document_id": document_id, "applicant_name": doc.applicant_name,
        "co_applicant_name": doc.co_applicant_name, "loan_reference": doc.loan_reference,
        "loan_type": doc.loan_type, "appraiser_name": doc.appraiser_name,
        "account_details": s.account_details, "monthly_credits": s.monthly_credits,
        "balance_snapshots": s.balance_snapshots, "notes": s.notes,
        "ai_flags": s.ai_flags, "aggregates": s.aggregates, "ai_confidence": doc.ai_confidence,
        "status": doc.status, "created_at": s.created_at.isoformat() if s.created_at else None,
    }
