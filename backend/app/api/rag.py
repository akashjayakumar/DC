from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import rag_service, prediction_service, llm_service

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Request schemas ────────────────────────────────────────────────────────

class SummaryRequest(BaseModel):
    patient_id: str


class QueryRequest(BaseModel):
    query: str
    patient_id: Optional[str] = None  # None = search all docs


class InsuranceQueryRequest(BaseModel):
    query: str
    patient_id: str


class PredictionRequest(BaseModel):
    age: int
    gender: str
    day_of_week: int
    hour_of_day: int
    previous_no_shows: int
    days_until_appointment: int
    has_insurance: bool


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/patient-summary")
async def patient_summary(body: SummaryRequest):
    """Generate an AI clinical summary for a patient."""
    if not await llm_service.is_ollama_available():
        raise HTTPException(
            status_code=503,
            detail="LLM service unavailable. Make sure Ollama is running: `ollama serve`",
        )
    summary = await rag_service.generate_patient_summary(body.patient_id)
    return {"patient_id": body.patient_id, "summary": summary}


@router.post("/query")
async def rag_query(body: QueryRequest):
    """Ask a question about patient documents or dental guidelines."""
    if not await llm_service.is_ollama_available():
        raise HTTPException(status_code=503, detail="LLM service unavailable.")
    result = await rag_service.rag_query(body.query, patient_id=body.patient_id)
    return result


@router.post("/insurance-query")
async def insurance_query(body: InsuranceQueryRequest):
    """Ask a question specifically about a patient's insurance documents."""
    if not await llm_service.is_ollama_available():
        raise HTTPException(status_code=503, detail="LLM service unavailable.")
    result = await rag_service.insurance_query(body.query, body.patient_id)
    return result


@router.post("/predict-noshow")
async def predict_no_show(body: PredictionRequest):
    """Predict whether a patient will miss their appointment."""
    try:
        result = prediction_service.predict_no_show(
            age=body.age,
            gender=body.gender,
            day_of_week=body.day_of_week,
            hour_of_day=body.hour_of_day,
            previous_no_shows=body.previous_no_shows,
            days_until_appointment=body.days_until_appointment,
            has_insurance=body.has_insurance,
        )
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
