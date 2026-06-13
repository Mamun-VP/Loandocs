from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone
import uuid

from config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    _seed_users()

def _seed_users():
    from models.user import User
    from services.auth_service import hash_password
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            db.add_all([
                User(id=str(uuid.uuid4()), email="admin@loandocs.ai", name="Admin User", role="admin", hashed_password=hash_password("admin123")),
                User(id=str(uuid.uuid4()), email="officer@loandocs.ai", name="Loan Officer", role="officer", hashed_password=hash_password("officer123")),
            ])
            db.commit()
    finally:
        db.close()
