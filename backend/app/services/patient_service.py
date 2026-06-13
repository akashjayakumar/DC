from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.db.mongo import get_patients_collection
from app.models.patient import PatientCreate, PatientUpdate


def _oid(patient_id: str) -> ObjectId:
    """Convert string to ObjectId, raise 400 on invalid format."""
    try:
        return ObjectId(patient_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail=f"Invalid patient ID: {patient_id}")


def _serialize(doc: dict) -> dict:
    """Convert _id ObjectId → str for JSON serialisation."""
    doc["_id"] = str(doc["_id"])
    return doc


async def create_patient(data: PatientCreate) -> dict:
    col = get_patients_collection()
    now = datetime.utcnow()
    doc = {
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    return _serialize(created)


async def list_patients(skip: int = 0, limit: int = 50) -> list[dict]:
    col = get_patients_collection()
    cursor = col.find({}).skip(skip).limit(limit).sort("created_at", -1)
    return [_serialize(doc) async for doc in cursor]


async def get_patient(patient_id: str) -> dict:
    col = get_patients_collection()
    doc = await col.find_one({"_id": _oid(patient_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _serialize(doc)


async def update_patient(patient_id: str, data: PatientUpdate) -> dict:
    col = get_patients_collection()
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.utcnow()
    result = await col.update_one({"_id": _oid(patient_id)}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return await get_patient(patient_id)


async def delete_patient(patient_id: str) -> dict:
    col = get_patients_collection()
    result = await col.delete_one({"_id": _oid(patient_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted", "id": patient_id}
