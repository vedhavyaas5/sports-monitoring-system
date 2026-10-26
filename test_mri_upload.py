"""Test MRI upload endpoint directly."""
import urllib.request, json, os

img_path = (r'c:\studies\sports monitoring system\dataset'
            r'\medical imaging sports data\medical imaging sports data\OIP (1).webp')

with open(img_path, 'rb') as f:
    img_data = f.read()

boundary = b'----FormBoundaryXYZ123'

body = (
    b'--' + boundary + b'\r\n' +
    b'Content-Disposition: form-data; name="file"; filename="OIP1.webp"\r\n' +
    b'Content-Type: image/webp\r\n\r\n' +
    img_data + b'\r\n' +
    b'--' + boundary + b'\r\n' +
    b'Content-Disposition: form-data; name="athlete_id"\r\n\r\n' +
    b'07\r\n' +
    b'--' + boundary + b'--\r\n'
)

req = urllib.request.Request(
    'http://localhost:8001/api/mri/analyze',
    data=body,
    headers={'Content-Type': 'multipart/form-data; boundary=----FormBoundaryXYZ123'},
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=15) as r:
        result = json.loads(r.read())
        print('HTTP STATUS :', r.status)
        print('PREDICTION  :', result.get('prediction'))
        print('CONFIDENCE  :', result.get('confidence_pct'), '%')
        print('TOP-2       :', result.get('top_2'))
        print('MODEL       :', result.get('model_name'))
        print('DEMO WARNING:', result.get('demo_warning', 'N/A')[:60])
        print('DISCLAIMER  :', result.get('disclaimer', '')[:60], '...')
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.reason)
    print(e.read().decode())
except Exception as e:
    print('Error:', type(e).__name__, e)
