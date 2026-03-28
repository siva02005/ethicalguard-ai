from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    auth_token = Column(String(128), unique=True, nullable=True, index=True)
    preferences = Column(
        JSON,
        nullable=False,
        default=lambda: {
            "autoRefresh": True,
            "notifyOnHighRisk": True,
            "strictPII": True,
        },
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    full_name = Column(String(128), nullable=True)
    years_experience = Column(Float, nullable=False, default=0)
    education_level = Column(String(64), nullable=True)
    preferred_domain = Column(String(128), nullable=True)
    career_goal = Column(Text, nullable=True)
    strengths = Column(JSON, nullable=False, default=list)
    preferred_work_style = Column(String(64), nullable=True)
    location = Column(String(128), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    input_text = Column(Text, nullable=False)
    bias_score = Column(Float, nullable=False)
    toxicity_score = Column(Float, nullable=False)
    safety_score = Column(Float, nullable=False)
    pii_findings = Column(JSON, nullable=False, default=list)
    red_team_prompts = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    tag = Column(String(64), nullable=True)


class ResumeReview(Base):
    __tablename__ = "resume_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_text = Column(Text, nullable=False)
    target_role = Column(String(128), nullable=True)
    skill_score = Column(Float, nullable=False)
    structure_score = Column(Float, nullable=False)
    impact_score = Column(Float, nullable=False)
    ats_score = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=False)
    summary = Column(Text, nullable=False)
    ai_suggestions = Column(JSON, nullable=False, default=list)
    hr_expectations = Column(JSON, nullable=False, default=list)
    recommended_roles = Column(JSON, nullable=False, default=list)
    profile_snapshot = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
