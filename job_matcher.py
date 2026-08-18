from skills import SKILLS
import re


def normalize_text(text: str) -> str:
    """
    Normalize text for reliable skill matching.

    Examples:
    REST API  -> rest api
    REST APIs -> rest api
    rest-api  -> rest api
    """

    if not text:
        return ""

    text = text.lower()

    # Normalize common plural forms
    text = re.sub(r"\bapis\b", "api", text)

    # Normalize RESTful API variations
    text = re.sub(r"\brestful\s+apis?\b", "rest api", text)

    # Replace hyphens/slashes with spaces
    text = re.sub(r"[-/]", " ", text)

    # Keep letters, numbers, +, # and spaces
    text = re.sub(r"[^a-z0-9+#.\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


def skill_exists(skill: str, text: str) -> bool:
    """
    Check whether a skill exists as a complete phrase.
    Prevents incorrect partial matches.
    """

    skill_normalized = normalize_text(skill)
    text_normalized = normalize_text(text)

    if not skill_normalized or not text_normalized:
        return False

    # Escape skill so special characters such as C++ work correctly
    pattern = r"(?<!\w)" + re.escape(skill_normalized) + r"(?!\w)"

    return re.search(pattern, text_normalized) is not None


def match_job_description(resume_text: str, job_description: str):
    """
    Compare resume skills with skills mentioned in a job description.
    """

    if not resume_text:
        return {
            "matched_keywords": [],
            "missing_keywords": [],
            "keyword_match_percentage": 0,
            "recommendations": [
                "Resume text is empty."
            ]
        }

    if not job_description:
        return {
            "matched_keywords": [],
            "missing_keywords": [],
            "keyword_match_percentage": 0,
            "recommendations": [
                "Job description is empty."
            ]
        }

    matched_keywords = []
    missing_keywords = []

    # Check every known skill
    for skill in SKILLS:

        # Is this skill required by the job?
        if skill_exists(skill, job_description):

            # Does the resume contain this skill?
            if skill_exists(skill, resume_text):
                matched_keywords.append(skill)
            else:
                missing_keywords.append(skill)

    # Remove duplicates
    matched_keywords = sorted(set(matched_keywords))
    missing_keywords = sorted(set(missing_keywords))

    # Calculate percentage
    total_keywords = len(matched_keywords) + len(missing_keywords)

    if total_keywords > 0:
        match_percentage = round(
            (len(matched_keywords) / total_keywords) * 100
        )
    else:
        match_percentage = 0

    # Generate recommendations
    recommendations = []

    if missing_keywords:
        recommendations.append(
            "Consider adding these missing skills to your resume: "
            + ", ".join(missing_keywords)
        )

    if match_percentage >= 90:
        recommendations.append(
            "Excellent match! Your resume strongly aligns with this job description."
        )

    elif match_percentage >= 70:
        recommendations.append(
            "Good match. Add the missing skills to improve your job compatibility."
        )

    elif match_percentage >= 50:
        recommendations.append(
            "Moderate match. Consider tailoring your resume to the job description."
        )

    else:
        recommendations.append(
            "Low match. Consider improving your skills and tailoring your resume "
            "to this job description."
        )

    return {
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "keyword_match_percentage": match_percentage,
        "recommendations": recommendations
    }