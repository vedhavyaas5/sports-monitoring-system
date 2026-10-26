import unittest
import os
import sys
import json
from fastapi.testclient import TestClient

# Ensure root in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import app
from backend.database import init_db, get_db
from backend.models_loader import load_all_models
from backend.services.nlp_service import extract_symptoms_nlp
from backend.services.recovery_service import calculate_recovery_indicator
from backend.dataset_manager import generate_quality_reports

class SystemTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        load_all_models()
        cls.client = TestClient(app)

    def test_01_system_status(self):
        res = self.client.get("/api/system/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["backend"])
        self.assertTrue(data["database"])
        self.assertTrue(data["movement_model"])
        self.assertTrue(data["sensor_model"])

    def test_02_athletes_and_sessions(self):
        res = self.client.get("/api/athletes")
        self.assertEqual(res.status_code, 200)
        athletes = res.json()
        self.assertGreaterEqual(len(athletes), 1)

        res2 = self.client.get(f"/api/athletes/{athletes[0]['id']}")
        self.assertEqual(res2.status_code, 200)

    def test_03_movement_prediction(self):
        payload = {
            "hip_flexion_angle": 130.0,
            "knee_flexion_angle": 125.0,
            "ankle_rotation_angle": 92.0,
            "angular_velocity": 3.2,
            "linear_acceleration": 8.0,
            "ground_reaction_force": 2100.0,
            "postural_instability_index": 0.45,
            "biomechanical_deviation_score": 0.42,
            "fatigue_level": 0.55
        }
        res = self.client.post("/api/movement/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("risk_probability", data)
        self.assertIn("risk_category", data)
        self.assertIn(data["risk_category"], ["LOW", "MODERATE", "HIGH"])

    def test_04_sensor_prediction(self):
        payload = {
            "heart_rate_bpm": 155.0,
            "oxygen_saturation_spo2": 96.0,
            "skin_temperature_celsius": 36.2,
            "muscle_activation_emg": 0.70,
            "training_load": 320.0,
            "hydration_level": 0.55,
            "stress_index": 0.50,
            "sensor_fatigue_index": 0.52
        }
        res = self.client.post("/api/sensor/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("risk_probability", data)
        self.assertIn("risk_category", data)

    def test_05_self_assessment_and_nlp(self):
        payload = {
            "athlete_id": "07",
            "pain_level": 6,
            "pain_locations": ["Knee", "Hamstring"],
            "fatigue_level": 7,
            "symptoms": ["Muscle soreness", "Joint stiffness"],
            "training_intensity": 4,
            "training_duration_min": 90,
            "previous_injury": True,
            "description": "My right knee feels stiff and hurts after sprint training."
        }
        res = self.client.post("/api/assessment", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("overall_risk_score", data)
        self.assertTrue(data["extracted_symptoms"]["pain_detected"])
        self.assertIn("knee", data["extracted_symptoms"]["body_regions"])

    def test_06_risk_fusion(self):
        payload = {
            "athlete_id": "07",
            "movement_data": {
                "hip_flexion_angle": 130.0,
                "knee_flexion_angle": 125.0,
                "ground_reaction_force": 2200.0,
                "postural_instability_index": 0.40,
                "biomechanical_deviation_score": 0.38,
                "fatigue_level": 0.50
            },
            "sensor_data": {
                "heart_rate_bpm": 150.0,
                "training_load": 300.0,
                "hydration_level": 0.60,
                "stress_index": 0.40,
                "sensor_fatigue_index": 0.45
            },
            "self_assessment_risk": 0.65
        }
        res = self.client.post("/api/risk/fusion", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("overall_risk_pct", data)
        self.assertIn("risk_level", data)
        self.assertIn("contributing_indicators", data)

    def test_07_dataset_quality_reports(self):
        reports = generate_quality_reports()
        self.assertIn("reports", reports)
        self.assertGreaterEqual(reports["total_audited"], 1)

    def test_08_recovery_analytics(self):
        rec = calculate_recovery_indicator(hydration_level=0.8, stress_index=0.2, fatigue_level=0.2, pain_level=1)
        self.assertGreater(rec["recovery_score"], 0.6)
        self.assertEqual(rec["status"], "OPTIMAL_RECOVERY")

if __name__ == '__main__':
    unittest.main()
