"""
Temporal Risk Trend Analysis Engine.
Calculates short-term and long-term slopes, rolling averages, sudden spikes,
and persistent elevated indicators over historical sessions.
"""
import numpy as np
from typing import List, Dict, Any

def analyze_temporal_trend(risk_history: List[float], window_size: int = 7) -> Dict[str, Any]:
    if not risk_history or len(risk_history) < 2:
        return {
            "trend": "STABLE",
            "slope": 0.0,
            "rolling_avg": round(risk_history[0], 4) if risk_history else 0.0,
            "spike_detected": False,
            "recent_min": round(risk_history[0], 4) if risk_history else 0.0,
            "recent_max": round(risk_history[0], 4) if risk_history else 0.0,
            "trend_score": 0.0,
            "description": "Insufficient historical points for trend modeling."
        }
        
    recent = risk_history[-window_size:]
    x = np.arange(len(recent))
    y = np.array(recent, dtype=float)
    
    # 1. Slope via linear regression
    slope, _ = np.polyfit(x, y, 1)
    
    # 2. Spike detection: delta in last 3 entries >= 0.25
    spike = False
    if len(recent) >= 3:
        spike = (recent[-1] - recent[-3]) >= 0.25
        
    # 3. Rolling average
    rolling_avg = float(np.mean(recent))
    
    # 4. Trend categorization
    if slope > 0.008 or spike:
        trend = "RISING"
        desc = "Increasing risk trajectory detected over recent observation window."
    elif slope < -0.008:
        trend = "FALLING"
        desc = "Gradual decrease in computed multi-modal risk markers (positive recovery trend)."
    else:
        trend = "STABLE"
        desc = "Risk indicators remain steady within normal variation bounds."
        
    # Normalized trend score [0, 1] for risk fusion
    trend_score = float(np.clip(rolling_avg + (slope * 5.0), 0.0, 1.0))
    
    return {
        "trend": trend,
        "slope": round(float(slope), 5),
        "rolling_avg": round(rolling_avg, 4),
        "spike_detected": spike,
        "recent_min": round(float(np.min(recent)), 4),
        "recent_max": round(float(np.max(recent)), 4),
        "trend_score": round(trend_score, 4),
        "description": desc
    }
