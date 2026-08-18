
import re
def get_section(text, start_heading, end_headings):
    pattern = rf"{start_heading}(.*?)(?:{'|'.join(end_headings)}|$)"

    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)

    if not match:
        return ""

    return match.group(1).strip()

from skills import SKILLS

def extract_email(text):
    email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    match = re.search(email_pattern, text)

    return match.group() if match else None


def extract_phone(text):
    phone_pattern = r'(\+91[\-\s]?)?[6-9]\d{9}'

    match = re.search(phone_pattern, text)

    return match.group() if match else None
import re

def extract_name(text):
    lines = text.split("\n")

    for line in lines:
        line = line.strip()

        if not line:
            continue

        # Remove leading numbers like 2022
        line = re.sub(r'^\d+', '', line).strip()

        # Ignore headings
        ignore = [
            "PROFESSIONAL SUMMARY",
            "TECHNICAL SKILLS",
            "KEY PROJECTS",
            "EDUCATION",
            "CERTIFICATIONS",
            "PERSONAL ATTRIBUTES"
        ]

        if line.upper() in ignore:
            continue

        # Check if line looks like a name
        if re.fullmatch(r"[A-Za-z ]{5,40}", line):
            return line.title()

    return None 
def extract_skills(text):
    found_skills = []

    text_lower = text.lower()

    for skill in SKILLS:
        if skill.lower() in text_lower:
            found_skills.append(skill)

    # Standardize similar skills
    skill_mapping = {
        "HTML": "HTML5",
        "CSS": "CSS3",
        "REST APIs": "REST API"
    }

    cleaned_skills = []

    for skill in found_skills:
        skill = skill_mapping.get(skill, skill)

        if skill not in cleaned_skills:
            cleaned_skills.append(skill)

    return sorted(cleaned_skills)
def extract_education(text):
    education = []

    # EDUCATION section se text nikaalo
    pattern = r'EDUCATION(.*?)(CERTIFICATIONS|PERSONAL ATTRIBUTES|KEY PROJECTS|$)'

    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)

    if not match:
        return education

    education_text = match.group(1)

    lines = education_text.split("\n")

    keywords = [
        "Bachelor",
        "B.Tech",
        "B.E",
        "M.Tech",
        "BCA",
        "MCA",
        "University",
        "Institute",
        "College",
        "School",
        "Class XII",
        "Class X",
        "AKTU"
    ]

    for line in lines:
        line = line.strip()

        if not line:
            continue

        for keyword in keywords:
            if keyword.lower() in line.lower():
                education.append(line)
                break

    return list(dict.fromkeys(education))
import re

def extract_projects(text):
    projects = []

    # KEY PROJECTS section nikaalo
    pattern = r'KEY PROJECTS(.*?)(EDUCATION|CERTIFICATIONS|PERSONAL ATTRIBUTES|$)'

    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)

    if not match:
        return projects

    project_text = match.group(1)

    lines = [line.strip() for line in project_text.split("\n") if line.strip()]

    i = 0

    while i < len(lines):

        # Technology line detect karo
        if "|" in lines[i]:

            technologies = [tech.strip() for tech in lines[i].split("|")]

            if i > 0:

                title = lines[i-1]

                projects.append({
                    "title": title,
                    "technologies": technologies
                })

        i += 1

    return projects

def extract_certifications(text):

    section = get_section(
        text,
        r"CERTIFICATIONS\s*&?\s*TRAINING",
        [
            r"PERSONAL ATTRIBUTES",
            r"LANGUAGES",
            r"ACHIEVEMENTS",
            r"INTERESTS"
        ]
    )

    if not section:
        return []

    certifications = []

    lines = [line.strip() for line in section.split("\n") if line.strip()]

    for line in lines:

        # Heading skip
        if line.upper().startswith("CERTIFICATION"):
            continue

        # Random bullets skip
        if line in ["•", "-", "|"]:
            continue

        # Extra text skip
        if "participant" in line.lower():
            continue

        if len(line) < 8:
            continue

        certifications.append(line)

    return certifications

def extract_experience(text):
    experience = []

    # Resume text ko lines me divide karo
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # Actual experience section ke headings
    start_headings = [
        "PROFESSIONAL EXPERIENCE",
        "WORK EXPERIENCE",
        "EMPLOYMENT EXPERIENCE",
        "WORK HISTORY",
        "EMPLOYMENT HISTORY"
    ]

    # Experience ke baad aane wale sections
    end_headings = [
        "TECHNICAL SKILLS",
        "SKILLS",
        "KEY PROJECTS",
        "PROJECTS",
        "EDUCATION",
        "CERTIFICATIONS",
        "CERTIFICATIONS & TRAINING",
        "PERSONAL ATTRIBUTES",
        "PERSONAL ATTRIBUTES & LANGUAGES",
        "LANGUAGES",
        "ACHIEVEMENTS",
        "INTERNSHIPS",
        "INTERESTS"
    ]

    start_index = None

    # Exact heading search karo
    for i, line in enumerate(lines):
        normalized = line.upper().strip()

        if normalized in start_headings:
            start_index = i + 1
            break

    # Agar actual Experience heading nahi mila
    if start_index is None:
        return []

    # Experience section ka content collect karo
    for line in lines[start_index:]:
        normalized = line.upper().strip()

        # Next section mil gaya
        if normalized in end_headings:
            break

        # Empty / useless lines skip
        if len(line) < 3:
            continue

        experience.append({
            "details": line
        })

    return experience