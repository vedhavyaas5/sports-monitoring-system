"""
Physiological Wearable Sensor Service for Sports Injury AI Copilot.
Wraps XGBoost physiological model inference, telemetry aggregation, and feature attribution.
"""
import pandas as pd
from typing import Dict, Any, List
from backend.models_loader import get_sensor_model

SENSOR_FEATURES = [
    'heart_rate_bpm', 'oxygen_saturation_spo2', 'skin_temperature_celsius',
    'muscle_activation_emg', 'training_load', 'hydration_level',
    'stress_index', 'sensor_fatigue_index', 'hr_load_ratio',
    'emg_fatigue_interaction', 'physio_strain_index'
]

def predict_sensor_risk_score(data: Dict[str, Any]) -> Dict[str, Any]:
    model, meta = get_sensor_model()
    row = data.copy()

    # Auto-derive interaction variables if missing
    if row.get("sensor_fatigue_index") is None:
        row["sensor_fatigue_index"] = float(row.get("muscle_activation_emg", 0.6)) * float(row.get("training_load", 250.0)) / 100.0
    if row.get("hr_load_ratio") is None:
        row["hr_load_ratio"] = float(row.get("heart_rate_bpm", 145.0)) / (float(row.get("training_load", 250.0)) + 1.0)
    if row.get("emg_fatigue_interaction") is None:
        row["emg_fatigue_interaction"] = float(row.get("muscle_activation_emg", 0.6)) * float(row.get("sensor_fatigue_index", 1.5))
    if row.get("physio_strain_index") is None:
        row["physio_strain_index"] = 0.5 * (float(row.get("heart_rate_bpm", 145.0)) / 200.0) + 0.5 * (float(row.get("stress_index", 0.4)))
    if row.get("hydration_level") is None:
        row["hydration_level"] = float(row.get("hydration_level", 0.85))
    if row.get("stress_index") is None:
        row["stress_index"] = float(row.get("stress_index", 0.35))

    df = pd.DataFrame([row])[SENSOR_FEATURES]
    if model:
        proba = float(model.predict_proba(df)[0, 1])
    else:
        proba = 0.20

    category = "LOW" if proba < 0.40 else "MODERATE" if proba < 0.70 else "HIGH"
    importances = get_sensor_feature_importance()

    return {
        "risk_probability": round(proba, 4),
        "risk_category": category,
        "input_features": {k: row[k] for k in SENSOR_FEATURES if k in row},
        "top_contributing_features": importances[:3],
        "model_name": meta.get("model_name", "XGBoost Sensor Classifier") if meta else "XGBoost"
    }

def get_sensor_feature_importance() -> List[Dict[str, Any]]:
    model, meta = get_sensor_model()
    if not model or not hasattr(model, "feature_importances_"):
        return [
            {"feature": "training_load", "importance": 0.34, "description": "Cumulative acute cardiovascular and mechanical workload"},
            {"feature": "heart_rate_bpm", "importance": 0.27, "description": "Cardiovascular output and sustained tachycardia zone"},
            {"feature": "muscle_activation_emg", "importance": 0.21, "description": "Surface electromyography neuromuscular recruitment"},
            {"feature": "physio_strain_index", "importance": 0.18, "description": "Composite autonomic and thermal strain"}
        ]
    imps = model.feature_importances_
    res = []
    for f, imp in zip(SENSOR_FEATURES, imps):
        res.append({"feature": f, "importance": round(float(imp), 4)})
    res.sort(key=lambda x: x["importance"], reverse=True)
    return res
