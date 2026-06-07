from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.db.mongo import get_visits_collection, get_patients_collection
from app.models.visit import VisitCreate


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail=f"Invalid ID: {id_str}")


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


async def create_visit(data: VisitCreate) -> dict:
    # Verify patient exists
    patients = get_patients_collection()
    patient = await patients.find_one({"_id": _oid(data.patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    col = get_visits_collection()
    now = datetime.utcnow()
    doc = {
        **data.model_dump(),
        "created_at": now,
    }
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    return _serialize(created)


async def get_visits_for_patient(patient_id: str, skip: int = 0, limit: int = 50) -> list[dict]:
    # Verify patient exists
    patients = get_patients_collection()
    patient = await patients.find_one({"_id": _oid(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    col = get_visits_collection()
    cursor = col.find({"patient_id": patient_id}).skip(skip).limit(limit).sort("date", -1)
    return [_serialize(doc) async for doc in cursor]


async def get_visit(visit_id: str) -> dict:
    col = get_visits_collection()
    doc = await col.find_one({"_id": _oid(visit_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Visit not found")
    return _serialize(doc)
