from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class AuditRequest(BaseModel):
    text: str = Field(..., min_length=1)
    tag: str | None = None


class PiiFinding(BaseModel):
    type: str
    value: str


class AuditResult(BaseModel):
    bias: float
    toxicity: float
    safety: float
    sentiment: float
    pii_findings: List[PiiFinding]
    flags: List[str]
    red_team_prompts: List[str]


class AuditRecordOut(BaseModel):
    id: int
    user_id: int
    input_text: str
    bias_score: float
    toxicity_score: float
    safety_score: float
    pii_findings: list
    red_team_prompts: list
    created_at: datetime
    tag: str | None = None

    class Config:
        from_attributes = True


class AuthRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6, max_length=128)


class AuthResponse(BaseModel):
    token: str
    username: str


class SettingsPayload(BaseModel):
    autoRefresh: bool = True
    notifyOnHighRisk: bool = True
    strictPII: bool = True


class UserProfile(BaseModel):
    id: int
    username: str
    preferences: SettingsPayload

    class Config:
        from_attributes = True


class CandidateProfilePayload(BaseModel):
    full_name: str | None = None
    years_experience: float = 0
    education_level: str | None = None
    preferred_domain: str | None = None
    career_goal: str | None = None
    strengths: List[str] = Field(default_factory=list)
    preferred_work_style: str | None = None
    location: str | None = None


class CandidateProfileOut(CandidateProfilePayload):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class ResumeReviewRequest(BaseModel):
    resume_text: str = Field(..., min_length=30)
    target_role: str | None = None


class ResumeReviewResult(BaseModel):
    skill_score: float
    structure_score: float
    impact_score: float
    ats_score: float
    overall_score: float
    summary: str
    ai_suggestions: List[str]
    hr_expectations: List[str]
    recommended_roles: List[str]
    profile_summary: str
    extracted_strengths: List[str] = Field(default_factory=list)
    missing_sections: List[str] = Field(default_factory=list)
    recruiter_verdict: str = ""
    scanned_resume_text: str = ""


class ResumeReviewRecordOut(ResumeReviewResult):
    id: int
    user_id: int
    resume_text: str
    target_role: str | None = None
    profile_snapshot: dict
    created_at: datetime

    class Config:
        from_attributes = True
