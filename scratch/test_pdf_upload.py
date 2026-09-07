import io
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

pdf_content = (
    b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'
    b'2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n'
    b'3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n'
    b'4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n'
    b'5 0 obj<</Length 120>>stream\nBT\n/F1 12 Tf\n72 712 Td\n'
    b'(Rohan Sharma Python SQL Developer rohan@example.com Education: B.Tech CS) Tj\n'
    b'ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n'
    b'0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n'
    b'0000000222 00000 n \n0000000295 00000 n \ntrailer<</Size 6/Root 1 0 R>>\n'
    b'startxref\n466\n%%EOF'
)

resp = client.post(
    "/upload-resume",
    files={"file": ("resume.pdf", pdf_content, "application/pdf")}
)
print("PDF Upload Status:", resp.status_code)
print("Response JSON:", resp.json())
assert resp.status_code == 200
assert "Python" in resp.json()["skills"] or "SQL" in resp.json()["skills"]
print("PDF Upload with text extraction verified successfully!")
