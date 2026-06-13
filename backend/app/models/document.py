from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


DocumentType = Literal["clinical_note", "treatment_report", "insurance", "xray", "lab_result", "other"]


class DocumentResponse(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    file_name: str
    file_type: DocumentType
    original_name: str
    mime_type: str
    file_size_bytes: int
    upload_date: datetime
    extracted_text: Optional[str] = None  # populated after RAG ingestion
    ingested_to_chroma: bool = False

    model_config = {"populate_by_name": True}
