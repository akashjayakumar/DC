import os
import uuid
from datetime import datetime
from pathlib import Path

from bson import ObjectId
from fastapi import HTTPException, UploadFile

from app.config import settings
from app.db.mongo import get_documents_collection, get_patients_collection
from app.models.document import DocumentType


ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain",
}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


def _ensure_upload_dir():
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


async def upload_document(
    patient_id: str,
    file_type: DocumentType,
    file: UploadFile,
) -> dict:
    # Verify patient exists
    patients = get_patients_collection()
    patient = await patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, JPEG, PNG, TXT",
        )

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit")

    # Save to disk
    _ensure_upload_dir()
    ext = Path(file.filename or "file").suffix
    saved_name = f"{uuid.uuid4().hex}{ext}"
    save_path = Path(settings.upload_dir) / saved_name
    save_path.write_bytes(content)

    # Persist metadata to MongoDB
    col = get_documents_collection()
    doc = {
        "patient_id": patient_id,
        "file_name": saved_name,        # disk name
        "original_name": file.filename,  # original user filename
        "file_type": file_type,
        "mime_type": file.content_type,
        "file_size_bytes": len(content),
        "upload_date": datetime.utcnow(),
        "extracted_text": None,
        "ingested_to_chroma": False,
    }
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})

    return _serialize(created)


async def list_documents_for_patient(patient_id: str) -> list[dict]:
    col = get_documents_collection()
    cursor = col.find({"patient_id": patient_id}).sort("upload_date", -1)
    return [_serialize(doc) async for doc in cursor]
