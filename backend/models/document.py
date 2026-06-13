from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from models.database import Base

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True)
    applicant_name = Column(String, nullable=False)
    co_applicant_name = Column(String, nullable=True)
    loan_reference = Column(String, nullable=True)
    loan_type = Column(String, nullable=True)
    appraiser_name = Column(String, nullable=True)
    assessment_months = Column(Integer, default=12)
    files = relationship("DocumentFile", back_populates="document", cascade="all, delete-orphan")
    status = Column(String, default="pending")
    processing_step = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    ai_confidence = Column(JSON, nullable=True)
    summary = relationship("ApplicationSummary", back_populates="document", uselist=False)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)

class DocumentFile(Base):
    __tablename__ = "document_files"
    id = Column(String, primary_key=True)
    document_id = Column(String, ForeignKey("documents.id"))
    document = relationship("Document", back_populates="files")
    original_filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    bank_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ApplicationSummary(Base):
    __tablename__ = "application_summaries"
    id = Column(String, primary_key=True)
    document_id = Column(String, ForeignKey("documents.id"), unique=True)
    document = relationship("Document", back_populates="summary")
    account_details = Column(JSON, nullable=True)
    monthly_credits = Column(JSON, nullable=True)
    balance_snapshots = Column(JSON, nullable=True)
    notes = Column(JSON, nullable=True)
    ai_flags = Column(JSON, nullable=True)
    aggregates = Column(JSON, nullable=True)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    document_id = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
