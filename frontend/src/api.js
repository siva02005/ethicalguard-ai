import axios from "axios";

const resolvedBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const AUTH_STORAGE_KEY = "ethicalguard-auth-token";

const api = axios.create({
  baseURL: resolvedBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (token) {
    config.headers["X-Auth-Token"] = token;
  }
  return config;
});

export function getStoredToken() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export async function register(username, password) {
  const { data } = await api.post("/api/auth/register", { username, password });
  return data;
}

export async function login(username, password) {
  const { data } = await api.post("/api/auth/login", { username, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get("/api/me");
  return data;
}

export async function runAudit(text, tag = null) {
  const { data } = await api.post("/api/audit", { text, tag });
  return data;
}

export async function getHistory() {
  const { data } = await api.get("/api/history?limit=30");
  return data;
}

export async function getSettings() {
  const { data } = await api.get("/api/settings");
  return data;
}

export async function updateSettings(settings) {
  const { data } = await api.put("/api/settings", settings);
  return data;
}

export async function getProfile() {
  const { data } = await api.get("/api/profile");
  return data;
}

export async function updateProfile(profile) {
  const { data } = await api.put("/api/profile", profile);
  return data;
}

export async function createResumeReview(payload) {
  const { data } = await api.post("/api/resume-review", payload);
  return data;
}

export async function createResumeReviewFromImage(file, targetRole = "") {
  const formData = new FormData();
  formData.append("file", file);
  const query = targetRole ? `?target_role=${encodeURIComponent(targetRole)}` : "";
  const { data } = await api.post(`/api/resume-review-image${query}`, formData);
  return data;
}

export async function getResumeReviews() {
  const { data } = await api.get("/api/resume-reviews?limit=10");
  return data;
}

export async function generateRedTeam(text) {
  const { data } = await api.post("/api/redteam", { text });
  return data.prompts;
}

export async function exportPdf(text) {
  const response = await api.post(
    "/api/export-pdf",
    { text },
    { responseType: "blob" }
  );
  return response.data;
}

export async function bulkAudit(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/api/bulk-audit", formData);
  return data;
}
