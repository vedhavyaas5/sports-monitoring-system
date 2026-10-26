"""
Personalized Athlete Baseline Service.
Calculates athlete-specific normal ranges (mean, standard deviation, normal bounds)
across historical sessions and computes current z-score deviations.
"""
import json
import numpy as np
from typing import Dict, Any, List, Optional
from backend.database import get_db
from backend.data_store import get_athlete, update_athlete_baseline

def compute_athlete_baseline(athlete_id: str, min_samples: int = 5) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT data_json FROM measurements 
    WHERE athlete_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 200
    """, (athlete_id,))
    rows = cursor.fetchall()
    
    if len(rows) < min_samples:
        return None
        
    records = []
    for r in rows:
        try:
            records.append(json.loads(r[0]))
        except Exception:
            pass
            
    if len(records) < min_samples:
        return None
        
    metrics = [
        'heart_rate_bpm', 'training_load', 'postural_instability_index',
        'biomechanical_deviation_score', 'knee_flexion_angle', 'hip_flexion_angle'
    ]
    
    baseline = {"athlete_id": athlete_id, "sample_count": len(records), "metrics": {}}
    for m in metrics:
        vals = [r[m] for r in records if m in r and r[m] is not None]
        if len(vals) >= min_samples:
            mean = float(np.mean(vals))
            std = float(np.std(vals))
            baseline["metrics"][m] = {
                "mean": round(mean, 2),
                "std": round(std, 2),
                "normal_min": round(max(0.0, mean - 2 * std), 2),
                "normal_max": round(mean + 2 * std, 2)
            }
            
    update_athlete_baseline(athlete_id, baseline)
    return baseline

def evaluate_current_against_baseline(current_metrics: dict, baseline: Optional[dict]) -> Dict[str, Any]:
    if not baseline or not baseline.get("metrics"):
        return {"baseline_available": False, "deviations": {}, "composite_deviation_score": 0.0}
        
    deviations = {}
    z_scores = []
    for k, base in baseline["metrics"].items():
        if k in current_metrics and current_metrics[k] is not None:
            curr = float(current_metrics[k])
            mean = base["mean"]
            std = max(base["std"], 1e-4)
            z = (curr - mean) / std
            deviations[k] = {
                "current": curr,
                "baseline_mean": mean,
                "z_score": round(z, 2),
                "is_abnormal": abs(z) > 2.0
            }
            z_scores.append(abs(z))
            
    composite = float(np.mean(z_scores) / 3.0) if z_scores else 0.0
    return {
        "baseline_available": True,
        "sample_count": baseline.get("sample_count", 0),
        "deviations": deviations,
        "composite_deviation_score": round(float(np.clip(composite, 0.0, 1.0)), 4)
    }
