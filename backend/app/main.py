from datetime import datetime
import hashlib
import secrets
from io import BytesIO
from typing import List

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .db import Base, engine, get_db, settings
from .models import AuditRecord, CandidateProfile, ResumeReview, User
from .schemas import (
    AuditRecordOut,
    AuditRequest,
    AuditResult,
    AuthRequest,
    AuthResponse,
    CandidateProfileOut,
    CandidateProfilePayload,
    ResumeReviewRecordOut,
    ResumeReviewRequest,
    ResumeReviewResult,
    SettingsPayload,
    UserProfile,
)
from .services.auditor import parse_csv_prompts, run_audit
from .services.ocr import extract_text_from_image_bytes
from .services.exporter import build_certificate
from .services.resume_reviewer import review_resume

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EthicalGuard AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _profile_to_dict(profile: CandidateProfile | None) -> dict:
    if not profile:
        return CandidateProfilePayload().model_dump()
    return {
        "full_name": profile.full_name,
        "years_experience": profile.years_experience,
        "education_level": profile.education_level,
        "preferred_domain": profile.preferred_domain,
        "career_goal": profile.career_goal,
        "strengths": profile.strengths or [],
        "preferred_work_style": profile.preferred_work_style,
        "location": profile.location,
    }


def _run_resume_review(resume_text: str, target_role: str | None, profile_data: dict) -> dict:
    result = review_resume(resume_text, profile_data, target_role)
    result["scanned_resume_text"] = resume_text
    return result


def get_current_user(
    x_auth_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not x_auth_token:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user = db.query(User).filter(User.auth_token == x_auth_token).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")
    return user


@app.post("/api/auth/register", response_model=AuthResponse)
def register(payload: AuthRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.username.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists.")

    token = secrets.token_urlsafe(32)
    user = User(
        username=payload.username.strip(),
        password_hash=_hash_password(payload.password),
        auth_token=token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": token, "username": user.username}


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if not user or user.password_hash != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    user.auth_token = secrets.token_urlsafe(32)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": user.auth_token, "username": user.username}


@app.get("/api/me", response_model=UserProfile)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/settings", response_model=SettingsPayload)
def get_settings(current_user: User = Depends(get_current_user)):
    return current_user.preferences


@app.put("/api/settings", response_model=SettingsPayload)
def update_settings(
    payload: SettingsPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.preferences = payload.model_dump()
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user.preferences


@app.get("/api/profile", response_model=CandidateProfileOut)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@app.put("/api/profile", response_model=CandidateProfileOut)
def update_profile(
    payload: CandidateProfilePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)

    for key, value in payload.model_dump().items():
        setattr(profile, key, value)

    profile.updated_at = datetime.utcnow()
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@app.post("/api/resume-review", response_model=ResumeReviewResult)
def create_resume_review(
    payload: ResumeReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    profile_data = _profile_to_dict(profile)
    result = _run_resume_review(payload.resume_text, payload.target_role, profile_data)
    record = ResumeReview(
        user_id=current_user.id,
        resume_text=payload.resume_text,
        target_role=payload.target_role,
        skill_score=result["skill_score"],
        structure_score=result["structure_score"],
        impact_score=result["impact_score"],
        ats_score=result["ats_score"],
        overall_score=result["overall_score"],
        summary=result["summary"],
        ai_suggestions=result["ai_suggestions"],
        hr_expectations=result["hr_expectations"],
        recommended_roles=result["recommended_roles"],
        profile_snapshot=profile_data,
    )
    db.add(record)
    db.commit()
    return result


@app.post("/api/resume-review-image", response_model=ResumeReviewResult)
async def create_resume_review_from_image(
    file: UploadFile = File(...),
    target_role: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        raise HTTPException(status_code=400, detail="Upload a PNG, JPG, JPEG, or WEBP resume image.")

    content = await file.read()
    extracted_text = extract_text_from_image_bytes(content)
    if len(extracted_text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Could not read enough text from the resume image.")

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    profile_data = _profile_to_dict(profile)
    result = _run_resume_review(extracted_text, target_role, profile_data)

    record = ResumeReview(
        user_id=current_user.id,
        resume_text=extracted_text,
        target_role=target_role,
        skill_score=result["skill_score"],
        structure_score=result["structure_score"],
        impact_score=result["impact_score"],
        ats_score=result["ats_score"],
        overall_score=result["overall_score"],
        summary=result["summary"],
        ai_suggestions=result["ai_suggestions"],
        hr_expectations=result["hr_expectations"],
        recommended_roles=result["recommended_roles"],
        profile_snapshot=profile_data,
    )
    db.add(record)
    db.commit()
    return result


@app.get("/api/resume-reviews", response_model=List[ResumeReviewRecordOut])
def get_resume_reviews(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(ResumeReview)
        .filter(ResumeReview.user_id == current_user.id)
        .order_by(ResumeReview.created_at.desc())
        .limit(min(50, max(1, limit)))
        .all()
    )
    return [
        {
            "id": item.id,
            "user_id": item.user_id,
            "resume_text": item.resume_text,
            "target_role": item.target_role,
            "skill_score": item.skill_score,
            "structure_score": item.structure_score,
            "impact_score": item.impact_score,
            "ats_score": item.ats_score,
            "overall_score": item.overall_score,
            "summary": item.summary,
            "ai_suggestions": item.ai_suggestions,
            "hr_expectations": item.hr_expectations,
            "recommended_roles": item.recommended_roles,
            "profile_summary": review_resume(item.resume_text, item.profile_snapshot, item.target_role)["profile_summary"],
            "extracted_strengths": review_resume(item.resume_text, item.profile_snapshot, item.target_role)["extracted_strengths"],
            "missing_sections": review_resume(item.resume_text, item.profile_snapshot, item.target_role)["missing_sections"],
            "recruiter_verdict": review_resume(item.resume_text, item.profile_snapshot, item.target_role)["recruiter_verdict"],
            "scanned_resume_text": item.resume_text,
            "profile_snapshot": item.profile_snapshot,
            "created_at": item.created_at,
        }
        for item in items
    ]


@app.post("/api/audit", response_model=AuditResult)
def audit(
    payload: AuditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = run_audit(payload.text)
    record = AuditRecord(
        user_id=current_user.id,
        input_text=payload.text,
        bias_score=result["bias"],
        toxicity_score=result["toxicity"],
        safety_score=result["safety"],
        pii_findings=result["pii_findings"],
        red_team_prompts=result["red_team_prompts"],
        tag=payload.tag,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return result


@app.get("/api/history", response_model=List[AuditRecordOut])
def history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(AuditRecord)
        .filter(AuditRecord.user_id == current_user.id)
        .order_by(AuditRecord.created_at.desc())
        .limit(min(200, max(1, limit)))
        .all()
    )
    return items


@app.post("/api/redteam")
def red_team(payload: AuditRequest, current_user: User = Depends(get_current_user)):
    report = run_audit(payload.text)
    return {"prompts": report["red_team_prompts"]}


@app.post("/api/bulk-audit")
async def bulk_audit(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    content = await file.read()
    prompts = parse_csv_prompts(content)
    if not prompts:
        raise HTTPException(status_code=400, detail="No prompts were found in the uploaded CSV.")
    results = [{"prompt": p, "result": run_audit(p)} for p in prompts]
    return {"count": len(results), "results": results}


@app.post("/api/export-pdf")
def export_pdf(payload: AuditRequest, current_user: User = Depends(get_current_user)):
    report = run_audit(payload.text)
    pdf = build_certificate(report)
    return StreamingResponse(
        BytesIO(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=compliance-certificate.pdf"},
    )
