"""
Live HTTP Test Suite for SkillBridge Endpoints
Runs against running FastAPI server at http://127.0.0.1:8000
"""
import urllib.request
import urllib.error
import json
import io

BASE_URL = "http://127.0.0.1:8000"

def request_json(path, method="GET", body=None, content_type="application/json"):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": content_type} if body is not None else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("=" * 70)
print("RUNNING LIVE ENDPOINT VERIFICATION AGAINST FASTAPI ON 127.0.0.1:8000")
print("=" * 70)

# TEST 1: Health endpoints
status, res = request_json("/health")
assert status == 200 and res["status"] == "online", f"Failed /health: {res}"
print("[PASS] [TEST 1.1] GET /health -> 200 OK, Service:", res["service"])

status, res = request_json("/api/health")
assert status == 200 and res["status"] == "online", f"Failed /api/health: {res}"
print("[PASS] [TEST 1.2] GET /api/health -> 200 OK")

# TEST 2: Demo data endpoint
status, demo_data = request_json("/api/demo-data")
assert status == 200, f"Failed /api/demo-data: {demo_data}"
assert demo_data["candidate_name"] == "Rohan Sharma"
assert "REST API" in demo_data["job_description"]
print(f"[PASS] [TEST 2] GET /api/demo-data -> Candidate: {demo_data['candidate_name']}, Role: {demo_data['job_role']}")

# TEST 3: Gap Analysis for Official Demo (Candidate A: Rohan Sharma)
gap_payload_a = {
    "resume_text": demo_data["resume_text"],
    "job_description": demo_data["job_description"],
    "job_role": demo_data["job_role"]
}
status, res_a = request_json("/api/analyze-gap", method="POST", body=gap_payload_a)
assert status == 200, f"Failed /api/analyze-gap: {res_a}"
gap_a = res_a["gap_analysis"]
print(f"[PASS] [TEST 3.1] Candidate A Readiness Score: {gap_a['readiness_score']}%")
print(f"[PASS] [TEST 3.2] Candidate A Critical Gaps: {gap_a['critical_gaps']}")
assert "REST API" in gap_a["critical_gaps"], "REST API must be a critical gap for Rohan"
assert res_a["personalized_challenge"]["skill_gap"] == "REST API", "Candidate A must receive REST API challenge"
print(f"[PASS] [TEST 3.3] Candidate A Assigned Challenge: {res_a['personalized_challenge']['title']}")

# Verify "Why This Skill Matters" explanation
prioritized_gaps = gap_a["prioritized_gaps"]
rest_gap = next((g for g in prioritized_gaps if g["skill"] == "REST API"), None)
assert rest_gap is not None and "reason" in rest_gap
print(f"[PASS] [TEST 3.4] Why REST API Matters: '{rest_gap['reason'][:80]}...'")
print(f"[PASS] [TEST 3.5] Challenge Why Tested: '{res_a['personalized_challenge']['why_tested'][:80]}...'")

# TEST 4: Gap Analysis for Candidate B (Different Profile -> Different Gap & Challenge)
resume_b = """PRIYA PATEL
Skills: Python, REST API, FastAPI, SQL, PostgreSQL, Git, Docker
Projects: Scaled REST API microservices with PostgreSQL backend.
Education: B.Tech Computer Science"""

jd_b = """Role: Backend & Algorithms Engineer
Required: Python, DSA, Algorithms, Time Complexity, SQL
Preferred: Docker, CI/CD"""

status, res_b = request_json("/api/analyze-gap", method="POST", body={
    "resume_text": resume_b,
    "job_description": jd_b,
    "job_role": "Backend Algorithms Engineer"
})
assert status == 200
gap_b = res_b["gap_analysis"]
print(f"[PASS] [TEST 4.1] Candidate B Matched: {gap_b['matched_skills']}, Critical Gaps: {gap_b['critical_gaps']}")
assert "DSA" in gap_b["critical_gaps"], "DSA must be critical gap for Candidate B"
assert res_b["personalized_challenge"]["skill_gap"] == "DSA", "Candidate B must receive DSA challenge"
print(f"[PASS] [TEST 4.2] Candidate B Assigned Challenge: {res_b['personalized_challenge']['title']}")

# TEST 5: Challenge Generation Endpoint for All 5 Categories
categories = ["REST API", "DSA", "Python", "SQL", "React"]
for cat in categories:
    status, chal_res = request_json("/api/generate-challenge", method="POST", body={"skill": cat})
    assert status == 200, f"Failed for category {cat}"
    chal = chal_res["challenge"]
    assert chal["skill_gap"] == cat
    assert len(chal["sample_test_cases"]) > 0
    assert len(chal["hidden_test_cases"]) > 0
    print(f"[PASS] [TEST 5] Generated challenge for [{cat}]: '{chal['title']}' ({chal['difficulty']})")

# TEST 6: Closed-Loop Assessment Evaluation (PASS Case)
eval_pass_payload = {
    "initial_readiness": 38,
    "challenge_data": res_a["personalized_challenge"],
    "test_results": {"total": 5, "passed": 5, "failed": 0, "score_pct": 100}
}
status, pass_res = request_json("/api/evaluate-assessment", method="POST", body=eval_pass_payload)
assert status == 200
prog_pass = pass_res["progress"]
assert prog_pass["updated_readiness"] == 48, f"Expected 48, got {prog_pass['updated_readiness']}"
assert prog_pass["score_delta"] == 10
assert prog_pass["new_confidence_level"] == "Demonstrated Competency"
print(f"[PASS] [TEST 6] Evaluation PASS: 38% -> 48% (+10 pts), Status: {prog_pass['new_confidence_level']}")

# TEST 7: Closed-Loop Assessment Evaluation (FAIL Case)
eval_fail_payload = {
    "initial_readiness": 38,
    "challenge_data": res_a["personalized_challenge"],
    "test_results": {"total": 5, "passed": 1, "failed": 4, "score_pct": 20}
}
status, fail_res = request_json("/api/evaluate-assessment", method="POST", body=eval_fail_payload)
assert status == 200
prog_fail = fail_res["progress"]
assert prog_fail["updated_readiness"] == 38, "Failed test must NOT increase readiness"
assert prog_fail["score_delta"] == 0
assert prog_fail["new_confidence_level"] == "Needs Guided Practice"
print(f"[PASS] [TEST 7] Evaluation FAIL: 38% -> 38% (+0 pts), Status: {prog_fail['new_confidence_level']}")

# TEST 8: Text Resume Parsing Endpoint
status, parse_res = request_json("/api/analyze", method="POST", body={
    "text": "Jane Doe\nEmail: jane@domain.com\nSkills: Python, React, SQL, Git\nEducation: BS CS"
})
assert status == 200
assert "Python" in parse_res["skills"] and "React" in parse_res["skills"]
print(f"[PASS] [TEST 8] Resume Text Parse -> Extracted skills: {parse_res['skills']}")

print("\n" + "=" * 70)
print("ALL LIVE ENDPOINT TESTS PASSED COMPLETELY AND DETERMINISTICALLY!")
print("=" * 70)
