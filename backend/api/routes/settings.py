from fastapi import APIRouter, Depends
from models.user import User
from services.auth_service import get_current_user
from config import settings

router = APIRouter()

@router.get("/")
def get_settings(current_user: User = Depends(get_current_user)):
    return {"ai_provider": settings.AI_PROVIDER, "ai_confidence_threshold": settings.AI_CONFIDENCE_THRESHOLD, "default_assessment_months": settings.DEFAULT_ASSESSMENT_MONTHS, "balance_snapshot_days": settings.BALANCE_SNAPSHOT_DAYS}
