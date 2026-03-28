import re
from typing import Dict, List


ACTION_VERBS = {
    "built",
    "designed",
    "developed",
    "improved",
    "launched",
    "led",
    "optimized",
    "automated",
    "created",
    "delivered",
    "implemented",
    "managed",
    "owned",
    "scaled",
}

SKILL_KEYWORDS = {
    "frontend": ["react", "javascript", "typescript", "html", "css", "tailwind", "vite", "redux"],
    "backend": ["python", "fastapi", "django", "node", "express", "sql", "api", "postgresql"],
    "data": ["pandas", "numpy", "machine learning", "tensorflow", "pytorch", "analysis", "sql"],
    "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "devops"],
    "mobile": ["flutter", "react native", "android", "ios", "swift", "kotlin"],
}

SECTION_KEYWORDS = {
    "summary": ["summary", "profile", "objective"],
    "experience": ["experience", "work history", "employment"],
    "skills": ["skills", "technical skills", "toolkit"],
    "projects": ["projects", "project experience"],
    "education": ["education", "academic"],
}


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def _extract_sections(text: str) -> Dict[str, bool]:
    normalized = _normalize(text)
    return {
        section: any(keyword in normalized for keyword in keywords)
        for section, keywords in SECTION_KEYWORDS.items()
    }


def _count_action_bullets(text: str) -> int:
    lines = [line.strip(" -*\t").lower() for line in text.splitlines()]
    return sum(1 for line in lines if any(line.startswith(verb) for verb in ACTION_VERBS))


def _count_quantified_lines(text: str) -> int:
    return len(re.findall(r"\b\d+[%+]?\b", text))


def _detect_skill_matches(text: str) -> Dict[str, List[str]]:
    normalized = _normalize(text)
    matches: Dict[str, List[str]] = {}
    for area, keywords in SKILL_KEYWORDS.items():
        area_hits = [keyword for keyword in keywords if keyword in normalized]
        if area_hits:
            matches[area] = area_hits
    return matches


def _role_recommendations(profile: dict, skill_matches: Dict[str, List[str]]) -> List[str]:
    roles: List[str] = []
    preferred_domain = (profile.get("preferred_domain") or "").lower()
    work_style = (profile.get("preferred_work_style") or "").lower()

    if "frontend" in skill_matches or "ui" in preferred_domain:
        roles.append("Frontend Developer")
    if "backend" in skill_matches:
        roles.append("Backend Developer")
    if "data" in skill_matches or "analyst" in preferred_domain:
        roles.append("Data Analyst")
    if "cloud" in skill_matches or "devops" in preferred_domain:
        roles.append("Cloud / DevOps Engineer")
    if "mobile" in skill_matches:
        roles.append("Mobile App Developer")
    if "ai" in preferred_domain or "machine learning" in preferred_domain:
        roles.append("AI / ML Engineer")

    if work_style == "remote-first":
        roles.append("Remote Product Engineer")
    if work_style == "client-facing":
        roles.append("Solutions Engineer")

    if not roles:
        roles.extend(["Software Engineer", "Junior Developer"])

    deduped: List[str] = []
    for role in roles:
        if role not in deduped:
            deduped.append(role)
    return deduped[:4]


def review_resume(resume_text: str, profile: dict, target_role: str | None = None) -> dict:
    normalized = _normalize(resume_text)
    sections = _extract_sections(resume_text)
    skill_matches = _detect_skill_matches(resume_text)
    action_bullets = _count_action_bullets(resume_text)
    quantified_lines = _count_quantified_lines(resume_text)

    structure_score = min(100.0, 35 + (sum(sections.values()) * 13))
    skill_score = min(100.0, 25 + (sum(len(values) for values in skill_matches.values()) * 6))
    impact_score = min(100.0, 20 + (action_bullets * 10) + (quantified_lines * 6))
    ats_bonus = 10 if target_role and target_role.lower() in normalized else 0
    ats_score = min(100.0, 30 + (sum(sections.values()) * 8) + (len(skill_matches) * 10) + ats_bonus)
    overall_score = round((structure_score + skill_score + impact_score + ats_score) / 4, 2)

    missing_sections = [name for name, present in sections.items() if not present]
    ai_suggestions: List[str] = []
    if missing_sections:
        ai_suggestions.append(f"Add clearer resume sections for: {', '.join(missing_sections)}.")
    if action_bullets < 3:
        ai_suggestions.append("Rewrite experience bullets with action verbs like built, improved, or delivered.")
    if quantified_lines < 2:
        ai_suggestions.append("Add measurable impact such as percentages, counts, or time saved.")
    if target_role and target_role.lower() not in normalized:
        ai_suggestions.append(f"Tailor the resume summary and skills for the target role: {target_role}.")
    if not profile.get("career_goal"):
        ai_suggestions.append("Define a short career goal so recruiters can quickly understand your direction.")

    hr_expectations = [
        "HR expects a clear summary that explains your level, domain, and the kind of role you want.",
        "Recruiters usually look for measurable outcomes in projects or internships, not only task lists.",
        "They expect the skills section to match the role you are applying for and to be easy for ATS systems to parse.",
    ]
    if profile.get("years_experience", 0) < 1:
        hr_expectations.append("For fresher profiles, HR expects strong projects, internships, certifications, or hackathon proof.")
    else:
        hr_expectations.append("For experienced profiles, HR expects ownership, business impact, and progression across roles.")

    recommended_roles = _role_recommendations(profile, skill_matches)
    profile_bits = [
        profile.get("preferred_domain") or "general software",
        profile.get("preferred_work_style") or "flexible work",
        f"{profile.get('years_experience', 0)} years experience",
    ]
    profile_summary = (
        "Based on your profile, you appear best suited for "
        f"{', '.join(recommended_roles[:2])}. Preference signals: {', '.join(profile_bits)}."
    )

    summary = (
        f"This resume looks strongest in {', '.join(skill_matches.keys()) or 'general software skills'}, "
        f"with an overall readiness score of {overall_score}/100."
    )
    recruiter_verdict = (
        "Shortlist-ready for interviews with minor resume improvements."
        if overall_score >= 80
        else "Promising profile, but the resume needs stronger impact and sharper role alignment."
        if overall_score >= 65
        else "Needs major rewriting before it becomes recruiter-ready."
    )

    return {
        "skill_score": round(skill_score, 2),
        "structure_score": round(structure_score, 2),
        "impact_score": round(impact_score, 2),
        "ats_score": round(ats_score, 2),
        "overall_score": overall_score,
        "summary": summary,
        "ai_suggestions": ai_suggestions[:5],
        "hr_expectations": hr_expectations[:5],
        "recommended_roles": recommended_roles,
        "profile_summary": profile_summary,
        "extracted_strengths": sorted({keyword for values in skill_matches.values() for keyword in values})[:8],
        "missing_sections": [name.title() for name, present in sections.items() if not present],
        "recruiter_verdict": recruiter_verdict,
        "scanned_resume_text": resume_text,
    }
