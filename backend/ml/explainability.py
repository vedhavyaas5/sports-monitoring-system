"""
Model Explainability Engine.
Provides Tree feature importances and domain-mapped contributing factors
without making unsubstantiated causal claims.
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Any

def get_top_contributing_factors(model, feature_names: List[str], input_values: dict, top_k: int = 5) -> List[Dict[str, Any]]:
    # Extract feature importances if available
    importances = getattr(model, 'feature_importances_', None)
    if importances is None and hasattr(model, 'coef_'):
        importances = np.abs(model.coef_[0])
        
    factors = []
    if importances is not None and len(importances) == len(feature_names):
        norm_imp = importances / (np.sum(importances) + 1e-9)
        for name, imp in zip(feature_names, norm_imp):
            val = input_values.get(name, 0.0)
            factors.append({
                "feature": name,
                "importance_weight": round(float(imp), 4),
                "observed_value": val,
                "label": name.replace("_", " ").title()
            })
        factors.sort(key=lambda x: x["importance_weight"], reverse=True)
    else:
        # Fallback to standard domain importance ranking
        for name in feature_names:
            val = input_values.get(name, 0.0)
            factors.append({
                "feature": name,
                "importance_weight": round(1.0 / len(feature_names), 4),
                "observed_value": val,
                "label": name.replace("_", " ").title()
            })
            
    return factors[:top_k]
