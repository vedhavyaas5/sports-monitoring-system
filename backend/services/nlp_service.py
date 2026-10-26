"""
Lightweight NLP Symptom & Free-Text Extraction Engine.
Extracts reported symptoms, body regions, and training associations from athlete statements.
Does NOT diagnose medical conditions or pathology.
"""
import re
from typing import Dict, Any, List

SYMPTOM_KEYWORDS = {
    'pain': ['pain', 'hurts', 'hurting', 'ache', 'aching', 'sore', 'soreness', 'tender', 'tenderness', 'sharp pain', 'throbbing'],
    'stiffness': ['stiff', 'stiffness', 'tight', 'tightness', 'rigid', 'hard to bend', 'locked joint'],
    'swelling': ['swelling', 'swollen', 'puffy', 'fluid build up', 'inflamed', 'inflammation'],
    'weakness': ['weak', 'weakness', 'giving way', 'loss of power', 'collapsing'],
    'instability': ['unstable', 'instability', 'wobbly', 'giving out', 'loose'],
    'numbness': ['numb', 'numbness', 'tingling', 'pins and needles', 'loss of sensation'],
    'restricted_rom': ['reduced range', 'cannot bend', 'cannot straighten', 'limited motion', 'restricted movement'],
    'fatigue': ['exhausted', 'drained', 'heavy legs', 'fatigued', 'tired', 'sluggish']
}

BODY_REGIONS = {
    'knee': ['knee', 'patella', 'meniscus', 'acl', 'pcl', 'mcl', 'lcl'],
    'ankle': ['ankle', 'achilles', 'heel', 'foot', 'talus'],
    'hip': ['hip', 'groin', 'pelvis', 'glute'],
    'hamstring': ['hamstring', 'back of thigh', 'biceps femoris'],
    'quadriceps': ['quad', 'quadricep', 'thigh', 'front of thigh'],
    'shoulder': ['shoulder', 'rotator cuff', 'deltoid'],
    'back': ['lower back', 'lumbar', 'spine', 'back']
}

TRAINING_TRIGGERS = ['training', 'practice', 'sprint', 'jump', 'match', 'game', 'session', 'tackle', 'drill']

def extract_symptoms_nlp(text: str) -> Dict[str, Any]:
    if not text or not isinstance(text, str):
        return {
            "pain_detected": False,
            "detected_symptoms": [],
            "body_regions": [],
            "training_related": False,
            "raw_text": "",
            "extracted_entities": {}
        }
        
    t_clean = text.lower()
    found_symptoms = []
    for symptom, kw_list in SYMPTOM_KEYWORDS.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', t_clean) for kw in kw_list):
            found_symptoms.append(symptom)
            
    found_regions = []
    for region, kw_list in BODY_REGIONS.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', t_clean) for kw in kw_list):
            found_regions.append(region)
            
    training_related = any(re.search(r'\b' + re.escape(kw) + r'\b', t_clean) for kw in TRAINING_TRIGGERS)
    
    return {
        "pain_detected": 'pain' in found_symptoms or len(found_regions) > 0,
        "detected_symptoms": found_symptoms,
        "body_regions": found_regions,
        "training_related": training_related,
        "raw_text": text,
        "extracted_entities": {
            "symptoms_count": len(found_symptoms),
            "regions_count": len(found_regions),
            "primary_region": found_regions[0] if found_regions else None
        }
    }
