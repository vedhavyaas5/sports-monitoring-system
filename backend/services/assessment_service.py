"""
Self-Assessment Intake and Processing Service.
Normalizes subjective responses and extracts NLP symptom features without diagnosing.
"""
from typing import Dict, Any, List
from backend.services.nlp_service import extract_symptoms_nlp

def process_self_assessment_payload(data: dict) -> Dict[str, Any]:
    pain_level = int(data.get("pain_level", 0))
    fatigue_level = int(data.get("fatigue_level", 0))
    symptoms = data.get("symptoms", [])
    pain_locations = data.get("pain_locations", [])
    description = data.get("description", "")
    intensity = int(data.get("training_intensity", 3))
    duration = int(data.get("training_duration_min", 60))
    prev_injury = bool(data.get("previous_injury", False))
    
    # Run NLP extraction on text
    nlp_results = extract_symptoms_nlp(description)
    
    # Normalized feature scores [0, 1]
    pain_norm = min(max(pain_level / 10.0, 0.0), 1.0)
    fatigue_norm = min(max(fatigue_level / 10.0, 0.0), 1.0)
    symptom_count_norm = min(len(symptoms) / 8.0, 1.0)
    intensity_norm = min(max(intensity / 5.0, 0.0), 1.0)
    
    # Symptom presence flags
    has_stiffness = "Joint stiffness" in symptoms or "stiffness" in nlp_results.get("detected_symptoms", [])
    has_swelling = "Swelling" in symptoms or "swelling" in nlp_results.get("detected_symptoms", [])
    has_weakness = "Weakness" in symptoms or "weakness" in nlp_results.get("detected_symptoms", [])
    has_difficulty = any(s in symptoms for s in ["Difficulty walking", "Difficulty running", "Difficulty changing direction"])
    
    # Composite risk score from self-report (engineering heuristic, NOT clinical diagnosis)
    composite_score = (
        pain_norm * 0.35 +
        fatigue_norm * 0.25 +
        symptom_count_norm * 0.15 +
        (0.08 if has_swelling else 0.0) +
        (0.08 if has_difficulty else 0.0) +
        (0.05 if has_stiffness else 0.0) +
        (0.04 if prev_injury else 0.0)
    )
    composite_score = float(min(max(composite_score, 0.0), 1.0))
    
    if composite_score >= 0.60:
        status_label = "Elevated Risk Indicators"
        risk_color = "#ef4444"
        risk_tier = "HIGH"
        narrative = (
            f"Athlete reports marked physiological strain with pain level ({pain_level}/10) "
            f"and pronounced fatigue ({fatigue_level}/10), combined with active functional symptoms "
            f"({', '.join(symptoms) if symptoms else 'multiple clinical markers'}). "
            f"Compensatory kinematic deviations are probable during high-velocity accelerations. "
            f"Immediate trainer consultation and temporary load deloading are strongly indicated."
        )
    elif composite_score >= 0.35:
        status_label = "Moderate Risk Indicators"
        risk_color = "#f59e0b"
        risk_tier = "MODERATE"
        narrative = (
            f"Athlete demonstrates sub-acute localized strain with moderate fatigue ({fatigue_level}/10) "
            f"and localized discomfort across {', '.join(pain_locations) if pain_locations else 'reported joints'}. "
            f"While gross functional failure is not indicated, cumulative session load should be capped to prevent "
            f"tissue degradation or micro-trauma cascade."
        )
    else:
        status_label = "Low Risk Indicators"
        risk_color = "#10b981"
        risk_tier = "LOW"
        narrative = (
            f"Subjective wellness and recovery metrics are within nominal athlete baseline thresholds. "
            f"Minimal pain ({pain_level}/10) and controlled fatigue ({fatigue_level}/10) support full athletic participation "
            f"with standard post-session recovery protocols."
        )
        
    # Radar chart 6-axis assessment vector
    sRPE = min(100, int((intensity / 5.0) * (duration / 90.0) * 100))
    assessment_radar = [
        {"metric": "Pain Severity", "value": pain_level * 10, "norm": 15},
        {"metric": "Perceived Fatigue", "value": fatigue_level * 10, "norm": 25},
        {"metric": "Session RPE Load", "value": sRPE, "norm": 50},
        {"metric": "Symptom Density", "value": min(100, len(symptoms) * 20), "norm": 10},
        {"metric": "Movement Limitation", "value": 80 if has_difficulty else 15, "norm": 10},
        {"metric": "Tissue Reaction", "value": 75 if (has_swelling or has_stiffness) else 15, "norm": 15}
    ]

    # Category comparisons for bar chart
    category_scores = [
        {"category": "Pain Index", "score": pain_level * 10, "threshold": 50, "fill": "#ef4444" if pain_level >= 5 else "#3b82f6"},
        {"category": "Fatigue Index", "score": fatigue_level * 10, "threshold": 60, "fill": "#a855f7" if fatigue_level >= 6 else "#8b5cf6"},
        {"category": "sRPE Workload", "score": sRPE, "threshold": 75, "fill": "#d97706" if sRPE >= 75 else "#06b6d4"},
        {"category": "Symptom Burden", "score": min(100, len(symptoms) * 20), "threshold": 40, "fill": "#e11d48" if len(symptoms) >= 2 else "#10b981"}
    ]

    # Concrete sports medicine recovery guidance
    recovery_recommendations = {
        "load_guidance": (
            "Deload ballistic plyometrics and limit sprinting to <80% max velocity."
            if composite_score >= 0.50 else
            "Permitted for standard scheduled session with target RPE < 7."
        ),
        "recovery_modalities": [
            "Local cryotherapy (15-20 mins) to target compartments",
            "Pneumatic dynamic compression or elevation protocol",
            "Targeted foam rolling and myofascial release (avoid acute swelling sites)",
            "Hydration replenishment targeting 1.5x fluid deficit"
        ],
        "mobility_drills": (
            [f"Active-isolated mobility for {loc}" for loc in pain_locations]
            if pain_locations else ["Full-body dynamic mobility flow and hip opener series"]
        ),
        "clinical_escalation": (
            "Flagged for urgent athletic trainer triage before next high-intensity session."
            if composite_score >= 0.60 or has_swelling else
            "Routine monitoring: submit next subjective check-in post-training."
        )
    }

    return {
        "athlete_id": data.get("athlete_id", "07"),
        "session_id": data.get("session_id"),
        "pain_level": pain_level,
        "pain_locations": pain_locations,
        "fatigue_level": fatigue_level,
        "symptoms": symptoms,
        "training_intensity": intensity,
        "training_duration_min": duration,
        "previous_injury": prev_injury,
        "description": description,
        "extracted_symptoms": nlp_results,
        "symptom_flags": {
            "stiffness": has_stiffness,
            "swelling": has_swelling,
            "weakness": has_weakness,
            "movement_difficulty": has_difficulty
        },
        "overall_risk_score": round(composite_score, 4),
        "status_label": status_label,
        "risk_tier": risk_tier,
        "risk_color": risk_color,
        "clinical_narrative": narrative,
        "assessment_radar": assessment_radar,
        "category_scores": category_scores,
        "recovery_recommendations": recovery_recommendations,
        "disclaimer": "Self-assessment indicators provide subjective context for monitoring and do not replace professional clinical evaluation."
    }
