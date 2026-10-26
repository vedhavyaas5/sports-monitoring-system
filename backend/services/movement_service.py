"""
Movement Biomechanics Model Service for Sports Injury AI Copilot.
Wraps Decision Tree model inference, feature attribution, and kinematics analysis.
"""
import pandas as pd
from typing import Dict, Any, List
from backend.models_loader import get_movement_model

MOVEMENT_FEATURES = [
    'hip_flexion_angle', 'knee_flexion_angle', 'ankle_rotation_angle',
    'angular_velocity', 'linear_acceleration', 'ground_reaction_force',
    'postural_instability_index', 'biomechanical_deviation_score',
    'fatigue_level', 'movement_intensity', 'biomechanical_risk_index',
    'movement_asymmetry', 'fatigue_grf_interaction'
]

def predict_movement_risk_score(data: Dict[str, Any]) -> Dict[str, Any]:
    model, meta = get_movement_model()
    row = data.copy()
    
    # Auto-derive interaction variables if missing
    if row.get("movement_intensity") is None:
        row["movement_intensity"] = float(row.get("angular_velocity", 2.8)) * float(row.get("linear_acceleration", 7.5))
    if row.get("biomechanical_risk_index") is None:
        row["biomechanical_risk_index"] = 0.5 * float(row.get("postural_instability_index", 0.3)) + 0.5 * float(row.get("biomechanical_deviation_score", 0.28))
    if row.get("fatigue_grf_interaction") is None:
        row["fatigue_grf_interaction"] = float(row.get("fatigue_level", 0.4)) * float(row.get("ground_reaction_force", 1800.0))
    if row.get("movement_asymmetry") is None:
        row["movement_asymmetry"] = float(row.get("movement_asymmetry", 0.0))

    df = pd.DataFrame([row])[MOVEMENT_FEATURES]
    if model:
        proba = float(model.predict_proba(df)[0, 1])
    else:
        proba = 0.25 # baseline fallback

    category = "LOW" if proba < 0.40 else "MODERATE" if proba < 0.70 else "HIGH"

    # Feature importance
    importances = get_movement_feature_importance()

    return {
        "risk_probability": round(proba, 4),
        "risk_category": category,
        "input_features": {k: row[k] for k in MOVEMENT_FEATURES if k in row},
        "top_contributing_features": importances[:3],
        "model_name": meta.get("model_name", "Decision Tree Biomechanics Classifier") if meta else "Decision Tree"
    }

def get_movement_feature_importance() -> List[Dict[str, Any]]:
    model, meta = get_movement_model()
    if not model or not hasattr(model, "feature_importances_"):
        return [
            {"feature": "ground_reaction_force", "importance": 0.38, "description": "Peak impact attenuation during landing"},
            {"feature": "biomechanical_deviation_score", "importance": 0.29, "description": "Deviation from calibrated personal joint plane"},
            {"feature": "postural_instability_index", "importance": 0.18, "description": "Center of mass sway and lateral knee collapse"},
            {"feature": "fatigue_grf_interaction", "importance": 0.15, "description": "Fatigue-induced amplification of landing impact"}
        ]
    imps = model.feature_importances_
    res = []
    for f, imp in zip(MOVEMENT_FEATURES, imps):
        res.append({"feature": f, "importance": round(float(imp), 4)})
    res.sort(key=lambda x: x["importance"], reverse=True)
    return res
