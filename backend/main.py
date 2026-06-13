from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from api.routes import auth, documents, summaries, settings as settings_route
from models.database import init_db
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
    yield

app = FastAPI(title="LoanDocs AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(summaries.router, prefix="/api/summaries", tags=["summaries"])
app.include_router(settings_route.router, prefix="/api/settings", tags=["settings"])

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
