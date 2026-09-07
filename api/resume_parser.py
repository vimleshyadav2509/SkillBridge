import re
from skills import SKILLS

def get_section(text, start_patterns, end_patterns):
    """
    Helper function to extract text belonging to a section between start_patterns and end_patterns.
    """
    if not text:
        return ""

    start_regex = r"(?:" + "|".join(start_patterns) + r")"
    end_regex = r"(?:" + "|".join(end_patterns) + r"|$)"

    pattern = rf"{start_regex}\s*[:\-\n]?(.*?)(?={end_regex})"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)

    return match.group(1).strip() if match else ""


def extract_email(text):
    if not text:
        return None
    email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    match = re.search(email_pattern, text)
    if match:
        email = match.group().strip()
        # Clean trailing periods or commas
        return email.rstrip(".,;")
    return None


def extract_phone(text):
    if not text:
        return None
    # Matches formats: +91 9876543210, +91-98765-43210, (123) 456-7890, 9876543210, 123-456-7890
    phone_patterns = [
        r"(?:\+?\d{1,3}[\s\-]?)?\(?\d{3,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}",
        r"(\+91[\-\s]?)?[6-9]\d{9}"
    ]
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            phone_str = match.group().strip()
            # Verify it contains at least 10 digits
            digits = re.sub(r"\D", "", phone_str)
            if 10 <= len(digits) <= 13:
                return phone_str
    return None


def extract_name(text):
    if not text:
        return None
    lines = text.split("\n")

    ignore_words = {
        "PROFESSIONAL SUMMARY", "SUMMARY", "OBJECTIVE",
        "TECHNICAL SKILLS", "SKILLS", "KEY PROJECTS", "PROJECTS",
        "EDUCATION", "CERTIFICATIONS", "EXPERIENCE", "WORK EXPERIENCE",
        "PERSONAL ATTRIBUTES", "CURRICULUM VITAE", "RESUME", "PROFILE",
        "CONTACT", "ADDRESS", "LINKEDIN", "GITHUB"
    }

    for line in lines[:10]: # Look near the top of the resume
        line_clean = line.strip()

        if not line_clean:
            continue

        # Skip email/phone/url lines
        if "@" in line_clean or "http" in line_clean or "github" in line_clean.lower() or "linkedin" in line_clean.lower():
            continue

        # Skip numbers
        if re.search(r"\d{5,}", line_clean):
            continue

        # Remove leading bullets or labels
        line_clean = re.sub(r"^[•\-\*\d\.\s]+", "", line_clean).strip()

        if line_clean.upper() in ignore_words:
            continue

        # Check if line looks like a person's name (2-4 words, alphabet only)
        if re.fullmatch(r"[A-Za-z\.\s]{3,40}", line_clean):
            words = line_clean.split()
            if 1 <= len(words) <= 4:
                return line_clean.title()

    return None


def is_skill_in_text(skill, text):
    """
    Check if a skill exists in text using word boundaries.
    Prevents false positives like matching 'C' inside 'Class' or 'Java' in 'JavaScript'.
    """
    skill_str = skill.strip()
    if not skill_str or not text:
        return False

    # Standardize skill matching regex
    skill_escaped = re.escape(skill_str)
    pattern = r"(?<![a-zA-Z0-9+#.#])" + skill_escaped + r"(?![a-zA-Z0-9+#.#])"
    return bool(re.search(pattern, text, re.IGNORECASE))


def extract_skills(text):
    if not text:
        return []

    found_skills = []

    for skill in SKILLS:
        if is_skill_in_text(skill, text):
            found_skills.append(skill)

    # Standardize skill variations
    skill_mapping = {
        "HTML": "HTML5",
        "CSS": "CSS3",
        "REST APIs": "REST API",
        "React.js": "React",
        "Vue.js": "Vue",
        "Express.js": "Express",
        "Postgres": "PostgreSQL",
        "Tailwind": "Tailwind CSS"
    }

    cleaned_skills = []
    for skill in found_skills:
        mapped = skill_mapping.get(skill, skill)
        if mapped not in cleaned_skills:
            cleaned_skills.append(mapped)

    return sorted(cleaned_skills)


def extract_education(text):
    if not text:
        return []

    section_text = get_section(
        text,
        [r"EDUCATION", r"ACADEMIC QUALIFICATIONS", r"QUALIFICATIONS", r"ACADEMIC BACKGROUND"],
        [r"EXPERIENCE", r"WORK EXPERIENCE", r"PROFESSIONAL EXPERIENCE", r"KEY PROJECTS", r"PROJECTS", r"SKILLS", r"TECHNICAL SKILLS", r"CERTIFICATIONS", r"PERSONAL ATTRIBUTES"]
    )

    if not section_text:
        # Fallback to scanning full text for education keywords
        section_text = text

    lines = section_text.split("\n")
    education = []

    keywords = [
        "Bachelor", "B.Tech", "BTech", "B.E", "B.Sc", "BSc",
        "Master", "M.Tech", "MTech", "M.Sc", "MSc", "M.E",
        "BCA", "MCA", "MBA", "Ph.D", "PhD", "Diploma",
        "University", "Institute", "College", "School",
        "Class XII", "Class X", "High School", "Higher Secondary"
    ]

    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 4:
            continue

        # Skip headers
        if line_clean.upper() in ["EDUCATION", "ACADEMIC QUALIFICATIONS", "QUALIFICATIONS"]:
            continue

        for keyword in keywords:
            if re.search(r"\b" + re.escape(keyword) + r"\b", line_clean, re.IGNORECASE):
                education.append(line_clean)
                break

    return list(dict.fromkeys(education))


def extract_projects(text):
    if not text:
        return []

    section_text = get_section(
        text,
        [r"KEY PROJECTS", r"PROJECTS", r"ACADEMIC PROJECTS", r"PERSONAL PROJECTS"],
        [r"EDUCATION", r"EXPERIENCE", r"WORK EXPERIENCE", r"CERTIFICATIONS", r"SKILLS", r"TECHNICAL SKILLS", r"PERSONAL ATTRIBUTES"]
    )

    if not section_text:
        return []

    lines = [line.strip() for line in section_text.split("\n") if line.strip()]
    projects = []
    current_title = ""
    current_techs = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Check for technology line with pipe | or comma/colon separators
        if "|" in line:
            parts = [p.strip() for p in line.split("|")]
            techs = parts
            title = lines[i - 1] if i > 0 else "Project"
            projects.append({
                "title": title,
                "technologies": techs
            })
        elif "technologies:" in line.lower() or "tech stack:" in line.lower() or "tools used:" in line.lower():
            tech_part = line.split(":", 1)[-1]
            techs = [t.strip() for t in re.split(r"[,|•]", tech_part) if t.strip()]
            title = lines[i - 1] if i > 0 else "Project"
            projects.append({
                "title": title,
                "technologies": techs
            })
        i += 1

    # Fallback if no specific tech separator line found
    if not projects and lines:
        # Group non-empty lines into project entries
        for j in range(0, min(len(lines), 6), 2):
            if j < len(lines):
                title = lines[j]
                desc = lines[j + 1] if (j + 1) < len(lines) else ""
                techs = [t for t in SKILLS if is_skill_in_text(t, title + " " + desc)]
                projects.append({
                    "title": title,
                    "technologies": techs
                })

    return projects


def extract_certifications(text):
    if not text:
        return []

    section_text = get_section(
        text,
        [r"CERTIFICATIONS", r"CERTIFICATION", r"CERTIFICATIONS\s*&?\s*TRAINING", r"COURSES"],
        [r"PERSONAL ATTRIBUTES", r"LANGUAGES", r"ACHIEVEMENTS", r"INTERESTS", r"SKILLS", r"EXPERIENCE"]
    )

    if not section_text:
        return []

    certifications = []
    lines = [line.strip() for line in section_text.split("\n") if line.strip()]

    for line in lines:
        if line.upper().startswith("CERTIFICATION") or line.upper().startswith("COURSES"):
            continue
        if line in ["•", "-", "|", "*"]:
            continue
        if "participant" in line.lower() or len(line) < 5:
            continue
        certifications.append(line)

    return list(dict.fromkeys(certifications))


def extract_experience(text):
    if not text:
        return []

    section_text = get_section(
        text,
        [r"PROFESSIONAL EXPERIENCE", r"WORK EXPERIENCE", r"EMPLOYMENT EXPERIENCE", r"WORK HISTORY", r"EXPERIENCE", r"INTERNSHIPS"],
        [r"TECHNICAL SKILLS", r"SKILLS", r"KEY PROJECTS", r"PROJECTS", r"EDUCATION", r"CERTIFICATIONS", r"PERSONAL ATTRIBUTES", r"ACHIEVEMENTS"]
    )

    if not section_text:
        return []

    lines = [line.strip() for line in section_text.split("\n") if line.strip()]
    experience_list = []

    for line in lines:
        line_clean = re.sub(r"^[•\-\*\d\.\s]+", "", line).strip()
        if len(line_clean) < 4:
            continue
        if line_clean.upper() in ["PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY", "EXPERIENCE", "INTERNSHIPS"]:
            continue
        experience_list.append(line_clean)

    return experience_list