from fastapi import APIRouter, File, Form, UploadFile
from app.models.document import DocumentType
from app.services import document_service
from app.rag.ingest import ingest_document

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", status_code=201)
async def upload_document(
    patient_id: str = Form(...),
    file_type: DocumentType = Form(...),
    file: UploadFile = File(...),
):
    """Upload a document and automatically ingest it into the RAG vector store."""
    doc = await document_service.upload_document(patient_id, file_type, file)

    # Background RAG ingestion (runs inline for now; move to Celery/BackgroundTasks later)
    try:
        chunk_count = await ingest_document(doc["_id"])
        doc["chunks_ingested"] = chunk_count
    except Exception as e:
        doc["chunks_ingested"] = 0
        doc["ingest_warning"] = str(e)

    return doc


@router.get("/patient/{patient_id}")
async def list_patient_documents(patient_id: str):
    return await document_service.list_documents_for_patient(patient_id)
