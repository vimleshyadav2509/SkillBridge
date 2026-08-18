def calculate_ats_score(data):
    """
    Professional ATS Resume Scoring Engine

    Maximum Score = 100

    Breakdown:
    - Contact Information : 15
    - Professional Summary : 10
    - Technical Skills : 20
    - Education : 15
    - Projects : 15
    - Certifications : 5
    - Experience : 10
    - Resume Content : 10
    """

    suggestions = []
    breakdown = {}

    # ---------------------------------------------------------
    # SAFE DATA EXTRACTION
    # ---------------------------------------------------------

    text = str(data.get("extracted_text", "") or "")
    text_lower = text.lower()

    name = str(data.get("name", "") or "").strip()
    email = str(data.get("email", "") or "").strip()
    phone = str(data.get("phone", "") or "").strip()

    skills = data.get("skills", []) or []
    education = data.get("education", []) or []
    projects = data.get("projects", []) or []
    certifications = data.get("certifications", []) or []
    experience = data.get("experience", []) or []

    # Make sure lists contain usable values
    skills = [str(x).strip() for x in skills if str(x).strip()]
    education = [str(x).strip() for x in education if str(x).strip()]
    projects = [x for x in projects if x]
    certifications = [str(x).strip() for x in certifications if str(x).strip()]
    experience = [x for x in experience if x]

    # =========================================================
    # 1. CONTACT INFORMATION - 15
    # =========================================================

    contact_score = 0

    if name:
        contact_score += 5
    else:
        suggestions.append("Add your full name.")

    if email:
        contact_score += 5
    else:
        suggestions.append("Add a professional email address.")

    if phone:
        contact_score += 5
    else:
        suggestions.append("Add your phone number.")

    breakdown["contact_information"] = contact_score

    # =========================================================
    # 2. PROFESSIONAL SUMMARY - 10
    # =========================================================

    summary_score = 0

    summary_keywords = [
        "professional summary",
        "career objective",
        "objective",
        "profile summary",
        "summary"
    ]

    has_summary = any(
        keyword in text_lower
        for keyword in summary_keywords
    )

    if has_summary:
        summary_score += 6

        # Try to identify whether the summary has useful content
        summary_quality_keywords = [
            "experience",
            "skills",
            "developer",
            "engineer",
            "student",
            "software",
            "python",
            "java",
            "technology",
            "career",
            "professional"
        ]

        quality_matches = sum(
            1
            for keyword in summary_quality_keywords
            if keyword in text_lower
        )

        if quality_matches >= 4:
            summary_score += 4
        elif quality_matches >= 2:
            summary_score += 2

    else:
        suggestions.append(
            "Add a professional summary describing your profile, "
            "technical strengths, and career goals."
        )

    summary_score = min(summary_score, 10)

    breakdown["professional_summary"] = summary_score

    # =========================================================
    # 3. TECHNICAL SKILLS - 20
    # =========================================================

    skill_count = len(set(
        skill.lower()
        for skill in skills
        if skill
    ))

    if skill_count >= 15:
        skills_score = 20
    elif skill_count >= 12:
        skills_score = 18
    elif skill_count >= 10:
        skills_score = 16
    elif skill_count >= 7:
        skills_score = 13
    elif skill_count >= 5:
        skills_score = 10
    elif skill_count > 0:
        skills_score = 5
    else:
        skills_score = 0

    if skill_count < 10:
        suggestions.append(
            "Add more relevant technical skills to improve ATS keyword coverage."
        )

    breakdown["technical_skills"] = skills_score

    # =========================================================
    # 4. EDUCATION - 15
    # =========================================================

    education_score = 0

    if len(education) >= 4:
        education_score = 15
    elif len(education) >= 3:
        education_score = 14
    elif len(education) >= 2:
        education_score = 12
    elif len(education) == 1:
        education_score = 8
        suggestions.append(
            "Add complete education details such as degree, institution, "
            "and graduation year."
        )
    else:
        education_score = 0
        suggestions.append(
            "Add your education details."
        )

    breakdown["education"] = education_score

    # =========================================================
    # 5. PROJECTS - 15
    # =========================================================

    project_count = len(projects)

    if project_count >= 3:
        projects_score = 15
    elif project_count == 2:
        projects_score = 13
    elif project_count == 1:
        projects_score = 8
        suggestions.append(
            "Consider adding another relevant technical project."
        )
    else:
        projects_score = 0
        suggestions.append(
            "Add at least one relevant technical project."
        )

    # Check whether project information contains technologies
    project_technology_found = False

    for project in projects:
        if isinstance(project, dict):
            technologies = project.get("technologies", [])

            if technologies:
                project_technology_found = True
                break

    if project_count > 0 and not project_technology_found:
        suggestions.append(
            "Include technologies used in each project."
        )

    breakdown["projects"] = projects_score

    # =========================================================
    # 6. CERTIFICATIONS - 5
    # =========================================================

    certification_count = len(certifications)

    if certification_count >= 2:
        certification_score = 5
    elif certification_count == 1:
        certification_score = 3
    else:
        certification_score = 0
        suggestions.append(
            "Consider adding relevant certifications, courses, "
            "or technical training."
        )

    breakdown["certifications"] = certification_score

    # =========================================================
    # 7. EXPERIENCE - 10
    # =========================================================

    experience_score = 0

    is_student_or_fresher = any(
        keyword in text_lower
        for keyword in [
            "student",
            "fresher",
            "undergraduate",
            "b.tech",
            "btech",
            "college student"
        ]
    )

    if len(experience) >= 2:
        experience_score = 10

    elif len(experience) == 1:
        experience_score = 6

    else:
        # Important:
        # Don't heavily penalize students/freshers.
        if is_student_or_fresher:
            experience_score = 5

            suggestions.append(
                "If applicable, add internships, practical training, "
                "freelance work, or relevant industry experience."
            )
        else:
            experience_score = 0

            suggestions.append(
                "Add relevant internship or professional experience if available."
            )

    breakdown["experience"] = experience_score

    # =========================================================
    # 8. RESUME CONTENT - 10
    # =========================================================

    text_length = len(text.strip())

    if text_length >= 3000:
        content_score = 10

    elif text_length >= 2500:
        content_score = 9

    elif text_length >= 1800:
        content_score = 8

    elif text_length >= 1200:
        content_score = 6

    elif text_length >= 800:
        content_score = 4

    elif text_length > 0:
        content_score = 2

    else:
        content_score = 0

        suggestions.append(
            "Resume content could not be extracted. "
            "Make sure the uploaded PDF contains selectable text."
        )

    if text_length < 1200 and text_length > 0:
        suggestions.append(
            "Add more relevant achievements, responsibilities, "
            "project details, and measurable results."
        )

    breakdown["resume_content"] = content_score

    # =========================================================
    # FINAL SCORE
    # =========================================================

    score = sum(breakdown.values())

    score = max(0, min(score, 100))

    # =========================================================
    # REMOVE DUPLICATE SUGGESTIONS
    # =========================================================

    unique_suggestions = []

    for suggestion in suggestions:
        if suggestion not in unique_suggestions:
            unique_suggestions.append(suggestion)

    suggestions = unique_suggestions

    # =========================================================
    # OVERALL ATS MESSAGE
    # =========================================================

    if score >= 90:
        overall_message = (
            "Excellent ATS compatibility. Your resume has a strong "
            "structure and keyword coverage."
        )

    elif score >= 80:
        overall_message = (
            "Good ATS compatibility. A few improvements can make "
            "your resume stronger."
        )

    elif score >= 70:
        overall_message = (
            "Fair ATS compatibility. Several sections can be improved "
            "to increase your resume's effectiveness."
        )

    elif score >= 60:
        overall_message = (
            "Your resume has a basic foundation, but important ATS "
            "areas need improvement."
        )

    else:
        overall_message = (
            "Your resume needs significant improvement in several "
            "important ATS areas."
        )

    # Put overall message first
    suggestions.insert(0, overall_message)

    # =========================================================
    # FINAL RESPONSE
    # =========================================================

    return {
        "ats_score": score,
        "score_breakdown": breakdown,
        "suggestions": suggestions
    }