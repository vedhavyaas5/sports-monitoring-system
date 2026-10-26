"""
AI-Derived Recovery Indicator Engine.
Combines hydration, perceived recovery, training load, and stress metrics into
a normalized recovery score [0, 1].
Clearly labeled as an AI monitoring metric, NOT a clinical diagnosis.
"""
from typing import Dict, Any

def calculate_recovery_indicator(
    hydration_level: float = 0.70,
    stress_index: float = 0.35,
    fatigue_level: float = 0.30,
    pain_level: int = 0,
    training_load: float = 200.0
) -> Dict[str, Any]:
    
    hyd_score = min(max(hydration_level, 0.0), 1.0)
    stress_penalty = min(max(stress_index, 0.0), 1.0) * 0.25
    fatigue_penalty = min(max(fatigue_level, 0.0), 1.0) * 0.30
    pain_penalty = (min(max(pain_level, 0), 10) / 10.0) * 0.25
    load_penalty = min(max((training_load - 150.0) / 350.0, 0.0), 1.0) * 0.20
    
    raw_recovery = hyd_score * 0.40 + (1.0 - (stress_penalty + fatigue_penalty + pain_penalty + load_penalty)) * 0.60
    recovery_score = max(0.0, min(1.0, raw_recovery))
    
    if recovery_score >= 0.70:
        status = "OPTIMAL_RECOVERY"
        recommendation = "Athlete physiological indicators show good readiness."
    elif recovery_score >= 0.45:
        status = "MODERATE_RECOVERY"
        recommendation = "Normal recovery balance. Maintain standard training progression."
    else:
        status = "INSUFFICIENT_RECOVERY"
        recommendation = "Consider light recovery protocol, active hydration, and load modification."
        
    return {
        "recovery_score": round(recovery_score, 4),
        "recovery_pct": round(recovery_score * 100, 1),
        "status": status,
        "recommendation": recommendation,
        "disclaimer": "AI-derived recovery indicator for decision support. Not a validated medical assessment."
    }
