"""
Main processing pipeline: extract → analyse → aggregate → generate PDF.
Runs in a background thread so the API stays non-blocking.
"""
import os, uuid
from datetime import datetime, timezone
from pathlib import Path

from models.database import SessionLocal
from models.document import Document, ApplicationSummary
from services.extraction.extractor import extract
from services.ai.analyser import analyse
from services.summary.aggregator import compute_aggregates
from services.summary.generator import generate_pdf
from config import settings


def process_document(document_id: str):
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        # Step 1: extract text from all uploaded files
        _update_status(db, doc, "extracting", "Extracting text from documents")
        combined_text = ""
        for f in doc.files:
            extracted = extract(f.stored_path)
            combined_text += f"\n\n=== FILE: {f.original_filename} ===\n{extracted['text']}"

        # Step 2: AI analysis
        _update_status(db, doc, "analyzing", "Running AI analysis")
        ai_data = analyse({"text": combined_text})

        # Step 3: aggregate (Python maths, not AI)
        ai_data = compute_aggregates(ai_data)

        # Step 4: generate PDF
        _update_status(db, doc, "generating", "Generating PDF report")
        pdf_path = os.path.join(
            settings.STORAGE_PATH,
            str(datetime.now().year),
            str(datetime.now().month),
            document_id,
            f"BSA_{document_id}.pdf"
        )
        document_meta = {
            "applicant_name": doc.applicant_name,
            "co_applicant_name": doc.co_applicant_name,
            "loan_reference": doc.loan_reference or f"BSA-{document_id[:8].upper()}",
            "loan_type": doc.loan_type,
            "appraiser_name": doc.appraiser_name,
        }
        generate_pdf(ai_data, document_meta, pdf_path)

        # Step 5: save summary
        summary = ApplicationSummary(
            id=str(uuid.uuid4()),
            document_id=document_id,
            account_details=ai_data.get("account_details"),
            monthly_credits=ai_data.get("monthly_credits"),
            balance_snapshots=ai_data.get("balance_snapshots"),
            notes=ai_data.get("notes"),
            ai_flags=ai_data.get("ai_flags"),
            aggregates={
                "credit_totals": ai_data.get("credit_totals"),
                "credit_averages": ai_data.get("credit_averages"),
                "balance_averages": ai_data.get("balance_averages"),
                "grand_balance_averages": ai_data.get("grand_balance_averages"),
            },
            pdf_path=pdf_path,
        )
        db.add(summary)

        # Determine final status
        confidence = ai_data.get("confidence", {})
        min_conf = min(confidence.values()) if confidence else 1.0
        flags = ai_data.get("ai_flags", [])
        high_flags = [f for f in flags if f.get("severity") == "high"]
        final_status = "flagged" if (min_conf < settings.AI_CONFIDENCE_THRESHOLD or high_flags) else "complete"

        doc.status = final_status
        doc.processing_step = None
        doc.ai_confidence = confidence
        doc.processed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as e:
        if doc:
            doc.status = "failed"
            doc.error_message = str(e)
            doc.processing_step = None
            db.commit()
        raise
    finally:
        db.close()


def _update_status(db, doc, status: str, step: str):
    doc.status = status
    doc.processing_step = step
    db.commit()
