from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


# ── Helpers ────────────────────────────────────────────────────────────────

class PyObjectId(str):
    """Coerce MongoDB ObjectId ↔ str for Pydantic v2."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if ObjectId.is_valid(str(v)):
            return str(v)
        raise ValueError(f"Invalid ObjectId: {v}")


# ── Request / Response schemas ──────────────────────────────────────────────

class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["John Doe"])
    age: int = Field(..., ge=0, le=150, examples=[45])
    gender: str = Field(..., pattern="^(Male|Female|Other)$", examples=["Male"])
    phone: str = Field(..., min_length=7, max_length=20, examples=["9876543210"])
    email: Optional[str] = Field(default=None, examples=["john@example.com"])
    conditions: list[str] = Field(default_factory=list, examples=[["Diabetes", "Hypertension"]])
    allergies: list[str] = Field(default_factory=list, examples=[["Penicillin"]])
    notes: Optional[str] = Field(default=None, max_length=1000)


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[str] = Field(default=None, pattern="^(Male|Female|Other)$")
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)
    email: Optional[str] = None
    conditions: Optional[list[str]] = None
    allergies: Optional[list[str]] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class PatientResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    age: int
    gender: str
    phone: str
    email: Optional[str] = None
    conditions: list[str] = []
    allergies: list[str] = []
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}
