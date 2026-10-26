"""
Self-Assessment and MRI analysis routes merged into main backend (port 8000).
Athlete module is now fully integrated — no second server needed.
"""
import os, sys, time, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel, Field
from typing import List, Optional

# ── Re-use athlete module services ────────────────────────────────────────────
from athlete_module.backend.services.assessment_service import (
    preprocess_self_assessment,
    extract_symptom_indicators,
    extract_keywords_from_text,
    risk_status_label,
)
from athlete_module.backend.services.mri_injury_service import (
    validate_mri_upload,
    predict_injury_level,
)
from athlete_module.backend.services.session_store import (
    save_session, get_session, get_athlete_sessions, list_sessions
)
from athlete_module.backend.schemas import (
    SelfAssessmentInput, SessionType, Intensity, PainLocation, Symptom
)

router = APIRouter(tags=["Athlete Assessment & MRI"])

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif'}

DISCLAIMER = (
    "This system provides AI-based risk indicators for monitoring and "
    "decision support. It does not provide a medical diagnosis or replace "
    "professional assessment."
)

# ── Self-Assessment ───────────────────────────────────────────────────────────
@router.post("/api/self-assessment")
def submit_assessment(data: SelfAssessmentInput):
    try:
        features   = preprocess_self_assessment(data)
        indicators = extract_symptom_indicators(data, features)
        keywords   = extract_keywords_from_text(data.description or "")
        status     = risk_status_label(features.overall_risk_score)
    except Exception as e:
        raise HTTPException(422, f"Preprocessing failed: {e}")

    fusion_payload = {
        "athlete_id": data.athlete_id,
        "self_assessment": {
            "pain_level":          features.pain_level,
            "fatigue_level":       features.fatigue_level,
            "stiffness":           bool(features.stiffness),
            "swelling":            bool(features.swelling),
            "weakness":            bool(features.weakness),
            "numbness":            bool(features.numbness),
            "reduced_rom":         bool(features.reduced_rom),
            "movement_difficulty": bool(features.movement_difficulty),
            "training_intensity":  features.training_intensity,
            "overall_risk_score":  features.overall_risk_score,
        },
        "symptom_indicators": indicators.model_dump(),
        "text_keywords":      keywords,
        "mri":                {"available": False},
    }

    session_record = {
        "athlete_id":        data.athlete_id,
        "session_type":      data.session_type.value,
        "timestamp":         time.time(),
        "pain_level":        data.pain_level,
        "pain_locations":    [p.value for p in data.pain_locations],
        "fatigue_level":     data.fatigue_level,
        "symptoms":          [s.value for s in data.symptoms],
        "training_intensity":data.training_intensity.value,
        "training_duration_min": data.training_duration_min,
        "previous_injury":   data.previous_injury,
        "features":          features.model_dump(),
        "indicators":        indicators.model_dump(),
        "fusion_payload":    fusion_payload,
        "status_label":      status,
        "mri_available":     False,
    }
    session_id = save_session(session_record)

    return {
        "athlete_id":          data.athlete_id,
        "session_id":          session_id,
        "timestamp":           session_record["timestamp"],
        "features":            features.model_dump(),
        "indicators":          indicators.model_dump(),
        "text_keywords":       keywords,
        "status_label":        status,
        "risk_fusion_payload": fusion_payload,
        "disclaimer":          DISCLAIMER,
    }


# ── MRI Analysis ──────────────────────────────────────────────────────────────
@router.post("/api/mri/analyze")
async def analyze_mri(
    file:       UploadFile = File(...),
    athlete_id: str        = Form(default="unknown"),
    session_id: str        = Form(default=""),
):
    fname = file.filename or "upload.jpg"
    ext   = os.path.splitext(fname)[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        ct = (file.content_type or "").split(";")[0].strip().lower()
        if not ct.startswith("image/"):
            raise HTTPException(422,
                f'Unsupported format "{ext}". Use JPG, PNG, WEBP, BMP, TIFF.')

    content = await file.read()
    try:
        validate_mri_upload(content, fname)
    except ValueError as e:
        raise HTTPException(422, str(e))

    try:
        result = predict_injury_level(content, athlete_id=athlete_id)
    except Exception as e:
        raise HTTPException(500, f"MRI analysis failed: {str(e)}")

    if session_id:
        existing = get_session(session_id)
        if existing:
            existing.update({
                "mri_available":  True,
                "mri_grade":      result["grade"],
                "mri_severity":   result["severity"],
                "mri_confidence": result["confidence"],
            })

    return {
        "athlete_id":            athlete_id,
        "filename":              fname,
        "grade":                 result["grade"],
        "grade_label":           result["grade_label"],
        "severity":              result["severity"],
        "severity_label":        result["severity_label"],
        "severity_color":        result["severity_color"],
        "confidence":            result["confidence"],
        "confidence_pct":        result["confidence_pct"],
        "injury_score":          result["injury_score"],
        "injury_score_pct":      result["injury_score_pct"],
        "description":           result["description"],
        "recommendation":        result["recommendation"],
        "radiological_features": result["radiological_features"],
        "all_grades":            result["all_grades"],
        "analysis_time_ms":      result["analysis_time_ms"],
        "mri_fusion_payload": {
            "available":    True,
            "grade":        result["grade"],
            "severity":     result["severity"],
            "confidence":   result["confidence"],
            "injury_score": result["injury_score"],
        },
        "disclaimer": result["disclaimer"],
    }


@router.get("/api/mri/grades")
def mri_grade_info():
    from athlete_module.backend.services.mri_injury_service import GRADES, DISCLAIMER as D
    return {"grades": GRADES, "disclaimer": D}


# ── Assessment session endpoints ──────────────────────────────────────────────
@router.get("/api/assessment/sessions")
def get_assessment_sessions(athlete_id: Optional[str] = None):
    if athlete_id:
        return get_athlete_sessions(athlete_id)
    return list_sessions()

@router.get("/api/assessment/sessions/{session_id}")
def get_assessment_session(session_id: str):
    s = get_session(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    return s

# needed for Optional import
from typing import Optional
