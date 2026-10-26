"""
Self-Assessment REST Router.
Endpoints:
- POST /api/assessment : Submit athlete subjective check-in, extract NLP symptoms & compute composite risk
- GET /api/assessment/history : Retrieve recent self-assessments
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.services.assessment_service import process_self_assessment_payload
from backend.data_store import save_self_assessment, get_self_assessments
from backend.database import get_db

router = APIRouter(prefix="/api/assessment", tags=["Athlete Self-Assessment"])

class SelfAssessmentRequest(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    pain_level: int = Field(0, ge=0, le=10)
    pain_locations: List[str] = Field(default_factory=list)
    fatigue_level: int = Field(0, ge=0, le=10)
    symptoms: List[str] = Field(default_factory=list)
    training_intensity: int = Field(3, ge=1, le=5)
    training_duration_min: int = Field(60, ge=0, le=480)
    previous_injury: bool = False
    description: Optional[str] = Field("", max_length=1000)

@router.post("")
def submit_assessment(payload: SelfAssessmentRequest):
    data = payload.model_dump()
    result = process_self_assessment_payload(data)
    record_id = save_self_assessment(result)
    result["id"] = record_id
    return result

@router.get("/history")
def assessment_history(athlete_id: Optional[str] = None, limit: int = 30):
    return get_self_assessments(athlete_id=athlete_id, limit=limit)
