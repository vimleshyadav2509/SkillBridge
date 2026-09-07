from job_matcher import match_job_description
from ats_score import calculate_ats_score
from resume_parser import (
    extract_email,
    extract_phone,
    extract_name,
    extract_skills,
    extract_education,
    extract_projects,
    extract_certifications,
    extract_experience  
)
from skillbridge_engine import (
    match_skills_and_analyze_gaps,
    select_challenge_for_gaps,
    generate_personalized_roadmap,
    evaluate_closed_loop_progress,
    CHALLENGE_BANK,
    normalize_skill_name
)
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import PyPDF2
import io

# Initialize FastAPI App
app = FastAPI(
    title="SkillBridge Engine API",
    description="Employability Gap Analyzer & Custom Coding Assessment Engine [CC-GFG-12]",
    version="2.0.0"
)

# Enable CORS for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# REQUEST & RESPONSE MODELS
# =====================================================================

class ResumeData(BaseModel):
    text: str = ""

class JobMatchRequest(BaseModel):
    resume_text: str = ""
    job_description: str = ""

class GapAnalysisRequest(BaseModel):
    resume_text: str = ""
    job_description: str = ""
    job_role: Optional[str] = "Software Developer"
    resume_structured: Optional[Dict[str, Any]] = None

class ChallengeRequest(BaseModel):
    skill: Optional[str] = "REST API"

class AssessmentEvaluationRequest(BaseModel):
    initial_readiness: int
    challenge_data: Dict[str, Any]
    test_results: Dict[str, Any]


# =====================================================================
# OFFICIAL CC-GFG-12 DEMO DATA
# =====================================================================

OFFICIAL_DEMO_DATA = {
    "candidate_name": "Rohan Sharma",
    "resume_text": """ROHAN SHARMA
Email: rohan.sharma.dev@example.com | Phone: +91 98765 43210
GitHub: github.com/rohansharma-dev | LinkedIn: linkedin.com/in/rohansharma-dev

PROFESSIONAL SUMMARY
Motivated Computer Science undergraduate with hands-on proficiency in Python, SQL, and web foundations. Built practical academic data management tools and simple web applications. Eager to contribute as a Software Developer Intern.

TECHNICAL SKILLS
Languages: Python, SQL, JavaScript (Basics), HTML5, CSS3
Databases: MySQL, SQLite
Core Concepts: Object Oriented Programming (OOP), DBMS, Basic Data Structures

KEY PROJECTS
Student Records Portal | Python | SQLite | HTML5 | CSS3
• Implemented relational schema managing 1,200+ student grade entries with CRUD operations.
• Designed clean responsive user interface with vanilla HTML and CSS.

Inventory Stock Tracker | Python | MySQL
• Created CLI database management system tracking product stock levels and supplier info.
• Applied SQL aggregation queries to summarize inventory restocking schedules.

EDUCATION
B.Tech in Computer Science and Engineering - Apex Institute of Technology (2022 - 2026)
CGPA: 8.4 / 10.0

CERTIFICATIONS
• Python for Data Analysis (Coursera)
• SQL Fundamentals for Developers""",

    "job_description": """Position: Software Developer Intern (Backend & Full-Stack)
Company: Nexus Cloud Technologies
Location: Remote / Hybrid

ABOUT THE ROLE:
We are seeking an ambitious Software Developer Intern to join our engineering team. You will build and scale reliable backend microservices and modern user interfaces.

REQUIRED SKILLS & QUALIFICATIONS:
• Strong programming fundamentals in Python and modern JavaScript.
• Hands-on experience designing and integrating REST APIs (HTTP methods, status codes, query pagination).
• Working knowledge of React for frontend component integration.
• Proficiency with relational databases and writing clean SQL queries.
• Understanding of Core CS, DSA (Data Structures & Algorithms), and computational complexity.
• Experience using Git and GitHub for collaborative version control.

PREFERRED QUALIFICATIONS:
• Familiarity with Docker containerization or CI/CD pipelines.
• Exposure to FastAPI or Express backend frameworks.
• Excellent debugging and analytical problem-solving skills.""",

    "job_role": "Software Developer Intern"
}


# =====================================================================
# HEALTH & INFO ENDPOINTS
# =====================================================================

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "SkillBridge API",
        "version": "2.0.0",
        "tagline": "From Resume to Job-Ready.",
        "hackathon": "Career Catalyst Club × GeeksforGeeks [CC-GFG-12]"
    }

@app.get("/api/demo-data")
def get_demo_data():
    """Supplies the official hackathon 1-click demo scenario."""
    return OFFICIAL_DEMO_DATA


# =====================================================================
# RESUME PARSING (PYPDF2 + DETERMINISTIC EXTRACTION)
# =====================================================================

def parse_raw_resume_text(extracted_text: str, filename: str = "Uploaded Resume"):
    email = extract_email(extracted_text)
    phone = extract_phone(extracted_text)
    name = extract_name(extracted_text)
    skills = extract_skills(extracted_text)
    education = extract_education(extracted_text)
    projects = extract_projects(extracted_text)
    certifications = extract_certifications(extracted_text)
    experience = extract_experience(extracted_text) 

    resume_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": education,
        "projects": projects,
        "certifications": certifications,
        "experience": experience,
        "extracted_text": extracted_text,
        "filename": filename
    }
    ats = calculate_ats_score(resume_data)
    return {**resume_data, **ats}


@app.post("/upload-resume")
@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Uploads a PDF resume and extracts structured data."""
    is_pdf_mime = file.content_type in [
        "application/pdf", "application/x-pdf", "application/acrobat",
        "applications/vnd.pdf", "text/pdf", "application/octet-stream"
    ]
    has_pdf_extension = file.filename and file.filename.lower().endswith(".pdf")

    if not (is_pdf_mime or has_pdf_extension):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a valid PDF document (.pdf)."
        )

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        extracted_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        extracted_text = extracted_text.strip()
        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from this PDF. Please ensure selectable text is present."
            )

        parsed = parse_raw_resume_text(extracted_text, file.filename)
        return {
            "message": "Resume uploaded and parsed successfully!",
            **parsed
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.post("/analyze")
@app.post("/api/analyze")
async def analyze_resume(resume: ResumeData):
    """Parses raw text resume."""
    if not resume.text or not resume.text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty!")
    parsed = parse_raw_resume_text(resume.text.strip(), "Pasted Resume Text")
    return {
        "message": "Analysis completed successfully",
        **parsed
    }


# =====================================================================
# SKILLBRIDGE CORE GAP ANALYZER ENDPOINT
# =====================================================================

@app.post("/api/analyze-gap")
async def analyze_employability_gap(request: GapAnalysisRequest):
    """
    Core SkillBridge pipeline:
    Resume + JD -> Skill Normalization -> Gap Analysis -> Readiness Score -> Coding Challenge -> Roadmap
    """
    resume_text = request.resume_text.strip()
    jd_text = request.job_description.strip()

    if not resume_text:
        raise HTTPException(status_code=400, detail="Resume text is required.")
    if not jd_text:
        raise HTTPException(status_code=400, detail="Job description is required.")

    # Parse resume details if not provided
    if request.resume_structured:
        resume_data = request.resume_structured
    else:
        resume_data = parse_raw_resume_text(resume_text, "Candidate Resume")

    # Run SkillBridge matching and gap analysis
    gap_analysis = match_skills_and_analyze_gaps(resume_data, jd_text)

    # Select personalized challenge based on top prioritized gap
    personalized_challenge = select_challenge_for_gaps(gap_analysis["prioritized_gaps"])

    # Generate personalized 7-Day Sprint Roadmap
    roadmap = generate_personalized_roadmap(gap_analysis["prioritized_gaps"])

    return {
        "status": "success",
        "job_role": request.job_role,
        "resume_profile": {
            "name": resume_data.get("name"),
            "email": resume_data.get("email"),
            "phone": resume_data.get("phone"),
            "skills": resume_data.get("skills", []),
            "education": resume_data.get("education", []),
            "projects_count": len(resume_data.get("projects", [])),
            "ats_score": resume_data.get("ats_score", 0)
        },
        "gap_analysis": gap_analysis,
        "personalized_challenge": personalized_challenge,
        "roadmap": roadmap
    }


# =====================================================================
# CHALLENGE GENERATION & RETRIEVAL
# =====================================================================

@app.post("/api/generate-challenge")
async def generate_challenge(request: ChallengeRequest):
    """Returns a GFG-style coding challenge for a specific skill gap."""
    skill = normalize_skill_name(request.skill or "REST API")
    challenge = CHALLENGE_BANK.get(skill) or CHALLENGE_BANK.get("REST API")
    return {
        "status": "success",
        "challenge": challenge
    }


# =====================================================================
# CLOSED-LOOP ASSESSMENT EVALUATION
# =====================================================================

@app.post("/api/evaluate-assessment")
async def evaluate_assessment(request: AssessmentEvaluationRequest):
    """
    Evaluates assessment test run, updates readiness estimate, and produces actionable feedback.
    """
    progress = evaluate_closed_loop_progress(
        request.initial_readiness,
        request.challenge_data,
        request.test_results
    )
    return {
        "status": "success",
        "progress": progress
    }


# =====================================================================
# BACKWARD COMPATIBLE JOB MATCHING
# =====================================================================

@app.post("/match-job")
@app.post("/api/match-job")
async def match_job(request: JobMatchRequest):
    if not request.resume_text or not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required.")
    if not request.job_description or not request.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")

    result = match_job_description(request.resume_text, request.job_description)
    return {
        "message": "Job matching completed successfully!",
        "result": result
    }

@app.get("/history")
@app.get("/api/history")
def get_history():
    return {"history": []}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)