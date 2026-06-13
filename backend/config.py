from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "LoanDocs AI"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-to-a-long-random-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 8
    DATABASE_URL: str = "sqlite:///./loandocs.db"
    STORAGE_PATH: str = "./storage/documents"
    AI_PROVIDER: str = "anthropic"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    AI_MODEL_ANTHROPIC: str = "claude-opus-4-6"
    AI_MODEL_OPENAI: str = "gpt-4o"
    AI_MODEL_GEMINI: str = "gemini-2.5-flash"
    AI_MODEL_OLLAMA: str = "llama3"
    AI_MAX_TOKENS: int = 4096
    AI_CONFIDENCE_THRESHOLD: float = 0.85
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    DEFAULT_ASSESSMENT_MONTHS: int = 12
    BALANCE_SNAPSHOT_DAYS: List[int] = [1, 8, 17, 25]

    class Config:
        env_file = ".env"

settings = Settings()
