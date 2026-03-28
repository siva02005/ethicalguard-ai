import { useEffect, useState } from "react";
import { Briefcase, FileImage, FileText, ScanSearch, Sparkles, UserRound } from "lucide-react";

import {
  createResumeReview,
  createResumeReviewFromImage,
  getProfile,
  getResumeReviews,
  updateProfile,
} from "../api";

const emptyProfile = {
  full_name: "",
  years_experience: 0,
  education_level: "",
  preferred_domain: "",
  career_goal: "",
  strengths: [],
  preferred_work_style: "",
  location: "",
};

export default function ResumeStudio() {
  const [profile, setProfile] = useState(emptyProfile);
  const [resumeText, setResumeText] = useState("");
  const [resumeImage, setResumeImage] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [review, setReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState("");

  const loadResumeData = async () => {
    try {
      const [profileData, reviewData] = await Promise.all([getProfile(), getResumeReviews()]);
      setProfile({
        full_name: profileData.full_name || "",
        years_experience: profileData.years_experience || 0,
        education_level: profileData.education_level || "",
        preferred_domain: profileData.preferred_domain || "",
        career_goal: profileData.career_goal || "",
        strengths: Array.isArray(profileData.strengths) ? profileData.strengths : [],
        preferred_work_style: profileData.preferred_work_style || "",
        location: profileData.location || "",
      });
      setReviews(reviewData);
    } catch (loadError) {
      setError(loadError?.response?.data?.detail || loadError?.message || "Failed to load resume workspace.");
    }
  };

  useEffect(() => {
    loadResumeData();
  }, []);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setError("");
    try {
      const payload = {
        ...profile,
        years_experience: Number(profile.years_experience || 0),
        strengths:
          typeof profile.strengths === "string"
            ? profile.strengths.split(",").map((item) => item.trim()).filter(Boolean)
            : profile.strengths,
      };
      const saved = await updateProfile(payload);
      setProfile({
        ...saved,
        strengths: Array.isArray(saved.strengths) ? saved.strengths : [],
      });
    } catch (saveError) {
      setError(saveError?.response?.data?.detail || saveError?.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReview = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await createResumeReview({
        resume_text: resumeText,
        target_role: targetRole || null,
      });
      setReview(result);
      await loadResumeData();
    } catch (reviewError) {
      setError(reviewError?.response?.data?.detail || reviewError?.message || "Resume review failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageReview = async () => {
    if (!resumeImage) return;
    setLoading(true);
    setError("");
    try {
      const result = await createResumeReviewFromImage(resumeImage, targetRole);
      setReview(result);
      setResumeText(result.scanned_resume_text || "");
      await loadResumeData();
    } catch (reviewError) {
      setError(reviewError?.response?.data?.detail || reviewError?.message || "Image resume review failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
        <h2 className="text-2xl font-semibold">Resume AI Studio</h2>
        <p className="mt-2 text-slate-400">
          Paste your resume, save your profile data, and get AI review, HR expectations, and the kind of roles that fit you best.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-5">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserRound size={18} className="text-electric" />
              <h3 className="font-semibold">Candidate Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Full Name" value={profile.full_name} onChange={(value) => setProfile((current) => ({ ...current, full_name: value }))} />
              <Input label="Years Experience" type="number" value={profile.years_experience} onChange={(value) => setProfile((current) => ({ ...current, years_experience: value }))} />
              <Input label="Education" value={profile.education_level} onChange={(value) => setProfile((current) => ({ ...current, education_level: value }))} />
              <Input label="Preferred Domain" value={profile.preferred_domain} onChange={(value) => setProfile((current) => ({ ...current, preferred_domain: value }))} />
              <Input label="Work Style" value={profile.preferred_work_style} onChange={(value) => setProfile((current) => ({ ...current, preferred_work_style: value }))} />
              <Input label="Location" value={profile.location} onChange={(value) => setProfile((current) => ({ ...current, location: value }))} />
            </div>
            <TextArea label="Career Goal" value={profile.career_goal} onChange={(value) => setProfile((current) => ({ ...current, career_goal: value }))} rows={3} />
            <TextArea
              label="Strengths (comma separated)"
              value={Array.isArray(profile.strengths) ? profile.strengths.join(", ") : profile.strengths}
              onChange={(value) => setProfile((current) => ({ ...current, strengths: value }))}
              rows={2}
            />
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="mt-4 rounded-xl bg-electric text-black font-semibold px-4 py-3 hover:opacity-90"
            >
              {savingProfile ? "Saving..." : "Save Profile Data"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-electric" />
              <h3 className="font-semibold">Resume Review</h3>
            </div>
            <Input label="Target Role" value={targetRole} onChange={setTargetRole} placeholder="Example: Frontend Developer" />
            <label className="block mt-3">
              <span className="block text-sm text-slate-300 mb-2">Upload Resume Image</span>
              <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
                  <FileImage size={16} className="text-electric" />
                  Upload PNG, JPG, JPEG, or WEBP resume screenshot/photo
                </div>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={(event) => setResumeImage(event.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-300"
                />
                {resumeImage && (
                  <p className="mt-2 text-xs text-slate-400">Selected: {resumeImage.name}</p>
                )}
              </div>
            </label>
            <button
              type="button"
              onClick={handleImageReview}
              disabled={loading || !resumeImage}
              className="mt-4 rounded-xl bg-white/10 border border-white/15 text-white font-semibold px-4 py-3 hover:bg-white/15 inline-flex items-center gap-2"
            >
              <ScanSearch size={16} />
              {loading ? "Scanning..." : "Scan Resume Image"}
            </button>
            <TextArea
              label="Paste Resume"
              value={resumeText}
              onChange={setResumeText}
              rows={14}
              placeholder="Paste the full resume text here..."
            />
            <button
              type="button"
              onClick={handleReview}
              disabled={loading}
              className="mt-4 rounded-xl bg-electric text-black font-semibold px-4 py-3 hover:opacity-90"
            >
              {loading ? "Reviewing..." : "Review Resume with AI"}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-electric" />
              <h3 className="font-semibold">AI Resume Review</h3>
            </div>
            {!review && <p className="text-slate-400">Submit a resume to get review insights, HR expectations, and job fit guidance.</p>}
            {review && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ScoreCard label="Overall" value={review.overall_score} />
                  <ScoreCard label="Skills" value={review.skill_score} />
                  <ScoreCard label="Structure" value={review.structure_score} />
                  <ScoreCard label="ATS" value={review.ats_score} />
                </div>
                <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                  <p className="text-sm text-slate-400">Review Summary</p>
                  <p className="mt-2">{review.summary}</p>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                  <p className="text-sm text-slate-400">Recruiter Verdict</p>
                  <p className="mt-2">{review.recruiter_verdict}</p>
                </div>
                <PanelList title="Strengths Found In Resume" items={review.extracted_strengths} />
                <PanelList title="Missing Resume Sections" items={review.missing_sections} />
                <PanelList title="AI Suggestions" items={review.ai_suggestions} />
                <PanelList title="What HR Will Expect" items={review.hr_expectations} />
                <PanelList title="Recommended Work / Roles" items={review.recommended_roles} icon={<Briefcase size={16} className="text-electric" />} />
                <div className="rounded-xl bg-cyan-400/10 border border-cyan-300/20 p-4">
                  <p className="text-sm text-cyan-100">{review.profile_summary}</p>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                  <p className="text-sm text-slate-400">Scanned Resume Text</p>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{review.scanned_resume_text}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
            <h3 className="font-semibold mb-4">Recent Resume Reviews</h3>
            <div className="space-y-3">
              {reviews.length === 0 && <p className="text-slate-400 text-sm">No resume reviews saved yet.</p>}
              {reviews.map((item) => (
                <div key={item.id} className="rounded-xl bg-black/20 border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.target_role || "General Resume Review"}</p>
                    <span className="text-sm text-slate-400">{item.overall_score.toFixed(1)}/100</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Input({ label, onChange, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-300 mb-2">{label}</span>
      <input
        {...props}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none focus:border-electric"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4, placeholder = "" }) {
  return (
    <label className="block mt-3">
      <span className="block text-sm text-slate-300 mb-2">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none resize-none focus:border-electric"
      />
    </label>
  );
}

function ScoreCard({ label, value }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/10 p-3">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{Number(value || 0).toFixed(1)}</p>
    </div>
  );
}

function PanelList({ title, items, icon = null }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-medium">{title}</h4>
      </div>
      <ul className="space-y-2 text-sm text-slate-200">
        {items.map((item) => (
          <li key={item} className="rounded-lg border border-white/10 bg-black/20 p-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
