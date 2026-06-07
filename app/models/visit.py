from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


# ── Request / Response schemas ──────────────────────────────────────────────

class VisitCreate(BaseModel):
    patient_id: str = Field(..., examples=["665f1a2b3c4d5e6f7a8b9c0d"])
    date: datetime = Field(default_factory=datetime.utcnow)
    chief_complaint: Optional[str] = Field(default=None, max_length=500, examples=["Tooth pain upper left"])
    diagnosis: str = Field(..., max_length=500, examples=["Dental Caries – Class II"])
    treatment: str = Field(..., max_length=500, examples=["Composite Filling"])
    teeth_involved: list[str] = Field(default_factory=list, examples=[["#14", "#15"]])
    medications_prescribed: list[str] = Field(default_factory=list, examples=[["Ibuprofen 400mg", "Amoxicillin 500mg"]])
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    cost: Optional[float] = Field(default=None, ge=0)


class VisitResponse(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    date: datetime
    chief_complaint: Optional[str] = None
    diagnosis: str
    treatment: str
    teeth_involved: list[str] = []
    medications_prescribed: list[str] = []
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None
    cost: Optional[float] = None
    created_at: datetime

    model_config = {"populate_by_name": True}
