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
from pydantic import BaseModel
import PyPDF2
import io

# Initialize the FastAPI App
app = FastAPI(title="ResumeIQ API", version="1.0")

# Request Model for the analyze endpoint
class ResumeData(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Welcome to ResumeIQ API"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Uploads a PDF resume and extracts the text from it.
    The 'UploadFile = File(...)' part fixes the Swagger UI parameter error.
    """
    
    # Verify that the uploaded file is a PDF
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed!")

    try:
        # Read the file contents into memory
        contents = await file.read()

        # Parse the PDF using PyPDF2
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        extracted_text = ""

        # Loop through all pages and extract text
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        # after building extracted_text
        extracted_text = extracted_text.strip()
        email = extract_email(extracted_text)
        phone = extract_phone(extracted_text)
        name = extract_name(extracted_text)
        skills = extract_skills(extracted_text)
        education = extract_education(extracted_text)
        projects = extract_projects(extracted_text)
        certifications = extract_certifications(extracted_text)
        experience = extract_experience(extracted_text) 
        print(certifications)


        resume_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": education,
        "projects": projects,
        "certifications": certifications,
        "experience": experience,
        "extracted_text": extracted_text.strip()
         }
        ats = calculate_ats_score(resume_data)
        return {
        "message": "Resume uploaded and parsed successfully!",
        "filename": file.filename,
        **resume_data,
        **ats
        }    
    except Exception as e:
        # Catch any errors during the PDF reading process
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {str(e)}")

@app.post("/analyze")
async def analyze_resume(resume: ResumeData):
    """
    Takes the extracted text from the resume and generates an ATS score.
    """
    
    if not resume.text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty!")

    text_lower = resume.text.lower()

    # Dummy logic: Increase score if certain keywords are found
    # You can replace this with your actual AI or ATS logic later
    score = 50
    if "python" in text_lower or "fastapi" in text_lower:
        score += 30

    return {
        "message": "Analysis completed successfully",
        "ats_score": score,
        "suggestions": [
            "Use strong action verbs (e.g., Developed, Managed).",
            "Include keywords from the specific job description.",
            "Ensure the formatting is clean and easy to read."
        ]
    }

@app.get("/history")
def get_history():
    """
    Placeholder endpoint for future database integration.
    """
    return {"history": []}
# ==============================
# JOB MATCH REQUEST MODEL
# ==============================

class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str


# ==============================
# JOB DESCRIPTION MATCHER
# ==============================

@app.post("/match-job")
async def match_job(request: JobMatchRequest):

    if not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text is required."
        )

    if not request.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description is required."
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