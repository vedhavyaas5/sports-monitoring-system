"""
Verifies every deliverable of the Athlete Module end-to-end.
Run: python verify_athlete_module.py
"""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(__file__))

DIV = '=' * 65
ok  = []
fail= []

def check(label, fn):
    try:
        fn()
        ok.append(label)
        print(f'  [PASS] {label}')
    except Exception as e:
        fail.append(label)
        print(f'  [FAIL] {label} -> {e}')

print(f'\n{DIV}')
print('  ATHLETE MODULE — DELIVERABLES VERIFICATION')
print(DIV)

# ── 1. Schemas ────────────────────────────────────────────────────
def t_schemas():
    from athlete_module.backend.schemas import (
        SelfAssessmentInput, SelfAssessmentFeatures,
        SymptomIndicators, MRIResult, AssessmentResponse,
        SessionType, Intensity, PainLocation, Symptom)
check('[1] Pydantic schemas importable', t_schemas)

# ── 2. preprocess_self_assessment ────────────────────────────────
def t_preprocess():
    from athlete_module.backend.schemas import (
        SelfAssessmentInput, SessionType, Intensity, PainLocation, Symptom)
    from athlete_module.backend.services.assessment_service import preprocess_self_assessment
    data = SelfAssessmentInput(
        athlete_id='07',
        session_type=SessionType.TRAINING,
        training_duration_min=75,
        training_intensity=Intensity.HIGH,
        pain_level=7,
        pain_locations=[PainLocation.KNEE],
        symptoms=[Symptom.STIFFNESS, Symptom.SWELLING, Symptom.DIFF_RUNNING],
        fatigue_level=8,
        previous_injury=True,
        previous_injury_location=PainLocation.KNEE,
        description='My right knee hurts after running and feels stiff.'
    )
    f = preprocess_self_assessment(data)
    assert f.pain_level == 7.0
    assert f.fatigue_level == 8.0
    assert f.stiffness == 1
    assert f.swelling == 1
    assert f.movement_difficulty == 1
    assert f.previous_injury == 1
    assert f.training_intensity == 4
    assert 0.0 < f.overall_risk_score <= 1.0
    print(f'       pain={f.pain_level} fatigue={f.fatigue_level} stiffness={f.stiffness}')
    print(f'       swelling={f.swelling} movement_difficulty={f.movement_difficulty}')
    print(f'       previous_injury={f.previous_injury} intensity={f.training_intensity}')
    print(f'       overall_risk_score={f.overall_risk_score}')
check('[2] preprocess_self_assessment()', t_preprocess)

# ── 3. extract_symptom_indicators ───────────────────────────────
def t_indicators():
    from athlete_module.backend.schemas import (
        SelfAssessmentInput, SessionType, Intensity, PainLocation, Symptom)
    from athlete_module.backend.services.assessment_service import (
        preprocess_self_assessment, extract_symptom_indicators)
    data = SelfAssessmentInput(
        athlete_id='07', session_type=SessionType.TRAINING,
        training_duration_min=75, training_intensity=Intensity.HIGH,
        pain_level=7, pain_locations=[PainLocation.KNEE],
        symptoms=[Symptom.STIFFNESS, Symptom.SWELLING, Symptom.DIFF_RUNNING],
        fatigue_level=8, previous_injury=True,
        description='My knee is painful and stiff.'
    )
    f = preprocess_self_assessment(data)
    i = extract_symptom_indicators(data, f)
    assert i.pain_detected == True
    assert i.fatigue_detected == True
    assert i.stiffness_detected == True
    assert i.swelling_detected == True
    assert i.movement_difficulty_detected == True
    assert i.previous_injury_detected == True
    assert i.text_pain_detected == True
    assert i.text_stiffness_detected == True
    print(f'       pain_detected={i.pain_detected} fatigue_detected={i.fatigue_detected}')
    print(f'       stiffness={i.stiffness_detected} swelling={i.swelling_detected}')
    print(f'       movement_difficulty={i.movement_difficulty_detected}')
    print(f'       text_pain={i.text_pain_detected} text_stiffness={i.text_stiffness_detected}')
check('[3] extract_symptom_indicators()', t_indicators)

# ── 4. Text keyword extraction ───────────────────────────────────
def t_text():
    from athlete_module.backend.services.assessment_service import extract_keywords_from_text
    kws = extract_keywords_from_text('My knee is painful and stiff after training.')
    print(f'       Input : My knee is painful and stiff after training.')
    print(f'       Output: {kws}')
    assert 'Pain' in kws
    assert 'Location' in kws
    assert 'Stiffness' in kws
    assert 'Training Reference' in kws
check('[4] extract_keywords_from_text()', t_text)

# ── 5. Risk status label ─────────────────────────────────────────
def t_label():
    from athlete_module.backend.services.assessment_service import risk_status_label
    results = [(0.1, 'Low'), (0.5, 'Moderate'), (0.75, 'Elevated')]
    for score, expected in results:
        label = risk_status_label(score)
        print(f'       score={score} -> {label}')
        assert expected.lower() in label.lower()
check('[5] risk_status_label()', t_label)

# ── 6. Risk fusion payload ───────────────────────────────────────
def t_payload():
    from athlete_module.backend.schemas import (
        SelfAssessmentInput, SessionType, Intensity, PainLocation, Symptom)
    from athlete_module.backend.services.assessment_service import (
        preprocess_self_assessment, extract_symptom_indicators)
    data = SelfAssessmentInput(
        athlete_id='07', session_type=SessionType.TRAINING,
        training_duration_min=75, training_intensity=Intensity.HIGH,
        pain_level=7, pain_locations=[PainLocation.KNEE],
        symptoms=[Symptom.STIFFNESS, Symptom.SWELLING, Symptom.DIFF_RUNNING],
        fatigue_level=8, previous_injury=False
    )
    f = preprocess_self_assessment(data)
    i = extract_symptom_indicators(data, f)
    payload = {
        "athlete_id": data.athlete_id,
        "self_assessment": {
            "pain_level": f.pain_level,
            "fatigue_level": f.fatigue_level,
            "stiffness": bool(f.stiffness),
            "swelling": bool(f.swelling),
            "movement_difficulty": bool(f.movement_difficulty),
        },
        "symptom_indicators": {
            "pain_detected": i.pain_detected,
            "fatigue_detected": i.fatigue_detected,
            "stiffness_detected": i.stiffness_detected,
            "movement_difficulty_detected": i.movement_difficulty_detected,
        },
        "mri": {"available": False}
    }
    print(f'       {json.dumps(payload, indent=6)}')
    assert payload["athlete_id"] == "07"
    assert payload["self_assessment"]["pain_level"] == 7.0
check('[6] Risk fusion payload structure', t_payload)

# ── 7. Session store ─────────────────────────────────────────────
def t_store():
    from athlete_module.backend.services.session_store import (
        save_session, get_session, get_athlete_sessions, list_sessions)
    sid = save_session({
        'athlete_id': '07', 'pain_level': 7,
        'fatigue_level': 8, 'timestamp': time.time()
    })
    s = get_session(sid)
    assert s is not None
    assert s['athlete_id'] == '07'
    sessions = get_athlete_sessions('07')
    assert len(sessions) >= 1
    all_s = list_sessions()
    assert len(all_s) >= 1
    print(f'       session_id={sid}')
    print(f'       retrieved athlete_id={s["athlete_id"]} pain={s["pain_level"]}')
    print(f'       athlete_sessions={len(sessions)}')
check('[7] Session store (save/get/list)', t_store)

# ── 8. MRI validation ────────────────────────────────────────────
def t_mri_validation():
    from athlete_module.backend.services.mri_service import validate_image_bytes
    # Empty file
    try:
        validate_image_bytes(b'', 'test.jpg')
        assert False, 'should raise'
    except ValueError as e:
        print(f'       Empty:     {e}')
    # Bad extension
    try:
        validate_image_bytes(b'data', 'test.exe')
        assert False, 'should raise'
    except ValueError as e:
        print(f'       Bad ext:   {e}')
    # Too large
    big = b'x' * (11 * 1024 * 1024)
    try:
        validate_image_bytes(big, 'test.jpg')
        assert False, 'should raise'
    except ValueError as e:
        print(f'       Too large: {e}')
check('[8] MRI file validation', t_mri_validation)

# ── 9. MRI model load + inference ────────────────────────────────
def t_mri_model():
    from athlete_module.backend.services.mri_service import _get_model, predict_mri
    model, meta = _get_model()
    assert model is not None
    assert 'class_names' in meta
    print(f'       model={meta["best_model"]} classes={meta["class_names"]} size={meta["img_size"]}')
    # Run inference on a real image from the dataset
    import os
    img_dir = os.path.join(os.path.dirname(__file__), 'dataset',
        'medical imaging sports data', 'medical imaging sports data')
    img_path = os.path.join(img_dir, 'OIP (1).webp')
    with open(img_path, 'rb') as f:
        content = f.read()
    result = predict_mri(content)
    assert 'prediction' in result
    assert 'confidence' in result
    assert 0.0 <= result['confidence'] <= 1.0
    assert result['prediction'] in meta['class_names']
    print(f'       prediction={result["prediction"]}')
    print(f'       confidence={result["confidence_pct"]}%')
    print(f'       top_2={result["top_2"]}')
    print(f'       disclaimer present={bool(result["disclaimer"])}')
check('[9] MRI model inference on real image', t_mri_model)

# ── 10. FastAPI routes ───────────────────────────────────────────
def t_routes():
    from athlete_module.backend.routes.assessment import router as ar
    from athlete_module.backend.routes.mri import router as mr
    assert ar.prefix == '/api'
    assert mr.prefix == '/api/mri'
    print(f'       assessment prefix : {ar.prefix}')
    print(f'       mri prefix        : {mr.prefix}')
check('[10] FastAPI route prefixes', t_routes)

# ── 11. FastAPI app ──────────────────────────────────────────────
def t_app():
    from athlete_module.backend.main import app
    paths = [r.path for r in app.routes]
    expected = ['/api/self-assessment', '/api/mri/analyze', '/api/sessions',
                '/api/sessions/{session_id}', '/api/athletes/{athlete_id}/sessions']
    for ep in expected:
        assert ep in paths, f'{ep} not registered'
        print(f'       {ep}  OK')
check('[11] FastAPI app endpoints', t_app)

# ── 12. Frontend source files ────────────────────────────────────
def t_frontend():
    base = os.path.join(os.path.dirname(__file__),
                        'athlete_module', 'frontend', 'src')
    files = {
        'App.jsx':                         os.path.join(base, 'App.jsx'),
        'pages/LandingPage.jsx':           os.path.join(base, 'pages', 'LandingPage.jsx'),
        'pages/SelfAssessment.jsx':        os.path.join(base, 'pages', 'SelfAssessment.jsx'),
        'pages/MRIUpload.jsx':             os.path.join(base, 'pages', 'MRIUpload.jsx'),
        'pages/AssessmentResult.jsx':      os.path.join(base, 'pages', 'AssessmentResult.jsx'),
        'pages/MRIResult.jsx':             os.path.join(base, 'pages', 'MRIResult.jsx'),
    }
    for name, path in files.items():
        sz = os.path.getsize(path)
        assert sz > 100, f'{name} too small ({sz} bytes)'
        print(f'       {name:40s} {sz:>6,} bytes')
check('[12] Frontend React pages present', t_frontend)

# ── 13. Backend services files ───────────────────────────────────
def t_services():
    base = os.path.join(os.path.dirname(__file__),
                        'athlete_module', 'backend', 'services')
    for fname in ['assessment_service.py', 'mri_service.py', 'session_store.py']:
        p = os.path.join(base, fname)
        sz = os.path.getsize(p)
        assert sz > 200
        print(f'       {fname:35s} {sz:>6,} bytes')
check('[13] Backend service files', t_services)

# ── 14. Safety disclaimer in MRI output ─────────────────────────
def t_disclaimer():
    from athlete_module.backend.services.mri_service import predict_mri
    import os
    img_path = os.path.join(os.path.dirname(__file__), 'dataset',
        'medical imaging sports data', 'medical imaging sports data', 'OIP (1).webp')
    with open(img_path, 'rb') as f:
        content = f.read()
    result = predict_mri(content)
    assert 'NOT a medical diagnosis' in result['disclaimer']
    assert 'demo_warning' in result   # warns about pseudo-labels
    print(f'       disclaimer : {result["disclaimer"][:60]}...')
    print(f'       demo_warning present: True')
check('[14] Safety disclaimer in MRI output', t_disclaimer)

# ── Summary ───────────────────────────────────────────────────────
print(f'\n{DIV}')
print(f'  RESULT: {len(ok)}/14 PASSED    {len(fail)} FAILED')
print(DIV)
if fail:
    print('  FAILED:')
    for f in fail:
        print(f'    - {f}')
else:
    print('  ALL 14 DELIVERABLES VERIFIED SUCCESSFULLY')
print()
