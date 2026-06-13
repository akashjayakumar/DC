from fastapi import APIRouter, Query
from app.models.patient import PatientCreate, PatientUpdate
from app.services import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", status_code=201)
async def create_patient(body: PatientCreate):
    return await patient_service.create_patient(body)


@router.get("/")
async def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    return await patient_service.list_patients(skip=skip, limit=limit)


@router.get("/{patient_id}")
async def get_patient(patient_id: str):
    return await patient_service.get_patient(patient_id)


@router.put("/{patient_id}")
async def update_patient(patient_id: str, body: PatientUpdate):
    return await patient_service.update_patient(patient_id, body)


@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    return await patient_service.delete_patient(patient_id)
