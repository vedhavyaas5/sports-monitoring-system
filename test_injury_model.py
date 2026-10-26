import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from athlete_module.backend.services.mri_injury_service import (
    predict_injury_level, validate_mri_upload, GRADES
)

img_dir = os.path.join(os.path.dirname(__file__),
    'dataset', 'medical imaging sports data', 'medical imaging sports data')
images = sorted(os.listdir(img_dir))[:10]

print('=' * 65)
print('  MRI INJURY LEVEL PREDICTION — TEST')
print('=' * 65)
print()

for fname in images:
    path = os.path.join(img_dir, fname)
    with open(path, 'rb') as f:
        data = f.read()
    r = predict_injury_level(data, athlete_id='07')
    grade    = r['grade']
    severity = r['severity']
    score    = r['injury_score_pct']
    conf     = r['confidence_pct']
    ms       = r['analysis_time_ms']
    print(f"  {fname:22s}  Grade {grade}  {severity:12s}  "
          f"score={score:5.1f}%  conf={conf:4.1f}%  {ms:.0f}ms")

print()
print('Grade Definitions:')
for g in range(4):
    info = GRADES[g]
    print(f"  Grade {g}: {info['label']}")
    print(f"           {info['description'][:70]}...")
    print(f"           Recommend: {info['recommendation'][:65]}...")
    print()

print('Validation Tests:')
try:
    validate_mri_upload(b'', 'test.jpg')
except ValueError as e:
    print(f'  Empty file   : {e}')

try:
    validate_mri_upload(b'x', 'bad.exe')
except ValueError as e:
    print(f'  Bad extension: {e}')

try:
    validate_mri_upload(b'x' * (21 * 1024 * 1024), 'big.jpg')
except ValueError as e:
    print(f'  Too large    : {e}')

print()
print('Full result sample (first image):')
import json
path = os.path.join(img_dir, images[0])
with open(path, 'rb') as f:
    data = f.read()
r = predict_injury_level(data, athlete_id='07')
print(json.dumps({
    'grade':          r['grade'],
    'grade_label':    r['grade_label'],
    'severity':       r['severity'],
    'severity_label': r['severity_label'],
    'confidence_pct': r['confidence_pct'],
    'injury_score_pct': r['injury_score_pct'],
    'description':    r['description'],
    'recommendation': r['recommendation'],
    'radiological_features': r['radiological_features'],
    'all_grades':     [
        {'grade': g['grade'], 'severity': g['severity'],
         'score_pct': g['score_pct'], 'is_predicted': g['is_predicted']}
        for g in r['all_grades']
    ],
    'analysis_time_ms': r['analysis_time_ms'],
}, indent=2))
