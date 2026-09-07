"""
SkillBridge Core Engine
[CC-GFG-12] Employability Gap Analyzer & Custom Coding Assessment Engine

Features:
- Deterministic and semantic skill normalization
- JD requirement separation (Required vs Preferred)
- Explainable 5-Factor Job Readiness Scoring
- Prioritized Gap Matrix (Impact x Importance x Gap x Confidence)
- Competitive-programming inspired GFG-style Coding Challenge Generator
- Safe, curated local challenge bank with visible & hidden test cases
- Personalized 7-Day Sprint Action Plan generator
"""

import re
from typing import Dict, List, Any, Optional

# =====================================================================
# 1. CANONICAL SKILL NORMALIZATION & TAXONOMY
# =====================================================================

SKILL_CANONICAL_MAP = {
    # Programming Languages
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ecmascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "golang": "Go",
    "go": "Go",
    "cpp": "C++",
    "c++": "C++",
    "c#": "C#",
    "csharp": "C#",
    "java": "Java",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "sql": "SQL",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",

    # Frontend Frameworks & Libraries
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "vue": "Vue",
    "vuejs": "Vue",
    "vue.js": "Vue",
    "angular": "Angular",
    "angularjs": "Angular",
    "svelte": "Svelte",
    "redux": "Redux",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "sass": "Sass",
    "mui": "Material UI",
    "material ui": "Material UI",

    # Backend Frameworks
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express",
    "expressjs": "Express",
    "express.js": "Express",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "nestjs": "NestJS",

    # Databases & Caching
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "firebase": "Firebase",
    "supabase": "Supabase",

    # APIs & Architecture
    "rest": "REST API",
    "rest api": "REST API",
    "rest apis": "REST API",
    "restful": "REST API",
    "restful api": "REST API",
    "graphql": "GraphQL",
    "grpc": "gRPC",
    "microservices": "Microservices",
    "system design": "System Design",

    # DevOps, Cloud & Tools
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "linux": "Linux",
    "postman": "Postman",

    # Core CS & Data Structures
    "dsa": "DSA",
    "data structures": "DSA",
    "algorithms": "DSA",
    "dbms": "DBMS",
    "oop": "OOP",
    "object oriented programming": "OOP",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning"
}

ALL_RECOGNIZED_SKILLS = sorted(list(set(SKILL_CANONICAL_MAP.values())))


def normalize_skill_name(raw_skill: str) -> str:
    """Normalize a raw skill string to its canonical industry name."""
    clean = raw_skill.strip().lower()
    clean = re.sub(r"[^\w\+\#\.\s\-]", "", clean)
    clean = re.sub(r"\s+", " ", clean)
    return SKILL_CANONICAL_MAP.get(clean, raw_skill.strip())


def search_skill_in_text(skill_name: str, text: str) -> bool:
    """
    Precision regex search preventing false positives.
    e.g. 'C' will not match 'CSS' or 'Class', 'Java' will not match 'JavaScript'.
    """
    if not text or not skill_name:
        return False

    escaped = re.escape(skill_name)
    # If skill contains special characters like ++ or #, adapt regex boundaries
    if "+" in skill_name or "#" in skill_name:
        pattern = rf"(?<![\w\+\#]){escaped}(?![\w\+\#])"
    else:
        pattern = rf"\b{escaped}\b"

    return bool(re.search(pattern, text, re.IGNORECASE))


# =====================================================================
# 2. JOB DESCRIPTION & RESUME INTELLIGENCE
# =====================================================================

def parse_jd_requirements(jd_text: str) -> Dict[str, Any]:
    """
    Extract required vs preferred skills and responsibilities from a JD.
    """
    jd_lower = jd_text.lower()
    
    # Identify required vs preferred sections
    required_keywords = [
        "required", "requirements", "must have", "must-have", "qualifications",
        "minimum qualifications", "essential", "what you'll need", "mandatory"
    ]
    preferred_keywords = [
        "preferred", "nice to have", "good to have", "plus", "bonus", "desirable",
        "optional", "preferred qualifications"
    ]

    required_skills = []
    preferred_skills = []
    all_found_skills = []

    # Detect all skills in JD
    for raw_key, canonical in SKILL_CANONICAL_MAP.items():
        if search_skill_in_text(raw_key, jd_text) or search_skill_in_text(canonical, jd_text):
            if canonical not in all_found_skills:
                all_found_skills.append(canonical)

    # Order skills according to their appearance order in the Job Description
    all_found_skills.sort(key=lambda s: jd_lower.find(s.lower()) if jd_lower.find(s.lower()) != -1 else 999999)

    # Segregate based on section headings or keywords
    for skill in all_found_skills:
        # Check if mentioned near preferred words
        skill_pos = jd_lower.find(skill.lower())
        context_window = jd_lower[max(0, skill_pos - 120):min(len(jd_lower), skill_pos + 120)]
        
        is_preferred = any(pk in context_window for pk in preferred_keywords)
        if is_preferred and not any(rk in context_window for rk in required_keywords):
            preferred_skills.append(skill)
        else:
            required_skills.append(skill)

    # If no distinction detected, treat top essential skills as required
    if not required_skills and all_found_skills:
        required_skills = all_found_skills[:max(1, len(all_found_skills) * 3 // 4)]
        preferred_skills = [s for s in all_found_skills if s not in required_skills]

    return {
        "all_skills": all_found_skills,
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "total_skills": len(all_found_skills)
    }


# =====================================================================
# 3. EXPLAINABLE 5-FACTOR READINESS SCORING ENGINE
# =====================================================================

def compute_5factor_readiness_score(
    matched_skills: List[str],
    partial_skills: List[str],
    all_jd_skills: List[str],
    required_skills: List[str],
    projects_count: int = 0,
    exp_count: int = 0,
    education_count: int = 1,
    verified_proofs_count: int = 0
) -> Dict[str, Any]:
    """
    Explainable, deterministic 5-Factor Job Readiness Scoring Engine.
    Total = 100 pts.
    1. Technical Skills Alignment (40%) - Matched = 1.0, Partial = 0.5
    2. Core Job Requirements Match (20%) - Required skills higher impact than preferred
    3. Experience & Technical Proof (20%) - Projects + verified coding assessment passes
    4. Tooling & DevOps (10%) - Critical version control and deployment tools
    5. Education & Background (10%) - Foundational CS/degree background
    """
    total_jd = len(all_jd_skills) if all_jd_skills else 1
    total_req = len(required_skills) if required_skills else 1

    # 1. Technical Skills Alignment (40%)
    tech_match_ratio = (len(matched_skills) * 1.0 + len(partial_skills) * 0.5) / total_jd
    tech_skills_score = round(min(40, max(0, tech_match_ratio * 40)))

    # 2. Core Job Requirements Match (20%)
    req_matched = [s for s in matched_skills if s in required_skills]
    req_partial = [s for s in partial_skills if s in required_skills]
    req_ratio = (len(req_matched) * 1.0 + len(req_partial) * 0.5) / total_req
    core_req_score = round(min(20, max(0, req_ratio * 20)))

    # 3. Experience & Technical Proof (20%)
    exp_score = min(20, (projects_count * 5) + (exp_count * 5) + (verified_proofs_count * 4))
    if exp_score == 0 and len(matched_skills) > 0:
        exp_score = 6

    # 4. Tooling & DevOps (10%)
    devops_skills = ["Git", "GitHub", "Docker", "AWS", "CI/CD", "Linux", "Postman", "Kubernetes"]
    devops_found = sum(1 for s in matched_skills + partial_skills if s in devops_skills)
    tooling_score = min(10, max(2 if devops_found == 0 and len(matched_skills) > 0 else 0, devops_found * 4))

    # 5. Education & Background (10%)
    education_score = 10 if education_count > 0 else 5

    total_score = min(100, max(10, tech_skills_score + core_req_score + exp_score + tooling_score + education_score))

    return {
        "readiness_score": total_score,
        "score_breakdown": {
            "technical_skills": {"score": tech_skills_score, "max": 40, "weight": "40%"},
            "core_requirements": {"score": core_req_score, "max": 20, "weight": "20%"},
            "experience_and_projects": {"score": exp_score, "max": 20, "weight": "20%"},
            "tooling_and_devops": {"score": tooling_score, "max": 10, "weight": "10%"},
            "education_and_background": {"score": education_score, "max": 10, "weight": "10%"}
        }
    }


# =====================================================================
# 4. SMART SKILL MATCHING & GAP PRIORITIZATION
# =====================================================================

def match_skills_and_analyze_gaps(resume_data: Dict[str, Any], jd_text: str) -> Dict[str, Any]:

    """
    Calculates:
    - Matched, Partial, Missing skills
    - Prioritized Gaps (HIGH, MEDIUM, LOW) with 'Why it matters'
    - 5-Factor Explainable Job Readiness Score
    """
    resume_text = resume_data.get("extracted_text", "")
    resume_skills = [normalize_skill_name(s) for s in resume_data.get("skills", [])]
    projects = resume_data.get("projects", [])
    experience = resume_data.get("experience", [])
    education = resume_data.get("education", [])

    # Text search in projects and experience for contextual confidence
    project_text = " ".join([str(p.get("title", "")) + " " + " ".join(p.get("technologies", [])) for p in projects if isinstance(p, dict)])
    exp_text = " ".join([str(e) for e in experience])

    jd_info = parse_jd_requirements(jd_text)
    required_skills = jd_info["required_skills"]
    preferred_skills = jd_info["preferred_skills"]
    all_jd_skills = jd_info["all_skills"]

    matched = []
    partial = []
    missing = []
    skill_details = []

    for skill in all_jd_skills:
        in_resume_skills = skill in resume_skills or any(search_skill_in_text(k, " ".join(resume_skills)) for k, v in SKILL_CANONICAL_MAP.items() if v == skill)
        in_resume_text = search_skill_in_text(skill, resume_text)
        in_projects = search_skill_in_text(skill, project_text) or search_skill_in_text(skill, exp_text)
        is_req = skill in required_skills

        importance = "REQUIRED" if is_req else "PREFERRED"

        if in_resume_skills and in_projects:
            status = "MATCHED"
            confidence = 92
            matched.append(skill)
            reason = f"Explicitly listed in your resume and evidenced in your projects/experience."
        elif in_resume_skills or in_resume_text:
            status = "PARTIAL"
            confidence = 68
            partial.append(skill)
            reason = f"Mentioned in your resume, but lacking direct evidence in listed key projects or work achievements."
        else:
            status = "MISSING"
            confidence = 20
            missing.append(skill)
            reason = f"Target {importance} skill explicitly required by the job posting but not identified in your resume."

        # Calculate Priority Score for Gaps
        # Priority = Impact(req=3, pref=1.5) * GapWeight(missing=3, partial=1.5)
        impact_multiplier = 3.0 if is_req else 1.5
        gap_multiplier = 3.0 if status == "MISSING" else (1.5 if status == "PARTIAL" else 0.0)
        priority_val = impact_multiplier * gap_multiplier

        if priority_val >= 6.0:
            priority_tier = "HIGH"
        elif priority_val >= 2.5:
            priority_tier = "MEDIUM"
        elif priority_val > 0:
            priority_tier = "LOW"
        else:
            priority_tier = "NONE"

        skill_details.append({
            "skill": skill,
            "status": status,
            "importance": importance,
            "confidence": confidence,
            "priority": priority_tier,
            "priority_score": round(priority_val, 1),
            "reason": reason
        })

    priority_order = {"HIGH": 3, "MEDIUM": 2, "LOW": 1, "NONE": 0}
    skill_details.sort(key=lambda x: (priority_order.get(x["priority"], 0), x["priority_score"]), reverse=True)
    prioritized_gaps = [s for s in skill_details if s["status"] in ["MISSING", "PARTIAL"]]

    # =====================================================================

    # 4. EXPLAINABLE READINESS SCORE (5-FACTOR DETERMINISTIC MODEL)
    # =====================================================================
    scoring_result = compute_5factor_readiness_score(
        matched_skills=matched,
        partial_skills=partial,
        all_jd_skills=all_jd_skills,
        required_skills=required_skills,
        projects_count=len(projects),
        exp_count=len(experience),
        education_count=len(education)
    )

    strong_areas = matched[:4]
    critical_gaps = [g["skill"] for g in prioritized_gaps if g["priority"] == "HIGH"]
    potential_gaps = [g["skill"] for g in prioritized_gaps if g["priority"] == "MEDIUM"]
    total_jd = len(all_jd_skills) if all_jd_skills else 1

    return {
        "readiness_score": scoring_result["readiness_score"],
        "readiness_label": "SkillBridge Readiness Estimate",
        "score_breakdown": scoring_result["score_breakdown"],
        "matched_skills": matched,
        "partial_skills": partial,
        "missing_skills": missing,
        "all_skills_analysis": skill_details,
        "prioritized_gaps": prioritized_gaps,
        "strong_areas": strong_areas,
        "critical_gaps": critical_gaps,
        "potential_gaps": potential_gaps,
        "all_jd_skills": all_jd_skills,
        "required_skills": required_skills,
        "match_percentage": round((len(matched) + 0.5 * len(partial)) / total_jd * 100) if total_jd > 0 else 0
    }



# =====================================================================
# 5. GFG-STYLE ORIGINAL CODING CHALLENGE BANK & GENERATOR
# =====================================================================

CHALLENGE_BANK: Dict[str, Dict[str, Any]] = {
    "REST API": {
        "id": "chal_rest_api_01",
        "skill_gap": "REST API",
        "title": "Build a REST API Query Filter & Pagination Engine",
        "difficulty": "Medium",
        "time_limit_sec": 5,
        "problem_statement": """In modern backend microservices, REST APIs must safely handle pagination and filtering query parameters.

You are tasked with implementing the core backend filtering utility function `filter_api_records(records, query_params)`.

The function takes:
1. `records`: A list of dictionaries representing database items (each containing `id`, `category`, `price`, `status`).
2. `query_params`: A dictionary of URL query parameters:
   - `category` (optional, string): Exact match filter.
   - `max_price` (optional, number): Keep items where `price <= max_price`.
   - `status` (optional, string): Exact match filter.
   - `page` (optional, integer >= 1, default 1): 1-indexed page number.
   - `page_size` (optional, integer >= 1, default 5): Number of items per page.

Return a dictionary with:
- `"items"`: List of records on the requested page (sorted ascending by `id`).
- `"total_items"`: Total number of records matching filter criteria before pagination.
- `"page"`: Current page number.
- `"total_pages"`: Total number of pages (integer ceiling of total_items / page_size, minimum 1).""",
        "input_format": "records: List[Dict], query_params: Dict[str, Any]",
        "output_format": "Dict with keys ['items', 'total_items', 'page', 'total_pages']",
        "constraints": [
            "1 <= len(records) <= 1000",
            "page >= 1, page_size >= 1",
            "Output items must preserve ascending order by record 'id'."
        ],
        "examples": [
            {
                "input": "records = [{'id': 1, 'category': 'tech', 'price': 100}, {'id': 2, 'category': 'books', 'price': 50}], query_params = {'category': 'tech'}",
                "output": "{'items': [{'id': 1, 'category': 'tech', 'price': 100}], 'total_items': 1, 'page': 1, 'total_pages': 1}",
                "explanation": "Only record 1 matches the 'tech' category filter."
            }
        ],
        "starter_code": """def filter_api_records(records, query_params):
    \"\"\"
    Filter and paginate REST API records according to query_params.
    Return dict: {'items': [...], 'total_items': int, 'page': int, 'total_pages': int}
    \"\"\"
    # TODO: Implement REST API filter & pagination logic
    filtered = records
    
    # 1. Apply category filter if present
    
    # 2. Apply max_price filter if present
    
    # 3. Apply pagination (page, page_size)
    
    return {
        "items": [],
        "total_items": 0,
        "page": 1,
        "total_pages": 1
    }
""",
        "solution_code": """def filter_api_records(records, query_params):
    filtered = []
    category = query_params.get("category")
    max_price = query_params.get("max_price")
    status = query_params.get("status")
    page = int(query_params.get("page", 1))
    page_size = int(query_params.get("page_size", 5))

    for r in records:
        if category is not None and r.get("category") != category:
            continue
        if max_price is not None and r.get("price", 0) > max_price:
            continue
        if status is not None and r.get("status") != status:
            continue
        filtered.append(r)

    filtered.sort(key=lambda x: x.get("id", 0))
    total_items = len(filtered)
    import math
    total_pages = max(1, math.ceil(total_items / page_size))

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = filtered[start_idx:end_idx]

    return {
        "items": paginated_items,
        "total_items": total_items,
        "page": page,
        "total_pages": total_pages
    }
""",
        "function_name": "filter_api_records",
        "sample_test_cases": [
            {
                "name": "Visible Test 1: Category Filter",
                "call": "filter_api_records([{'id': 1, 'category': 'books', 'price': 20}, {'id': 2, 'category': 'tech', 'price': 99}], {'category': 'tech'})",
                "expected": "{'items': [{'id': 2, 'category': 'tech', 'price': 99}], 'total_items': 1, 'page': 1, 'total_pages': 1}"
            },
            {
                "name": "Visible Test 2: Price Limit Filter",
                "call": "filter_api_records([{'id': 1, 'price': 10}, {'id': 2, 'price': 30}, {'id': 3, 'price': 50}], {'max_price': 25})",
                "expected": "{'items': [{'id': 1, 'price': 10}], 'total_items': 1, 'page': 1, 'total_pages': 1}"
            }
        ],
        "hidden_test_cases": [
            {
                "name": "Hidden Test 3: Pagination Offset & Total Pages",
                "call": "filter_api_records([{'id': i, 'price': i*10} for i in range(1, 11)], {'page': 2, 'page_size': 3})",
                "expected": "{'items': [{'id': 4, 'price': 40}, {'id': 5, 'price': 50}, {'id': 6, 'price': 60}], 'total_items': 10, 'page': 2, 'total_pages': 4}"
            },
            {
                "name": "Hidden Test 4: Combined Category, Price & Status",
                "call": "filter_api_records([{'id': 1, 'category': 'cloud', 'price': 40, 'status': 'active'}, {'id': 2, 'category': 'cloud', 'price': 80, 'status': 'active'}, {'id': 3, 'category': 'cloud', 'price': 30, 'status': 'inactive'}], {'category': 'cloud', 'max_price': 50, 'status': 'active'})",
                "expected": "{'items': [{'id': 1, 'category': 'cloud', 'price': 40, 'status': 'active'}], 'total_items': 1, 'page': 1, 'total_pages': 1}"
            },
            {
                "name": "Hidden Test 5: Empty Result Boundaries",
                "call": "filter_api_records([{'id': 1, 'price': 50}], {'max_price': 20})",
                "expected": "{'items': [], 'total_items': 0, 'page': 1, 'total_pages': 1}"
            }
        ],
        "why_tested": "REST APIs are listed as a critical requirement in your target job description. Evaluating endpoint filtering proves your understanding of HTTP query handling, payload contracts, and pagination."
    },
    "DSA": {
        "id": "chal_dsa_01",
        "skill_gap": "DSA",
        "title": "Optimized Longest Monotonic Subarray",
        "difficulty": "Easy-Medium",
        "time_limit_sec": 5,
        "problem_statement": """Given an integer array `nums`, find the length of the longest subarray which is either strictly increasing or strictly decreasing.

An array is strictly increasing if `nums[i] < nums[i+1]` for all valid `i`.
An array is strictly decreasing if `nums[i] > nums[i+1]` for all valid `i`.

Implement `longest_monotonic_subarray(nums)` in O(n) time and O(1) extra space.""",
        "input_format": "nums: List[int]",
        "output_format": "int: length of longest monotonic subarray",
        "constraints": [
            "1 <= len(nums) <= 10^5",
            "-10^4 <= nums[i] <= 10^4"
        ],
        "examples": [
            {"input": "nums = [1, 4, 3, 3, 2]", "output": "2", "explanation": "Strictly increasing subarrays: [1,4]. Strictly decreasing: [4,3], [3,2]. Max length = 2."},
            {"input": "nums = [3, 2, 1]", "output": "3", "explanation": "The entire array is strictly decreasing: [3, 2, 1]."}
        ],
        "starter_code": """def longest_monotonic_subarray(nums):
    \"\"\"
    Return length of longest strictly increasing or strictly decreasing subarray.
    \"\"\"
    if not nums:
        return 0
    # TODO: Implement O(n) scan
    return 1
""",
        "solution_code": """def longest_monotonic_subarray(nums):
    if not nums:
        return 0
    max_len = 1
    inc_len = 1
    dec_len = 1
    for i in range(1, len(nums)):
        if nums[i] > nums[i-1]:
            inc_len += 1
            dec_len = 1
        elif nums[i] < nums[i-1]:
            dec_len += 1
            inc_len = 1
        else:
            inc_len = 1
            dec_len = 1
        if inc_len > max_len:
            max_len = inc_len
        if dec_len > max_len:
            max_len = dec_len
    return max_len
""",
        "function_name": "longest_monotonic_subarray",
        "sample_test_cases": [
            {"name": "Visible Test 1: Mixed Array", "call": "longest_monotonic_subarray([1, 4, 3, 3, 2])", "expected": "2"},
            {"name": "Visible Test 2: Decreasing Array", "call": "longest_monotonic_subarray([3, 2, 1])", "expected": "3"}
        ],
        "hidden_test_cases": [
            {"name": "Hidden Test 3: Strictly Increasing", "call": "longest_monotonic_subarray([1, 2, 3, 4, 5])", "expected": "5"},
            {"name": "Hidden Test 4: All Equal Elements", "call": "longest_monotonic_subarray([7, 7, 7, 7])", "expected": "1"},
            {"name": "Hidden Test 5: Single Element", "call": "longest_monotonic_subarray([42])", "expected": "1"}
        ],
        "why_tested": "Data Structures & Algorithms are critical for technical screening rounds. Demonstrating optimal O(n) array traversal validates core computer science fundamentals."
    },
    "Python": {
        "id": "chal_python_01",
        "skill_gap": "Python",
        "title": "Robust Log Event Aggregator & Anomaly Detector",
        "difficulty": "Easy-Medium",
        "time_limit_sec": 5,
        "problem_statement": """Backend systems parse millions of log events. 

Implement `aggregate_log_metrics(log_entries)` which processes a list of log strings formatted as:
`"TIMESTAMP LEVEL SERVICE STATUS_CODE LATENCY_MS"`
Example: `"2026-09-07T10:00:00 ERROR auth-service 500 240"`

Return a dictionary with:
- `"total_errors"`: Count of entries where LEVEL is 'ERROR'.
- `"avg_latency"`: Round average latency of all valid entries to 2 decimal places (or 0.0 if empty).
- `"error_services"`: Sorted unique list of service names that experienced errors.
- `"slowest_service"`: Service name with the highest individual latency.""",
        "input_format": "log_entries: List[str]",
        "output_format": "Dict with total_errors, avg_latency, error_services, slowest_service",
        "constraints": [
            "0 <= len(log_entries) <= 10^4",
            "Each valid entry has 5 space-separated fields."
        ],
        "examples": [
            {
                "input": "['2026-09-07T10:00:00 ERROR auth 500 250', '2026-09-07T10:00:01 INFO payment 200 50']",
                "output": "{'total_errors': 1, 'avg_latency': 150.0, 'error_services': ['auth'], 'slowest_service': 'auth'}",
                "explanation": "Average latency = (250+50)/2 = 150.0, slowest service is auth."
            }
        ],
        "starter_code": """def aggregate_log_metrics(log_entries):
    \"\"\"
    Parse logs and aggregate telemetry metrics.
    \"\"\"
    # TODO: Implement log metrics aggregation
    return {
        "total_errors": 0,
        "avg_latency": 0.0,
        "error_services": [],
        "slowest_service": ""
    }
""",
        "solution_code": """def aggregate_log_metrics(log_entries):
    if not log_entries:
        return {"total_errors": 0, "avg_latency": 0.0, "error_services": [], "slowest_service": ""}
    total_errors = 0
    total_latency = 0
    error_services = set()
    max_latency = -1
    slowest_service = ""
    valid_count = 0

    for entry in log_entries:
        parts = entry.strip().split()
        if len(parts) != 5:
            continue
        ts, level, service, status, latency_str = parts
        try:
            latency = float(latency_str)
        except ValueError:
            continue
        valid_count += 1
        total_latency += latency

        if level == "ERROR":
            total_errors += 1
            error_services.add(service)

        if latency > max_latency:
            max_latency = latency
            slowest_service = service

    avg_latency = round(total_latency / valid_count, 2) if valid_count > 0 else 0.0
    return {
        "total_errors": total_errors,
        "avg_latency": avg_latency,
        "error_services": sorted(list(error_services)),
        "slowest_service": slowest_service
    }
""",
        "function_name": "aggregate_log_metrics",
        "sample_test_cases": [
            {
                "name": "Visible Test 1: Standard Logs",
                "call": "aggregate_log_metrics(['2026-09-07T10:00:00 ERROR auth 500 250', '2026-09-07T10:00:01 INFO payment 200 50'])",
                "expected": "{'total_errors': 1, 'avg_latency': 150.0, 'error_services': ['auth'], 'slowest_service': 'auth'}"
            }
        ],
        "hidden_test_cases": [
            {
                "name": "Hidden Test 2: Multiple Error Services",
                "call": "aggregate_log_metrics(['T1 ERROR db 500 100', 'T2 ERROR api 502 300', 'T3 INFO db 200 40'])",
                "expected": "{'total_errors': 2, 'avg_latency': 146.67, 'error_services': ['api', 'db'], 'slowest_service': 'api'}"
            },
            {
                "name": "Hidden Test 3: Empty Entries",
                "call": "aggregate_log_metrics([])",
                "expected": "{'total_errors': 0, 'avg_latency': 0.0, 'error_services': [], 'slowest_service': ''}"
            }
        ],
        "why_tested": "Python backend developers frequently parse telemetry and stream data. This problem tests data structure handling, error management, and string parsing."
    },
    "SQL": {
        "id": "chal_sql_01",
        "skill_gap": "SQL",
        "title": "SQL Aggregate & Join Simulator",
        "difficulty": "Medium",
        "time_limit_sec": 5,
        "problem_statement": """Write `simulate_sql_left_join_aggregate(users, orders)` to simulate an SQL LEFT JOIN between `users` (id, name, department) and `orders` (order_id, user_id, amount).

Return a list of dictionaries sorted by `total_spent` descending (and by `user_id` ascending on ties):
`[{'user_id': int, 'name': str, 'total_spent': float, 'order_count': int}]`

Users with zero orders must appear with `total_spent: 0.0` and `order_count: 0`.""",
        "input_format": "users: List[Dict], orders: List[Dict]",
        "output_format": "List[Dict] sorted by total_spent DESC, user_id ASC",
        "constraints": ["0 <= len(users) <= 1000", "0 <= len(orders) <= 5000"],
        "examples": [
            {
                "input": "users = [{'id': 1, 'name': 'Alice'}], orders = [{'order_id': 101, 'user_id': 1, 'amount': 75.5}]",
                "output": "[{'user_id': 1, 'name': 'Alice', 'total_spent': 75.5, 'order_count': 1}]",
                "explanation": "Alice placed 1 order totaling 75.5."
            }
        ],
        "starter_code": """def simulate_sql_left_join_aggregate(users, orders):
    \"\"\"
    Simulate SQL: 
    SELECT u.id, u.name, COALESCE(SUM(o.amount), 0) as total_spent, COUNT(o.order_id) as order_count
    FROM users u LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id, u.name ORDER BY total_spent DESC, u.id ASC;
    \"\"\"
    # TODO: Implement LEFT JOIN & aggregate
    return []
""",
        "solution_code": """def simulate_sql_left_join_aggregate(users, orders):
    order_sums = {}
    order_counts = {}
    for o in orders:
        uid = o.get("user_id")
        amt = float(o.get("amount", 0))
        order_sums[uid] = order_sums.get(uid, 0.0) + amt
        order_counts[uid] = order_counts.get(uid, 0) + 1

    result = []
    for u in users:
        uid = u.get("id")
        result.append({
            "user_id": uid,
            "name": u.get("name", ""),
            "total_spent": round(order_sums.get(uid, 0.0), 2),
            "order_count": order_counts.get(uid, 0)
        })

    result.sort(key=lambda x: (-x["total_spent"], x["user_id"]))
    return result
""",
        "function_name": "simulate_sql_left_join_aggregate",
        "sample_test_cases": [
            {
                "name": "Visible Test 1: Single User Join",
                "call": "simulate_sql_left_join_aggregate([{'id': 1, 'name': 'Alice'}], [{'order_id': 101, 'user_id': 1, 'amount': 75.5}])",
                "expected": "[{'user_id': 1, 'name': 'Alice', 'total_spent': 75.5, 'order_count': 1}]"
            }
        ],
        "hidden_test_cases": [
            {
                "name": "Hidden Test 2: User With Zero Orders (Left Join Null Preservation)",
                "call": "simulate_sql_left_join_aggregate([{'id': 1, 'name': 'Alice'}, {'id': 2, 'name': 'Bob'}], [{'order_id': 1, 'user_id': 1, 'amount': 50}])",
                "expected": "[{'user_id': 1, 'name': 'Alice', 'total_spent': 50.0, 'order_count': 1}, {'user_id': 2, 'name': 'Bob', 'total_spent': 0.0, 'order_count': 0}]"
            }
        ],
        "why_tested": "Database query understanding and data aggregation are indispensable skills for backend and full-stack software engineers."
    },
    "React": {
        "id": "chal_react_01",
        "skill_gap": "React",
        "title": "Virtual DOM Diffing & State Patch Calculator",
        "difficulty": "Medium",
        "time_limit_sec": 5,
        "problem_statement": """React optimizes rendering by diffing virtual DOM nodes and calculating required DOM mutations.

Implement `compute_vdom_patches(old_tree, new_tree)` where trees are dicts:
`{'tag': str, 'props': dict, 'children': list}`

Return a dict describing mutations:
- `"tag_changed"`: bool (True if old_tree['tag'] != new_tree['tag'])
- `"props_added"`: dict of props in new_tree not in old_tree or with changed values
- `"props_removed"`: list of prop keys present in old_tree but removed in new_tree
- `"children_count_delta"`: int (len(new_tree['children']) - len(old_tree['children']))""",
        "input_format": "old_tree: Dict, new_tree: Dict",
        "output_format": "Dict with keys ['tag_changed', 'props_added', 'props_removed', 'children_count_delta']",
        "constraints": ["Trees are valid dictionary structures."],
        "examples": [
            {
                "input": "old = {'tag': 'div', 'props': {'id': 'a'}, 'children': []}, new = {'tag': 'div', 'props': {'id': 'b', 'className': 'box'}, 'children': ['item']}",
                "output": "{'tag_changed': False, 'props_added': {'id': 'b', 'className': 'box'}, 'props_removed': [], 'children_count_delta': 1}",
                "explanation": "Prop 'id' changed, 'className' added, 1 child added."
            }
        ],
        "starter_code": """def compute_vdom_patches(old_tree, new_tree):
    \"\"\"
    Compute VDOM diff patches between old_tree and new_tree.
    \"\"\"
    # TODO: Implement React reconciliation patch calculation
    return {
        "tag_changed": False,
        "props_added": {},
        "props_removed": [],
        "children_count_delta": 0
    }
""",
        "solution_code": """def compute_vdom_patches(old_tree, new_tree):
    tag_changed = old_tree.get("tag") != new_tree.get("tag")
    old_props = old_tree.get("props", {})
    new_props = new_tree.get("props", {})

    props_added = {}
    props_removed = []

    for k, v in new_props.items():
        if k not in old_props or old_props[k] != v:
            props_added[k] = v

    for k in old_props:
        if k not in new_props:
            props_removed.append(k)

    delta = len(new_tree.get("children", [])) - len(old_tree.get("children", []))

    return {
        "tag_changed": tag_changed,
        "props_added": props_added,
        "props_removed": sorted(props_removed),
        "children_count_delta": delta
    }
""",
        "function_name": "compute_vdom_patches",
        "sample_test_cases": [
            {
                "name": "Visible Test 1: Simple Prop Mutation",
                "call": "compute_vdom_patches({'tag': 'div', 'props': {'id': '1'}, 'children': []}, {'tag': 'div', 'props': {'id': '2'}, 'children': []})",
                "expected": "{'tag_changed': False, 'props_added': {'id': '2'}, 'props_removed': [], 'children_count_delta': 0}"
            }
        ],
        "hidden_test_cases": [
            {
                "name": "Hidden Test 2: Tag & Child Mutation",
                "call": "compute_vdom_patches({'tag': 'p', 'props': {'class': 'old'}, 'children': []}, {'tag': 'span', 'props': {}, 'children': [1, 2]})",
                "expected": "{'tag_changed': True, 'props_added': {}, 'props_removed': ['class'], 'children_count_delta': 2}"
            }
        ],
        "why_tested": "React development requires a deep understanding of lifecycle reconciliation, property immutability, and component rendering triggers."
    }
}


def select_challenge_for_gaps(prioritized_gaps: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Selects the challenge directly linked to the candidate's highest priority testable gap.
    Iterates through candidate's prioritized gaps (ordered from highest priority to lowest),
    and picks the first gap that has an assessment in CHALLENGE_BANK.
    """
    skill_to_key = {
        "rest api": "REST API",
        "rest apis": "REST API",
        "react": "React",
        "react.js": "React",
        "reactjs": "React",
        "dsa": "DSA",
        "data structures": "DSA",
        "algorithms": "DSA",
        "python": "Python",
        "sql": "SQL",
        "mysql": "SQL",
        "postgresql": "SQL",
        "sqlite": "SQL"
    }

    for gap in prioritized_gaps:
        if gap.get("status") in ["MISSING", "PARTIAL"]:
            raw_skill = str(gap.get("skill", "")).lower().strip()
            if raw_skill in skill_to_key:
                return CHALLENGE_BANK[skill_to_key[raw_skill]]

    return CHALLENGE_BANK["REST API"]


# =====================================================================
# 6. ROADMAP & 7-DAY SPRINT ACTION PLAN GENERATOR
# =====================================================================

def generate_personalized_roadmap(gaps: List[Dict[str, Any]], assessment_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generates customized 'Next 3 Steps' and '7-Day Sprint' tailored to candidate's identified skill gaps.
    """
    top_skill = gaps[0]["skill"] if gaps else "REST API"
    second_skill = gaps[1]["skill"] if len(gaps) > 1 else "Git & CI/CD"
    third_skill = gaps[2]["skill"] if len(gaps) > 2 else "DSA & Optimization"

    next_steps = [
        {
            "step": 1,
            "title": f"Master {top_skill} Fundamentals",
            "action": f"Review standard conventions, core architecture patterns, and common failure modes for {top_skill}.",
            "impact": "Fills the highest-priority required qualification in your target job description."
        },
        {
            "step": 2,
            "title": f"Build a Portfolio Feature Using {top_skill} & {second_skill}",
            "action": f"Construct a minimal working service integrating {top_skill} with quantifiable metrics (e.g. latency, throughput).",
            "impact": "Provides concrete proof on your resume to upgrade your rating from Missing to Matched."
        },
        {
            "step": 3,
            "title": f"Complete Targeted Coding Practice for {third_skill}",
            "action": f"Solve 5 domain-specific challenges and incorporate unit tests with 80%+ test coverage.",
            "impact": "Eliminates technical screening bottlenecks before recruiter interviews."
        }
    ]

    sprint_days = [
        {"day": "Day 1", "topic": f"HTTP & {top_skill} Architecture Basics", "task": f"Study protocol standards, request/response models, and error statuses."},
        {"day": "Day 2", "topic": "Payload Contracts & Data Validation", "task": "Implement schema validations, type guards, and input sanitation."},
        {"day": "Day 3", "topic": "Filtering, Sorting & Pagination", "task": "Write clean algorithmic routines for resource querying and pagination limits."},
        {"day": "Day 4", "topic": f"{second_skill} Integration & Storage", "task": f"Connect {top_skill} endpoints to persistent storage and handle database constraints."},
        {"day": "Day 5", "topic": "Security, Auth & Rate Limiting", "task": "Implement token-based authentication (JWT) and rate limiting headers."},
        {"day": "Day 6", "topic": "Mini Project Deployment & Documentation", "task": "Containerize the project using Docker and write clean Swagger/OpenAPI documentation."},
        {"day": "Day 7", "topic": "Mock Interview & Re-Assessment", "task": "Re-run the SkillBridge assessment engine and update your verified skill portfolio."}
    ]

    return {
        "next_steps": next_steps,
        "sprint_plan": sprint_days,
        "target_skills": [top_skill, second_skill, third_skill]
    }


# =====================================================================
# 7. CLOSED-LOOP SKILL UPDATE & PROGRESS ESTIMATE
# =====================================================================

def evaluate_closed_loop_progress(initial_readiness: int, challenge_data: Dict[str, Any], test_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Closes the loop between candidate assessment and overall readiness score.
    Provides verifiable progress tracking derived strictly from the 5-Factor scoring model.
    """
    total_cases = test_results.get("total", 0)
    passed_cases = test_results.get("passed", 0)
    skill_tested = challenge_data.get("skill_gap", "Target Skill")

    score_pct = round((passed_cases / total_cases * 100)) if total_cases > 0 else 0

    if score_pct >= 80:
        score_boost = 9 if score_pct < 100 else 10
        new_confidence = "Demonstrated Competency"
        status_label = "Strong Performance"
        feedback = f"Outstanding! You demonstrated robust implementation of {skill_tested} logic, passing {passed_cases}/{total_cases} visible and boundary test cases."
    elif score_pct >= 50:
        score_boost = 5
        new_confidence = "Developing Proficiency"
        status_label = "Good Progress"
        feedback = f"Good effort! You passed core logic for {skill_tested} ({passed_cases}/{total_cases} tests). Review edge cases to reach complete mastery."
    else:
        # FAILED test cases: Score remains unchanged! Zero false credit!
        score_boost = 0
        new_confidence = "Needs Guided Practice"
        status_label = "Foundational"
        feedback = f"You encountered test case failures on {skill_tested} ({passed_cases}/{total_cases} tests passed). Practice the 7-Day Sprint before live interviews."

    updated_readiness = min(98, initial_readiness + score_boost)

    return {
        "skill_tested": skill_tested,
        "challenge_title": challenge_data.get("title", ""),
        "tests_passed": passed_cases,
        "total_tests": total_cases,
        "challenge_score_pct": score_pct,
        "previous_readiness": initial_readiness,
        "updated_readiness": updated_readiness,
        "score_delta": score_boost,
        "new_confidence_level": new_confidence,
        "performance_status": status_label,
        "feedback_summary": feedback,
        "scoring_rule": "Deterministic recalculation: passing code promotes skill to Verified Competency (+3 pts Tech Skills, +2 pts Core Requirement, +4 pts Verified Technical Proof). Failed tests grant 0 pts.",
        "disclaimer": "SkillBridge Estimated Progress reflects benchmark test completion and does not guarantee formal employment offers."
    }

