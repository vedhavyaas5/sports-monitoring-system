"""
Full MRI upload test — tests backend directly AND via the Vite proxy.
Tests: WEBP, JPG (converted), PNG (converted), validation errors.
"""
import urllib.request, urllib.error, json, os, io, sys
sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image

BASE_DIR = os.path.dirname(__file__)
IMG_DIR  = os.path.join(BASE_DIR, 'dataset',
    'medical imaging sports data', 'medical imaging sports data')

DIRECT_URL = 'http://localhost:8001/api/mri/analyze'
PROXY_URL  = 'http://localhost:5173/api/mri/analyze'

DIV = '-' * 60

def multipart_post(url, file_bytes, filename, content_type, athlete_id='07'):
    boundary = b'----TestBoundary'
    body = (
        b'--' + boundary + b'\r\n' +
        b'Content-Disposition: form-data; name="file"; filename="' +
        filename.encode() + b'"\r\n' +
        b'Content-Type: ' + content_type.encode() + b'\r\n\r\n' +
        file_bytes + b'\r\n' +
        b'--' + boundary + b'\r\n' +
        b'Content-Disposition: form-data; name="athlete_id"\r\n\r\n' +
        athlete_id.encode() + b'\r\n' +
        b'--' + boundary + b'--\r\n'
    )
    req = urllib.request.Request(
        url, data=body, method='POST',
        headers={'Content-Type': 'multipart/form-data; boundary=----TestBoundary'}
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, {'error': str(e)}

def make_jpg(src_path):
    img = Image.open(src_path).convert('RGB')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=90)
    return buf.getvalue()

def make_png(src_path):
    img = Image.open(src_path).convert('RGB')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()

# Pick a real image
webp_path = os.path.join(IMG_DIR, 'OIP (1).webp')
with open(webp_path, 'rb') as f:
    webp_bytes = f.read()
jpg_bytes = make_jpg(webp_path)
png_bytes = make_png(webp_path)

print(f'\n{"="*60}')
print('  MRI UPLOAD — FULL TEST SUITE')
print(f'{"="*60}\n')

passed = 0
failed = 0

def run_test(name, url, file_bytes, filename, content_type,
             expect_status=200, expect_key=None):
    global passed, failed
    status, data = multipart_post(url, file_bytes, filename, content_type)
    ok = (status == expect_status)
    if expect_key and ok:
        ok = expect_key in data
    symbol = 'PASS' if ok else 'FAIL'
    if ok: passed += 1
    else:  failed += 1
    print(f'  [{symbol}] {name}')
    if ok and expect_status == 200:
        print(f'         prediction  = {data.get("prediction")}')
        print(f'         confidence  = {data.get("confidence_pct")}%')
        print(f'         top_2       = {data.get("top_2")}')
        print(f'         model       = {data.get("model_name")}')
        print(f'         demo_warn   = {bool(data.get("demo_warning"))}')
    elif not ok:
        print(f'         status={status}  data={json.dumps(data)[:100]}')

# ── Test 1: WEBP direct ───────────────────────────────────────────
print(f'{DIV}')
print('  FORMAT TESTS  (direct → port 8001)')
print(DIV)
run_test('WEBP upload  (image/webp)',
    DIRECT_URL, webp_bytes, 'scan.webp', 'image/webp')

run_test('JPEG upload  (image/jpeg)',
    DIRECT_URL, jpg_bytes, 'scan.jpg', 'image/jpeg')

run_test('PNG upload   (image/png)',
    DIRECT_URL, png_bytes, 'scan.png', 'image/png')

# Test with octet-stream content-type (what some browsers send)
run_test('WEBP as octet-stream (browser fallback)',
    DIRECT_URL, webp_bytes, 'scan.webp', 'application/octet-stream')

# Test with no content-type
run_test('JPEG no content-type (empty string)',
    DIRECT_URL, jpg_bytes, 'scan.jpg', '')

# ── Test 2: Validation error tests ───────────────────────────────
print(f'\n{DIV}')
print('  VALIDATION ERROR TESTS')
print(DIV)

run_test('Empty file → 422',
    DIRECT_URL, b'', 'empty.jpg', 'image/jpeg',
    expect_status=422)

run_test('Bad extension → 415/422',
    DIRECT_URL, jpg_bytes, 'scan.exe', 'application/octet-stream',
    expect_status=422)  # 422 = Unprocessable Entity (validation error)

big = b'x' * (11 * 1024 * 1024)
run_test('File too large (11MB) → 422',
    DIRECT_URL, big, 'big.jpg', 'image/jpeg',
    expect_status=422)

run_test('Corrupted image bytes → 422',
    DIRECT_URL, b'NOTANIMAGE1234', 'bad.jpg', 'image/jpeg',
    expect_status=422)

# ── Test 3: Self-assessment endpoint ─────────────────────────────
print(f'\n{DIV}')
print('  SELF-ASSESSMENT ENDPOINT TEST  (direct → port 8001)')
print(DIV)

payload = json.dumps({
    "athlete_id": "07",
    "session_type": "Training",
    "training_duration_min": 75,
    "training_intensity": 4,
    "pain_level": 7,
    "pain_locations": ["Knee"],
    "symptoms": ["Joint stiffness", "Swelling", "Difficulty running"],
    "fatigue_level": 8,
    "previous_injury": True,
    "previous_injury_location": "Knee",
    "recovery_status": "Partially recovered",
    "description": "My right knee hurts after running and feels stiff when I bend it."
}).encode()

req = urllib.request.Request(
    'http://localhost:8001/api/self-assessment',
    data=payload, method='POST',
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        result = json.loads(r.read())
        f = result['features']
        ind = result['indicators']
        print(f'  [PASS] POST /api/self-assessment')
        print(f'         pain_level           = {f["pain_level"]}')
        print(f'         fatigue_level        = {f["fatigue_level"]}')
        print(f'         stiffness            = {f["stiffness"]}')
        print(f'         swelling             = {f["swelling"]}')
        print(f'         movement_difficulty  = {f["movement_difficulty"]}')
        print(f'         overall_risk_score   = {f["overall_risk_score"]}')
        print(f'         status_label         = {result["status_label"]}')
        print(f'         session_id           = {result["session_id"]}')
        print()
        print('         Symptom indicators:')
        for k, v in ind.items():
            if v:
                print(f'           {k} = {v}')
        print()
        print('         Text keywords extracted:')
        kw = result.get('risk_fusion_payload', {}).get('text_keywords', {})
        for k, v in kw.items():
            print(f'           {k}: {v}')
        passed += 1
except Exception as e:
    print(f'  [FAIL] POST /api/self-assessment -> {e}')
    failed += 1

# ── Test 4: Via Vite proxy ────────────────────────────────────────
print(f'\n{DIV}')
print('  VIA VITE PROXY  (browser → port 5173 → port 8001)')
print(DIV)
run_test('JPEG via Vite proxy (5173)',
    PROXY_URL, jpg_bytes, 'scan.jpg', 'image/jpeg')

run_test('PNG via Vite proxy (5173)',
    PROXY_URL, png_bytes, 'scan.png', 'image/png')

# ── Summary ───────────────────────────────────────────────────────
print(f'\n{"="*60}')
print(f'  RESULTS: {passed} PASSED   {failed} FAILED')
print(f'{"="*60}\n')

if failed == 0:
    print('  All MRI upload tests passed.\n')
    print('  To use in the browser:')
    print('  1. Open http://localhost:5173')
    print('  2. Click "Upload MRI Scan"')
    print('  3. Drag & drop or click to browse any JPG/PNG/WEBP image')
    print('  4. Click "Analyze MRI"\n')
else:
    print('  Some tests failed — check output above.\n')
