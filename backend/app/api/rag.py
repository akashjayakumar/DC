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


@router.post("/patient-filter")
async def patient_filter(body: QueryRequest):
    """Natural language filter over patient records (conditions, age, etc) — not RAG, direct DB query."""
    from app.db.mongo import get_patients_collection
    col = get_patients_collection()
    all_patients = await col.find({}).to_list(length=1000)
    for p in all_patients:
        p["_id"] = str(p["_id"])

    patient_summary = "\n".join(
        f"- {p['name']} | age {p['age']} | conditions: {', '.join(p.get('conditions', [])) or 'none'}"
        for p in all_patients
    )
    prompt = f"""Here is a list of patients:
{patient_summary}

Question: {body.query}

Return ONLY the matching patient names as a simple list, one per line. If none match, say "No matching patients found."
"""
    answer = await llm_service.generate(prompt, system="You are a clinic data assistant. Be concise and only output names.")
    return {"answer": answer}
    
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
