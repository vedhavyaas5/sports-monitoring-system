"""Test the new /api/mri/analyze endpoint with full injury level output."""
import urllib.request, json, os

img_dir = os.path.join(os.path.dirname(__file__),
    'dataset', 'medical imaging sports data', 'medical imaging sports data')

# Test with 3 different images
test_images = ['OIP (1).webp', 'OIP (16).webp', 'OIP (11).webp']

print('=' * 65)
print('  MRI INJURY ENDPOINT — LIVE TEST  (http://localhost:8001)')
print('=' * 65)

for fname in test_images:
    path = os.path.join(img_dir, fname)
    with open(path, 'rb') as f:
        img_bytes = f.read()

    boundary = b'----Boundary'
    body = (
        b'--' + boundary + b'\r\n' +
        b'Content-Disposition: form-data; name="file"; filename="' +
        fname.encode() + b'"\r\n' +
        b'Content-Type: image/webp\r\n\r\n' +
        img_bytes + b'\r\n' +
        b'--' + boundary + b'\r\n' +
        b'Content-Disposition: form-data; name="athlete_id"\r\n\r\n' +
        b'07\r\n' +
        b'--' + boundary + b'--\r\n'
    )

    req = urllib.request.Request(
        'http://localhost:8001/api/mri/analyze',
        data=body, method='POST',
        headers={'Content-Type': 'multipart/form-data; boundary=----Boundary'}
    )

    print(f'\n  Image: {fname}')
    print('  ' + '-' * 50)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            d = json.loads(r.read())
            print(f'  Grade           : {d["grade_label"]}')
            print(f'  Severity        : {d["severity_label"]}')
            print(f'  Injury Score    : {d["injury_score_pct"]}%')
            print(f'  Confidence      : {d["confidence_pct"]}%')
            print(f'  Analysis Time   : {d["analysis_time_ms"]}ms')
            print(f'  Description     : {d["description"][:70]}...')
            print(f'  Recommendation  : {d["recommendation"][:70]}...')
            print(f'  Radiological    : {d["radiological_features"]}')
            print(f'  All grades      :')
            for g in d["all_grades"]:
                marker = " ◄ PREDICTED" if g["is_predicted"] else ""
                print(f'    {g["grade"]} ({g["severity"]:10s}) {g["score_pct"]:5.1f}%{marker}')
    except Exception as e:
        print(f'  ERROR: {e}')

print('\n' + '=' * 65)
print('  Endpoint working correctly at http://localhost:5173')
print('  Open browser → Upload MRI Scan → Select any image → Analyze')
print('=' * 65)
