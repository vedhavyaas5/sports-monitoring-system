"""
Realistic Configurable Sensor and Biomechanical Simulation Engine.
Implements bounded multi-sine drift with Gaussian physiological perturbation
derived from config/simulation_config.json.
"""
import os
import json
import time
import math
import numpy as np
from collections import deque
from backend.ml.feature_engineering import engineer_movement_features, engineer_sensor_features

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config', 'simulation_config.json')

class DemoEngine:
    def __init__(self, seed: int = 42):
        self._rng = np.random.default_rng(seed)
        self._t0 = time.time()
        self._phase = self._rng.uniform(0, 2 * math.pi, size=30)
        self.scenario = "normal_training"
        self._load_config()

    def _load_config(self):
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, 'r') as f:
                    self.config = json.load(f)
                    return
            except Exception:
                pass
        self.config = {"scenarios": {}}

    def set_scenario(self, scenario_name: str):
        if scenario_name in self.config.get("scenarios", {}):
            self.scenario = scenario_name

    def _wave(self, idx: int, period: float, amplitude: float, centre: float, noise: float = 0.02) -> float:
        t = time.time() - self._t0
        val = centre + amplitude * math.sin(2 * math.pi * t / period + self._phase[idx])
        val += float(self._rng.normal(0, noise))
        return val

    def generate(self, athlete_id: str = "07", session_id: str = "demo") -> dict:
        t = time.time()
        sc = self.config.get("scenarios", {}).get(self.scenario, {})
        
        # Physiological signals
        hr_cfg = sc.get("heart_rate_bpm", {"mean": 140, "std": 15, "min": 90, "max": 185})
        spo2_cfg = sc.get("spo2_pct", {"mean": 97.0, "std": 1.0, "min": 93.0, "max": 100.0})
        temp_cfg = sc.get("skin_temp_c", {"mean": 35.8, "std": 0.5, "min": 33.5, "max": 38.0})
        emg_cfg = sc.get("muscle_activation_emg", {"mean": 0.60, "std": 0.1, "min": 0.1, "max": 0.95})
        load_cfg = sc.get("training_load", {"mean": 260, "std": 40, "min": 80, "max": 480})
        hyd_cfg = sc.get("hydration_level", {"mean": 0.65, "std": 0.1, "min": 0.3, "max": 0.95})
        stress_cfg = sc.get("stress_index", {"mean": 0.42, "std": 0.1, "min": 0.1, "max": 0.85})
        fat_cfg = sc.get("sensor_fatigue_index", {"mean": 0.48, "std": 0.1, "min": 0.1, "max": 0.90})
        
        hr = float(np.clip(self._wave(0, 45, hr_cfg["std"], hr_cfg["mean"], 1.5), hr_cfg["min"], hr_cfg["max"]))
        spo2 = float(np.clip(self._wave(1, 90, spo2_cfg["std"], spo2_cfg["mean"], 0.2), spo2_cfg["min"], spo2_cfg["max"]))
        skin_temp = float(np.clip(self._wave(2, 60, temp_cfg["std"], temp_cfg["mean"], 0.1), temp_cfg["min"], temp_cfg["max"]))
        emg = float(np.clip(self._wave(3, 30, emg_cfg["std"], emg_cfg["mean"], 0.02), emg_cfg["min"], emg_cfg["max"]))
        t_load = float(np.clip(self._wave(4, 120, load_cfg["std"], load_cfg["mean"], 4.0), load_cfg["min"], load_cfg["max"]))
        hyd = float(np.clip(self._wave(5, 200, hyd_cfg["std"], hyd_cfg["mean"], 0.01), hyd_cfg["min"], hyd_cfg["max"]))
        stress = float(np.clip(self._wave(6, 60, stress_cfg["std"], stress_cfg["mean"], 0.02), stress_cfg["min"], stress_cfg["max"]))
        fat_idx = float(np.clip(self._wave(7, 150, fat_cfg["std"], fat_cfg["mean"], 0.02), fat_cfg["min"], fat_cfg["max"]))
        
        # Biomechanical Joint Kinematics
        l_knee = float(np.clip(self._wave(8, 3.5, 20, 140, 1.2), 65, 175))
        r_knee = float(np.clip(self._wave(9, 3.5, 18, 136, 1.2), 65, 175))
        l_hip = float(np.clip(self._wave(10, 4.0, 15, 155, 1.0), 110, 180))
        r_hip = float(np.clip(self._wave(11, 4.0, 12, 152, 1.0), 110, 180))
        l_ankle = float(np.clip(self._wave(12, 2.5, 10, 100, 1.0), 70, 135))
        r_ankle = float(np.clip(self._wave(13, 2.5, 9, 102, 1.0), 70, 135))
        
        ang_vel = float(np.clip(self._wave(14, 3.0, 1.2, 3.0, 0.2), 0.2, 7.0))
        lin_accel = float(np.clip(self._wave(15, 3.0, 2.5, 8.0, 0.4), 0.5, 18.0))
        grf = float(np.clip(self._wave(16, 2.0, 450, 2000, 25.0), 600, 3800))
        post_inst = float(np.clip(self._wave(17, 6.0, 0.18, 0.35, 0.02), 0.05, 0.95))
        bio_dev = float(np.clip(self._wave(18, 6.0, 0.18, 0.32, 0.02), 0.05, 0.95))
        fatigue_level = float(np.clip(self._wave(19, 180, 0.22, 0.45, 0.02), 0.05, 0.95))
        
        # Derived features
        mv_intensity = ang_vel * lin_accel
        bio_risk_idx = 0.5 * post_inst + 0.5 * bio_dev
        asymmetry = abs(l_knee - r_knee)
        fatigue_grf = fatigue_level * grf
        fatigue_adj_load = t_load * (1.0 + fat_idx)
        physio_stress = 0.4 * ((hr - 55) / 135.0) + 0.3 * (1.0 - (spo2 - 90)/10.0) + 0.3 * stress
        rec_index = hyd * (1.0 - stress)
        cardio_load = hr * t_load
        
        return {
            "demo": True,
            "timestamp": t,
            "athlete_id": athlete_id,
            "session_id": session_id,
            "scenario": self.scenario,
            # Sensors
            "heart_rate_bpm": round(hr, 1),
            "oxygen_saturation_spo2": round(spo2, 1),
            "skin_temperature_celsius": round(skin_temp, 1),
            "muscle_activation_emg": round(emg, 3),
            "training_load": round(t_load, 1),
            "hydration_level": round(hyd, 3),
            "stress_index": round(stress, 3),
            "sensor_fatigue_index": round(fat_idx, 3),
            "fatigue_level": round(fatigue_level, 3),
            # Kinematics
            "hip_flexion_angle": round(l_hip, 1),
            "knee_flexion_angle": round(l_knee, 1),
            "ankle_rotation_angle": round(l_ankle, 1),
            "l_knee_angle": round(l_knee, 1),
            "r_knee_angle": round(r_knee, 1),
            "l_hip_angle": round(l_hip, 1),
            "r_hip_angle": round(r_hip, 1),
            "l_ankle_angle": round(l_ankle, 1),
            "r_ankle_angle": round(r_ankle, 1),
            # Biomechanical features
            "angular_velocity": round(ang_vel, 3),
            "linear_acceleration": round(lin_accel, 3),
            "ground_reaction_force": round(grf, 1),
            "postural_instability_index": round(post_inst, 4),
            "biomechanical_deviation_score": round(bio_dev, 4),
            "movement_intensity": round(mv_intensity, 3),
            "biomechanical_risk_index": round(bio_risk_idx, 4),
            "movement_asymmetry": round(asymmetry, 2),
            "fatigue_grf_interaction": round(fatigue_grf, 1),
            # Sensor engineered
            "fatigue_adjusted_load": round(fatigue_adj_load, 1),
            "physiological_stress_score": round(physio_stress, 4),
            "recovery_index": round(rec_index, 4),
            "cardiovascular_load": round(cardio_load, 1),
            "fps": round(self._wave(0, 10, 1.5, 29.0, 0.2), 1),
            "e2e_latency_ms": round(abs(self._wave(4, 5, 4, 18.0, 1.0)), 1)
        }
