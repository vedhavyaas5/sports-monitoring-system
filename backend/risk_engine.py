"""
Upgraded 5-Input Multimodal Risk Fusion Engine.
Fuses:
1. Physical movement biomechanics model
2. Wearable physiological sensor model
3. Athlete self-assessment symptom indicators
4. MRI injury severity model (when available)
5. Temporal trend & personalized baseline deviation

Supports dynamic weight reconfiguration, EMA smoothing, and explainability.
"""
import os
import json
import time
import logging
import numpy as np
import pandas as pd
from collections import deque
from typing import Dict, Any, Optional, List
from backend.models_loader import get_movement_model, get_sensor_model
from backend.services.trend_analysis import analyze_temporal_trend
from backend.services.baseline_service import evaluate_current_against_baseline
from backend.ml.explainability import get_top_contributing_factors

logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config', 'risk_fusion.json')

MOVEMENT_COLS = [
    'hip_flexion_angle', 'knee_flexion_angle', 'ankle_rotation_angle',
    'angular_velocity', 'linear_acceleration', 'ground_reaction_force',
    'postural_instability_index', 'biomechanical_deviation_score',
    'fatigue_level', 'movement_intensity', 'biomechanical_risk_index',
    'movement_asymmetry', 'fatigue_grf_interaction'
]

SENSOR_COLS = [
    'heart_rate_bpm', 'oxygen_saturation_spo2', 'skin_temperature_celsius',
    'muscle_activation_emg', 'training_load', 'hydration_level',
    'stress_index', 'sensor_fatigue_index', 'fatigue_adjusted_load',
    'physiological_stress_score', 'recovery_index', 'cardiovascular_load'
]

def load_fusion_config() -> dict:
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "weights": {"movement_weight": 0.30, "sensor_weight": 0.25, "self_assessment_weight": 0.20, "mri_weight": 0.15, "trend_weight": 0.10},
        "mri_fallback_redistribution": {"movement_weight": 0.35, "sensor_weight": 0.30, "self_assessment_weight": 0.25, "trend_weight": 0.10},
        "ema_alpha": 0.30,
        "single_indicator_escalation_threshold": 0.85
    }

class RiskEngine:
    def __init__(self):
        self._ema_risk = 0.0
        self._history = deque(maxlen=60)
        self._consec_high = 0
        self.config = load_fusion_config()

    def _clamp(self, v): return float(np.clip(v, 0.0, 1.0))

    def _model_prob(self, model, meta, data: dict, cols: List[str]) -> float:
        if model is None:
            return 0.0
        try:
            row = {c: data.get(c, 0.0) for c in cols}
            df = pd.DataFrame([row])[cols]
            return self._clamp(float(model.predict_proba(df)[0, 1]))
        except Exception as e:
            logger.warning("Model inference exception: %s", e)
            return 0.0

    def predict(
        self,
        data: dict,
        self_assessment_risk: Optional[float] = None,
        mri_injury_score: Optional[float] = None,
        baseline_metrics: Optional[dict] = None
    ) -> dict:
        t0 = time.perf_counter()
        cfg = load_fusion_config()
        
        # 1. Physical Movement Model Inference
        mv_model, mv_meta = get_movement_model()
        m_prob = self._model_prob(mv_model, mv_meta, data, MOVEMENT_COLS)
        
        # 2. Sensor Model Inference
        sn_model, sn_meta = get_sensor_model()
        s_prob = self._model_prob(sn_model, sn_meta, data, SENSOR_COLS)
        
        # 3. Self-Assessment Input
        sa_prob = self._clamp(self_assessment_risk if self_assessment_risk is not None else (data.get("self_assessment_risk", 0.0)))
        
        # 4. MRI Model Input
        mri_available = mri_injury_score is not None or "mri_injury_score" in data
        mri_prob = self._clamp(mri_injury_score if mri_injury_score is not None else data.get("mri_injury_score", 0.0))
        
        # 5. Temporal Trend Analysis
        hist_list = list(self._history) + [self._clamp(0.5 * m_prob + 0.5 * s_prob)]
        trend_analysis = analyze_temporal_trend(hist_list)
        trend_score = trend_analysis["trend_score"]
        
        # 6. Baseline Deviation
        baseline_eval = evaluate_current_against_baseline(data, baseline_metrics)
        
        # 7. Dynamic Weight Distribution
        if mri_available:
            w = cfg["weights"]
            fused = (
                w["movement_weight"] * m_prob +
                w["sensor_weight"] * s_prob +
                w["self_assessment_weight"] * sa_prob +
                w["mri_weight"] * mri_prob +
                w["trend_weight"] * trend_score
            )
            active_weights = w
        else:
            w = cfg.get("mri_fallback_redistribution", {"movement_weight": 0.35, "sensor_weight": 0.30, "self_assessment_weight": 0.25, "trend_weight": 0.10})
            fused = (
                w["movement_weight"] * m_prob +
                w["sensor_weight"] * s_prob +
                w["self_assessment_weight"] * sa_prob +
                w["trend_weight"] * trend_score
            )
            active_weights = {**w, "mri_weight": 0.0}
            
        fused = self._clamp(fused)
        
        # Single-indicator escalation rule
        escalation_threshold = cfg.get("single_indicator_escalation_threshold", 0.85)
        if max(m_prob, s_prob, sa_prob, mri_prob if mri_available else 0.0) >= escalation_threshold:
            fused = max(fused, 0.75)
            
        # Temporal smoothing
        alpha = cfg.get("ema_alpha", 0.30)
        self._ema_risk = alpha * fused + (1.0 - alpha) * self._ema_risk
        smooth_risk = self._clamp(self._ema_risk)
        self._history.append(smooth_risk)
        
        pct = round(smooth_risk * 100.0, 1)
        if pct < 40.0:
            level = "LOW"
        elif pct < 70.0:
            level = "MODERATE"
        else:
            level = "HIGH"
            
        if level == "HIGH":
            self._consec_high += 1
        else:
            self._consec_high = 0
            
        # Contributing factors / Explainability
        contributing_indicators = []
        if m_prob >= 0.50: contributing_indicators.append(f"Elevated movement deviation ({round(m_prob*100, 1)}%)")
        if s_prob >= 0.50: contributing_indicators.append(f"High physiological sensor strain ({round(s_prob*100, 1)}%)")
        if sa_prob >= 0.50: contributing_indicators.append(f"Athlete-reported pain/symptom markers ({round(sa_prob*100, 1)}%)")
        if mri_available and mri_prob >= 0.50: contributing_indicators.append(f"MRI structural signal changes ({round(mri_prob*100, 1)}%)")
        if trend_analysis["trend"] == "RISING": contributing_indicators.append("Upward risk trajectory over recent sessions")
        if baseline_eval.get("composite_deviation_score", 0) > 0.5: contributing_indicators.append("Significant divergence from personalized baseline")
        if not contributing_indicators: contributing_indicators.append("All multi-modal metrics operating within normal baseline envelope")
        
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        
        return {
            "movement_risk": round(m_prob, 4),
            "sensor_risk": round(s_prob, 4),
            "self_assessment_risk": round(sa_prob, 4),
            "mri_risk": round(mri_prob, 4) if mri_available else None,
            "mri_available": mri_available,
            "trend_score": round(trend_score, 4),
            "fused_risk": round(fused, 4),
            "smoothed_risk": round(smooth_risk, 4),
            "overall_risk_pct": pct,
            "risk_level": level,
            "trend": trend_analysis["trend"],
            "trend_details": trend_analysis,
            "baseline_evaluation": baseline_eval,
            "contributing_indicators": contributing_indicators,
            "weights": active_weights,
            "consecutive_high": self._consec_high,
            "alert_triggered": level == "HIGH" or max(m_prob, s_prob, sa_prob) >= 0.80,
            "latency_ms": elapsed_ms,
            "model_versions": {
                "movement": "movement_model_v2.0",
                "sensor": "sensor_model_v2.0",
                "mri": "mri_model_v2.0" if mri_available else None,
                "fusion": "fusion_engine_v2.0"
            },
            "disclaimer": "AI-based multi-modal risk indicators for decision support. Not clinically validated medical diagnosis."
        }
