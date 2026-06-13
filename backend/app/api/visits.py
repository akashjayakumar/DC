from fastapi import APIRouter, Query
from app.models.visit import VisitCreate
from app.services import visit_service

router = APIRouter(prefix="/visits", tags=["Visits"])


@router.post("/", status_code=201)
async def create_visit(body: VisitCreate):
    return await visit_service.create_visit(body)


@router.get("/patient/{patient_id}")
async def get_visits(
    patient_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    return await visit_service.get_visits_for_patient(patient_id, skip=skip, limit=limit)


@router.get("/{visit_id}")
async def get_visit(visit_id: str):
    return await visit_service.get_visit(visit_id)
