"""
Dataset Ingestion, Validation, and Quality Assurance Engine.
Audits raw and processed datasets for missing values, duplicates, out-of-range
physiological/biomechanical bounds, infinite values, and generates quality reports.
"""
import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REGISTRY_PATH = os.path.join(BASE_DIR, 'dataset_registry.json')

PHYSIOLOGICAL_BOUNDS = {
    'heart_rate_bpm': (35.0, 230.0),
    'oxygen_saturation_spo2': (75.0, 100.0),
    'skin_temperature_celsius': (28.0, 43.0),
    'muscle_activation_emg': (0.0, 1.5),
    'training_load': (0.0, 800.0),
    'hydration_level': (0.0, 1.0),
    'stress_index': (0.0, 1.0),
    'sensor_fatigue_index': (0.0, 1.0),
    'hip_flexion_angle': (40.0, 200.0),
    'knee_flexion_angle': (30.0, 190.0),
    'ankle_rotation_angle': (40.0, 150.0),
    'angular_velocity': (0.0, 15.0),
    'linear_acceleration': (0.0, 40.0),
    'ground_reaction_force': (200.0, 6000.0),
    'postural_instability_index': (0.0, 1.0),
    'biomechanical_deviation_score': (0.0, 1.0),
    'fatigue_level': (0.0, 1.0),
}

def load_dataset_registry() -> dict:
    if os.path.exists(REGISTRY_PATH):
        with open(REGISTRY_PATH, 'r') as f:
            return json.load(f)
    return {"registry_version": "2.0.0", "datasets": []}

def validate_dataset(filepath: str, dataset_id: Optional[str] = None) -> Dict[str, Any]:
    full_path = os.path.join(BASE_DIR, filepath) if not os.path.isabs(filepath) else filepath
    if not os.path.exists(full_path):
        return {"status": "ERROR", "error": f"File not found: {filepath}"}
    
    try:
        df = pd.read_csv(full_path)
    except Exception as e:
        return {"status": "ERROR", "error": f"Failed to parse CSV: {str(e)}"}
    
    n_rows, n_cols = df.shape
    missing = df.isnull().sum().to_dict()
    duplicates = int(df.duplicated().sum())
    inf_counts = {col: int(np.isinf(df[col]).sum()) for col in df.select_dtypes(include=[np.number]).columns}
    
    # Range checks
    bounds_violations = {}
    for col, (min_val, max_val) in PHYSIOLOGICAL_BOUNDS.items():
        if col in df.columns:
            out_of_bounds = int(((df[col] < min_val) | (df[col] > max_val)).sum())
            if out_of_bounds > 0:
                bounds_violations[col] = {
                    "violations": out_of_bounds,
                    "expected_range": [min_val, max_val],
                    "min_observed": float(df[col].min()),
                    "max_observed": float(df[col].max())
                }
                
    # Class distribution if target exists
    target_dist = {}
    for target_candidate in ['injury_risk', 'injury_event', 'target', 'label']:
        if target_candidate in df.columns:
            target_dist = df[target_candidate].value_counts().to_dict()
            target_dist = {str(k): int(v) for k, v in target_dist.items()}
            break
            
    is_valid = (sum(missing.values()) == 0) and (sum(inf_counts.values()) == 0) and (len(bounds_violations) == 0)
    
    return {
        "status": "VALID" if is_valid else "WARNINGS_FOUND",
        "dataset_id": dataset_id,
        "filename": os.path.basename(filepath),
        "total_samples": n_rows,
        "total_features": n_cols,
        "columns": list(df.columns),
        "missing_values": {k: int(v) for k, v in missing.items() if v > 0},
        "duplicate_rows": duplicates,
        "infinite_values": {k: int(v) for k, v in inf_counts.items() if v > 0},
        "physiological_bounds_violations": bounds_violations,
        "target_distribution": target_dist,
        "quality_score_pct": 100.0 if is_valid else max(0.0, 100.0 - (duplicates * 0.1 + len(bounds_violations) * 5.0))
    }

def validate_imaging_dataset(filepath: str, dataset_id: Optional[str] = None) -> Dict[str, Any]:
    full_path = os.path.join(BASE_DIR, filepath) if not os.path.isabs(filepath) else filepath
    if not os.path.exists(full_path):
        return {"status": "ERROR", "error": f"Path not found: {filepath}", "dataset_id": dataset_id}
    
    if os.path.isdir(full_path):
        image_files = []
        for root, _, files in os.walk(full_path):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.npy')):
                    image_files.append(os.path.join(root, f))
        n_samples = len(image_files)
        return {
            "status": "VALID" if n_samples > 0 else "WARNINGS_FOUND",
            "dataset_id": dataset_id,
            "filename": os.path.basename(filepath),
            "total_samples": n_samples,
            "storage_type": "directory_image_cohort",
            "quality_score_pct": 100.0 if n_samples > 0 else 0.0
        }
    elif full_path.endswith('.parquet'):
        try:
            import pyarrow.parquet as pq
            table = pq.read_table(full_path)
            return {
                "status": "VALID",
                "dataset_id": dataset_id,
                "filename": os.path.basename(filepath),
                "total_samples": table.num_rows,
                "columns": table.column_names,
                "storage_type": "parquet_columnar",
                "quality_score_pct": 100.0
            }
        except Exception as e:
            return {"status": "ERROR", "error": str(e), "dataset_id": dataset_id}
    else:
        return {
            "status": "VALID",
            "dataset_id": dataset_id,
            "filename": os.path.basename(filepath),
            "total_samples": 1,
            "quality_score_pct": 100.0
        }

def generate_quality_reports() -> Dict[str, Any]:
    registry = load_dataset_registry()
    reports = []
    for entry in registry.get("datasets", []):
        if entry.get("modality") == "mri_imaging":
            rep = validate_imaging_dataset(entry.get("filepath"), entry.get("id"))
            reports.append(rep)
        else:
            rep = validate_dataset(entry.get("filepath"), entry.get("id"))
            reports.append(rep)
    return {
        "reports": reports,
        "total_audited": len(reports),
        "all_valid": all(r["status"] == "VALID" for r in reports)
    }
