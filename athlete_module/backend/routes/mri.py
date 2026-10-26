"""
POST /api/mri/analyze   — MRI injury level prediction
"""
import os, time
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from ..services.mri_injury_service import (
    validate_mri_upload, predict_injury_level
)
from ..services.session_store import get_session, save_session

router = APIRouter(prefix="/api/mri", tags=["MRI Analysis"])

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif'}


@router.post("/analyze")
async def analyze_mri(
    file:       UploadFile = File(...),
    athlete_id: str        = Form(default="unknown"),
    session_id: str        = Form(default=""),
):
    """
    Analyse an uploaded MRI image for injury severity.
    Returns a 4-level injury grade with confidence and recommendations.

    DISCLAIMER: Output is AI-based analysis — NOT a medical diagnosis.
    """
    fname = file.filename or "upload.jpg"
    ext   = os.path.splitext(fname)[1].lower()

    # Extension check (more reliable than content-type)
    if ext and ext not in ALLOWED_EXTENSIONS:
        ct = (file.content_type or "").split(";")[0].strip().lower()
        if not ct.startswith("image/"):
            raise HTTPException(
                status_code=422,
                detail=(
                    f'Unsupported file format "{ext}". '
                    f'Please upload: JPG, JPEG, PNG, WEBP, BMP, TIFF.'
                )
            )

    content = await file.read()

    # Validate image
    try:
        validate_mri_upload(content, fname)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Run injury level analysis
    try:
        result = predict_injury_level(content, athlete_id=athlete_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"MRI analysis failed: {str(e)}"
        )

    # Attach to session if provided
    if session_id:
        existing = get_session(session_id)
        if existing:
            existing["mri_available"]  = True
            existing["mri_grade"]      = result["grade"]
            existing["mri_severity"]   = result["severity"]
            existing["mri_confidence"] = result["confidence"]
            if "fusion_payload" in existing:
                existing["fusion_payload"]["mri"] = {
                    "available":    True,
                    "grade":        result["grade"],
                    "severity":     result["severity"],
                    "confidence":   result["confidence"],
                    "injury_score": result["injury_score"],
                }
    else:
        save_session({
            "athlete_id":    athlete_id,
            "timestamp":     time.time(),
            "mri_available": True,
            "mri_grade":     result["grade"],
            "mri_severity":  result["severity"],
            "mri_confidence":result["confidence"],
            "fusion_payload": {
                "athlete_id": athlete_id,
                "self_assessment": None,
                "symptom_indicators": None,
                "mri": {
                    "available":    True,
                    "grade":        result["grade"],
                    "severity":     result["severity"],
                    "confidence":   result["confidence"],
                    "injury_score": result["injury_score"],
                },
            },
        })

    return {
        "athlete_id":          result["athlete_id"],
        "filename":            fname,
        "grade":               result["grade"],
        "grade_label":         result["grade_label"],
        "severity":            result["severity"],
        "severity_label":      result["severity_label"],
        "severity_color":      result["severity_color"],
        "confidence":          result["confidence"],
        "confidence_pct":      result["confidence_pct"],
        "injury_score":        result["injury_score"],
        "injury_score_pct":    result["injury_score_pct"],
        "description":         result["description"],
        "recommendation":      result["recommendation"],
        "radiological_features": result["radiological_features"],
        "all_grades":          result["all_grades"],
        "analysis_time_ms":    result["analysis_time_ms"],
        "disclaimer":          result["disclaimer"],
        "mri_fusion_payload": {
            "available":    True,
            "grade":        result["grade"],
            "severity":     result["severity"],
            "confidence":   result["confidence"],
            "injury_score": result["injury_score"],
        },
    }


@router.get("/grades")
def get_grade_info():
    """Return the injury grade definitions."""
    from ..services.mri_injury_service import GRADES, DISCLAIMER
    return {"grades": GRADES, "disclaimer": DISCLAIMER}
