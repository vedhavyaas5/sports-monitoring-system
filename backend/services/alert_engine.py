"""
Intelligent Rule-Based Alert Evaluation Engine.
Monitors multi-factor conditions and dispatches INFO, WARNING, and HIGH PRIORITY notifications.
"""
import time
from typing import List, Dict, Any, Optional
from backend.data_store import add_alert

def evaluate_and_dispatch_alerts(
    athlete_id: str,
    session_id: Optional[str],
    current_data: dict,
    risk_result: dict,
    self_assessment: Optional[dict] = None
) -> List[dict]:
    
    alerts_fired = []
    reasons = []
    severity = "INFO"
    
    overall_pct = risk_result.get("overall_risk_pct", 0.0)
    movement_risk = risk_result.get("movement_risk", 0.0)
    sensor_risk = risk_result.get("sensor_risk", 0.0)
    trend = risk_result.get("trend", "STABLE")
    
    # 1. High Priority Conditions
    if overall_pct >= 70.0 or risk_result.get("consecutive_high", 0) >= 3:
        severity = "HIGH PRIORITY"
        reasons.append("Persistent elevated multi-modal risk threshold reached")
        
    if self_assessment and self_assessment.get("pain_level", 0) >= 7:
        severity = "HIGH PRIORITY"
        reasons.append(f"Severe subjective pain reported (Score {self_assessment['pain_level']}/10)")
        
    # 2. Warning Conditions
    if movement_risk >= 0.70:
        if severity != "HIGH PRIORITY": severity = "WARNING"
        reasons.append("High-risk biomechanical movement deviation detected")
        
    if sensor_risk >= 0.70:
        if severity != "HIGH PRIORITY": severity = "WARNING"
        reasons.append("Critical physiological cardiovascular/fatigue strain detected")
        
    if current_data.get("fatigue_level", 0) > 0.75:
        if severity != "HIGH PRIORITY": severity = "WARNING"
        reasons.append("Elevated physical fatigue marker")
        
    if current_data.get("training_load", 0) > 390:
        if severity != "HIGH PRIORITY": severity = "WARNING"
        reasons.append("Excessive cumulative workload")
        
    if trend == "RISING":
        reasons.append("Rapidly escalating risk trajectory over recent monitoring window")
        
    if reasons:
        alert_obj = {
            "athlete_id": athlete_id,
            "session_id": session_id,
            "level": severity,
            "severity": severity,
            "risk_score": overall_pct,
            "reasons": reasons,
            "reason": "; ".join(reasons),
            "related_features": {
                "movement_risk": movement_risk,
                "sensor_risk": sensor_risk,
                "overall_risk_pct": overall_pct
            }
        }
        saved = add_alert(alert_obj)
        alerts_fired.append(saved)
        
    return alerts_fired
