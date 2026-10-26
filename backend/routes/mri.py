"""
MRI Analysis REST Router.
Endpoints:
- POST /api/mri/analyze : Upload MRI image for quality check, deep feature extraction, 4-level grading & heatmap
- GET /api/mri/history : View past MRI analysis records
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from backend.services.mri_service import analyze_mri_image, GRADES, DISCLAIMER
from backend.data_store import save_mri_record, get_mri_records

router = APIRouter(prefix="/api/mri", tags=["MRI Analysis"])

@router.post("/analyze")
async def analyze_mri(
    file: UploadFile = File(...),
    athlete_id: str = Form(default="07"),
    session_id: Optional[str] = Form(default=None)
):
    try:
        content = await file.read()
        fname = file.filename or "upload.jpg"
        result = analyze_mri_image(content, fname, athlete_id)
        result["session_id"] = session_id
        record_id = save_mri_record(result)
        result["id"] = record_id
        return result
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MRI Processing error: {str(e)}")

@router.get("/grades")
def get_grades_reference():
    return {"grades": GRADES, "disclaimer": DISCLAIMER}

@router.get("/history")
def mri_history(athlete_id: Optional[str] = None, limit: int = 20):
    return get_mri_records(athlete_id=athlete_id, limit=limit)


import os
import base64
from backend.config import BASE_DIR

SAMPLE_SCANS = {
    "knee_meniscus_tear": {
        "id": "knee_meniscus_tear",
        "title": "Knee Meniscus Tear",
        "joint": "Knee Joint",
        "expected_severity": "Moderate (Grade 2)",
        "path": "dataset/raw/knee_meniscus/valid/meniscus/1131.npy.jpg",
        "description": "Coronal slice displaying hyperintense linear meniscus tear extending to the inferior articular surface."
    },
    "intact_knee": {
        "id": "intact_knee",
        "title": "Intact Knee Normal",
        "joint": "Knee Joint",
        "expected_severity": "Normal (Grade 0)",
        "path": "dataset/raw/knee_meniscus/valid/healthy/1130.npy.jpg",
        "description": "Baseline slice showing uniform low signal intensity and preserved joint morphology."
    },
    "shoulder_fracture": {
        "id": "shoulder_fracture",
        "title": "Shoulder / Extremity Fracture",
        "joint": "Shoulder & Upper Extremity",
        "expected_severity": "Severe (Grade 3)",
        "path": "dataset/raw/shoulder_extremity/valid/100_jpg.rf.36c2bff933764b32141d6207c71159ee.jpg",
        "description": "Radiographic view displaying acute cortical bone discontinuity and structural displacement."
    },
    "mild_joint_strain": {
        "id": "mild_joint_strain",
        "title": "Mild Ligament Strain",
        "joint": "Knee / Patella",
        "expected_severity": "Mild (Grade 1)",
        "path": "dataset/raw/knee_mri/extracted_sample/slice_12.jpg",
        "description": "Subtle soft tissue signal elevation without macroscopic disruption of the ligament fibers."
    }
}

@router.get("/samples")
def get_sample_scans():
    samples_list = []
    for s_id, s_info in SAMPLE_SCANS.items():
        fp = os.path.join(BASE_DIR, s_info["path"])
        thumb_b64 = None
        if os.path.exists(fp):
            with open(fp, "rb") as f:
                thumb_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()
        samples_list.append({
            "id": s_id,
            "title": s_info["title"],
            "joint": s_info["joint"],
            "expected_severity": s_info["expected_severity"],
            "description": s_info["description"],
            "thumbnail_b64": thumb_b64
        })
    return {"samples": samples_list}

@router.post("/analyze-sample/{sample_id}")
async def analyze_sample_scan(
    sample_id: str,
    athlete_id: str = Form(default="07"),
    session_id: Optional[str] = Form(default=None)
):
    if sample_id not in SAMPLE_SCANS:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")
    s_info = SAMPLE_SCANS[sample_id]
    fp = os.path.join(BASE_DIR, s_info["path"])
    if not os.path.exists(fp):
        raise HTTPException(status_code=404, detail="Sample image file not found on server.")
    with open(fp, "rb") as f:
        content = f.read()
    fname = os.path.basename(fp)
    result = analyze_mri_image(content, fname, athlete_id)
    result["sample_title"] = s_info["title"]
    result["sample_joint"] = s_info["joint"]
    result["session_id"] = session_id
    record_id = save_mri_record(result)
    result["id"] = record_id
    return result
