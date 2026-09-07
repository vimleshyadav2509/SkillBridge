from skills import SKILLS
import re


def normalize_text(text: str) -> str:
    """
    Normalize text for reliable skill matching.

    Handles:
    REST API  -> rest api
    REST APIs -> rest api
    RESTful API -> rest api
    rest-api -> rest api
    """

    if not text:
        return ""

    text = text.lower()

    # Normalize plural forms
    text = re.sub(r"\bapis\b", "api", text)

    # Normalize RESTful API variations
    text = re.sub(r"\brestful\s+apis?\b", "rest api", text)

    # Replace hyphens and slashes with spaces
    text = re.sub(r"[-/]", " ", text)

    # Keep letters, numbers, +, #, dots and spaces
    text = re.sub(r"[^a-z0-9+#.\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


def skill_exists(skill: str, text: str) -> bool:
    """
    Check whether a skill exists as a complete phrase.
    Prevents incorrect partial matches.

    Example:
    C should NOT match C++ or C#
    Java should NOT match JavaScript
    """

    skill_normalized = normalize_text(skill)
    text_normalized = normalize_text(text)

    if not skill_normalized or not text_normalized:
        return False

    pattern = r"(?<![a-z0-9+#.])" + re.escape(skill_normalized) + r"(?![a-z0-9+#.])"

    return re.search(pattern, text_normalized) is not None


def calculate_job_match_score(keyword_percentage: int) -> int:
    """
    Convert keyword matching percentage into an overall
    job match score.

    Currently the keyword match is the main measurable
    factor. This function is separated so more scoring
    factors can be added later without changing the API.
    """

    return max(0, min(100, keyword_percentage))


def generate_recommendations(
    match_percentage: int,
    missing_keywords: list
) -> list:
    """
    Generate useful recommendations based on job matching.
    """

    recommendations = []

    if missing_keywords:
        recommendations.append(
            "Consider adding these missing skills to your resume "
            "if you have practical experience: "
            + ", ".join(missing_keywords)
        )

    if match_percentage >= 90:
        recommendations.append(
            "Excellent match! Your resume strongly aligns with this job description."
        )

    elif match_percentage >= 75:
        recommendations.append(
            "Strong match. Tailor your resume to highlight the missing job-specific skills."
        )

    elif match_percentage >= 60:
        recommendations.append(
            "Good potential match. Improve keyword coverage and highlight relevant projects."
        )

    elif match_percentage >= 40:
        recommendations.append(
            "Moderate match. Consider tailoring your skills and projects to this job description."
        )

    else:
        recommendations.append(
            "Low match. Review the job requirements and strengthen your relevant skills and projects."
        )

    return recommendations


def match_job_description(
    resume_text: str,
    job_description: str
):
    """
    Compare resume skills against skills mentioned
    in a job description.

    Returns:
        matched_keywords
        missing_keywords
        keyword_match_percentage
        job_match_score
        recommendations
    """

    # -----------------------------
    # Validate resume
    # -----------------------------

    if not resume_text or not resume_text.strip():
        return {
            "matched_keywords": [],
            "missing_keywords": [],
            "keyword_match_percentage": 0,
            "job_match_score": 0,
            "recommendations": [
                "Resume text is empty."
            ]
        }

    # -----------------------------
    # Validate job description
    # -----------------------------

    if not job_description or not job_description.strip():
        return {
            "matched_keywords": [],
            "missing_keywords": [],
            "keyword_match_percentage": 0,
            "job_match_score": 0,
            "recommendations": [
                "Job description is empty."
            ]
        }

    matched_keywords = []
    missing_keywords = []

    # -----------------------------
    # Check every known skill
    # -----------------------------

    skill_mapping = {
        "HTML": "HTML5",
        "CSS": "CSS3",
        "REST APIs": "REST API",
        "React.js": "React",
        "Vue.js": "Vue",
        "Express.js": "Express",
        "Postgres": "PostgreSQL",
        "Tailwind": "Tailwind CSS",
        "Golang": "Go",
        "K8s": "Kubernetes"
    }

    for skill in SKILLS:
        canonical_skill = skill_mapping.get(skill, skill)

        # Is the skill mentioned in the job description?
        if skill_exists(skill, job_description) or skill_exists(canonical_skill, job_description):
            # Is the same skill present in the resume?
            if skill_exists(skill, resume_text) or skill_exists(canonical_skill, resume_text):
                matched_keywords.append(canonical_skill)
            else:
                missing_keywords.append(canonical_skill)

    # -----------------------------
    # Remove duplicates & clean missing list
    # -----------------------------

    matched_keywords = sorted(set(matched_keywords))
    # Remove any skill from missing if it's already in matched
    missing_keywords = sorted(set(s for s in missing_keywords if s not in matched_keywords))

    # -----------------------------
    # Calculate keyword percentage
    # -----------------------------

    total_keywords = (
        len(matched_keywords)
        + len(missing_keywords)
    )

    if total_keywords > 0:
        keyword_match_percentage = round(
            (len(matched_keywords) / total_keywords) * 100
        )
    else:
        keyword_match_percentage = 0

    # -----------------------------
    # Calculate overall score
    # -----------------------------

    job_match_score = calculate_job_match_score(
        keyword_match_percentage
    )

    # -----------------------------
    # Generate recommendations
    # -----------------------------

    recommendations = generate_recommendations(
        keyword_match_percentage,
        missing_keywords
    )

    # -----------------------------
    # Final result
    # -----------------------------

    return {
        "job_match_score": job_match_score,
        "keyword_match_percentage": keyword_match_percentage,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "recommendations": recommendations
    }