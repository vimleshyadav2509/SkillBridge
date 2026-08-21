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
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import PyPDF2
import io

# Initialize the FastAPI App
app = FastAPI(title="ResumeIQ API", version="1.0")

# Enable CORS for cross-origin requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Model for the analyze endpoint
class ResumeData(BaseModel):
    text: str = ""

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to ResumeIQ API",
        "version": "1.0"
    }

@app.post("/upload-resume")
@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Uploads a PDF resume and extracts structured ATS data from it.
    """
    
    # Flexible PDF format validation
    is_pdf_mime = file.content_type in [
        "application/pdf",
        "application/x-pdf",
        "application/acrobat",
        "applications/vnd.pdf",
        "text/pdf",
        "application/octet-stream"
    ]
    has_pdf_extension = file.filename and file.filename.lower().endswith(".pdf")

    if not (is_pdf_mime or has_pdf_extension):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a valid PDF document (.pdf)."
        )

    try:
        # Read the file contents into memory
        contents = await file.read()

        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # Parse the PDF using PyPDF2
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        extracted_text = ""

        # Loop through all pages and extract text
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        extracted_text = extracted_text.strip()

        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from this PDF. Please ensure the PDF contains selectable text (not scanned images)."
            )

        # Extract structured details
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
            "extracted_text": extracted_text
        }

        ats = calculate_ats_score(resume_data)

        return {
            "message": "Resume uploaded and parsed successfully!",
            "filename": file.filename,
            **resume_data,
            **ats
        }    
    except HTTPException:
        raise
    except Exception as e:
        # Catch any unexpected errors during PDF parsing
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/analyze")
@app.post("/api/analyze")
async def analyze_resume(resume: ResumeData):
    """
    Takes the extracted text from the resume and generates an ATS score.
    """
    
    if not resume.text or not resume.text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty!")

    resume_data = {
        "extracted_text": resume.text,
        "skills": extract_skills(resume.text),
        "education": extract_education(resume.text),
        "projects": extract_projects(resume.text),
        "certifications": extract_certifications(resume.text),
        "experience": extract_experience(resume.text),
        "name": extract_name(resume.text),
        "email": extract_email(resume.text),
        "phone": extract_phone(resume.text)
    }

    ats = calculate_ats_score(resume_data)

    return {
        "message": "Analysis completed successfully",
        **resume_data,
        **ats
    }

@app.get("/history")
@app.get("/api/history")
def get_history():
    """
    Placeholder endpoint for future database integration.
    """
    return {"history": []}

# ==============================
# JOB MATCH REQUEST MODEL
# ==============================

class JobMatchRequest(BaseModel):
    resume_text: str = ""
    job_description: str = ""


# ==============================
# JOB DESCRIPTION MATCHER
# ==============================

@app.post("/match-job")
@app.post("/api/match-job")
async def match_job(request: JobMatchRequest):

    if not request.resume_text or not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text is required. Please upload and analyze your resume first."
        )

    if not request.job_description or not request.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description is required. Please paste the job requirements."
        )

    try:
        result = match_job_description(
            request.resume_text,
            request.job_description
        )

        return {
            "message": "Job matching completed successfully!",
            "result": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Job matching failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
