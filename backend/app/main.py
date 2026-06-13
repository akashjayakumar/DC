"""
DentalCopilot AI — Backend
==========================
Run dev server:
    uvicorn app.main:app --reload --port 8000
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongo import ping_db
from app.api import patients, visits, documents, rag
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────
    print("⚙️  DentalCopilot starting up...")

    db_ok = await ping_db()
    if db_ok:
        print("✅ MongoDB connected")
    else:
        print("⚠️  MongoDB not reachable — check MONGO_URI in .env")

    yield  # app is running

    # ── Shutdown ─────────────────────────────────────────────────────────
    print("🛑 DentalCopilot shutting down...")


app = FastAPI(
    title="DentalCopilot AI",
    description="AI-powered clinical assistant for dentists and small dental clinics.",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS (adjust origins for production) ─────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────
app.include_router(patients.router)
app.include_router(visits.router)
app.include_router(documents.router)
app.include_router(rag.router)


# ── Health check ─────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    db_ok = await ping_db()
    return {
        "status": "ok" if db_ok else "degraded",
        "mongodb": "connected" if db_ok else "unreachable",
        "version": "0.1.0",
    }


@app.get("/", tags=["System"])
async def root():
    return {"message": "DentalCopilot API is running. Visit /docs for Swagger UI."}
