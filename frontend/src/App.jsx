import { useEffect, useState } from "react";
import { Bell, RefreshCcw, ShieldCheck } from "lucide-react";

import {
  getHistory,
  getMe,
  getSettings,
  getStoredToken,
  login,
  register,
  setStoredToken,
  updateSettings,
} from "./api";
import AuditPlayground from "./components/AuditPlayground";
import ResumeStudio from "./components/ResumeStudio";
import Sidebar from "./components/Sidebar";

const defaultSettings = {
  autoRefresh: true,
  notifyOnHighRisk: true,
  strictPII: true,
};

export default function App() {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [settings, setSettings] = useState(defaultSettings);
  const [historyError, setHistoryError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
      setHistoryError("");
    } catch (error) {
      setHistoryError(error?.response?.data?.detail || error?.message || "Failed to load audit history.");
    }
  };

  const bootstrapSession = async () => {
    try {
      const [profile, savedSettings] = await Promise.all([getMe(), getSettings()]);
      setUser(profile);
      setSettings(savedSettings);
      await loadHistory();
    } catch {
      setStoredToken("");
      setToken("");
      setUser(null);
      setHistory([]);
      setSettings(defaultSettings);
    } finally {
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    if (!token) {
      setAuthChecked(true);
      return;
    }
    bootstrapSession();
  }, [token]);

  const handleAuthSuccess = async (authData) => {
    setStoredToken(authData.token);
    setToken(authData.token);
  };

  const handleLogout = () => {
    setStoredToken("");
    setToken("");
    setUser(null);
    setHistory([]);
    setSettings(defaultSettings);
    setActiveView("dashboard");
    setHistoryError("");
    setAuthChecked(true);
  };

  const handleSettingsChange = async (updater) => {
    const nextSettings =
      typeof updater === "function" ? updater(settings) : updater;
    setSettings(nextSettings);
    try {
      await updateSettings(nextSettings);
    } catch (error) {
      setHistoryError(error?.response?.data?.detail || error?.message || "Failed to save settings.");
    }
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ink via-slate-900 to-[#111827] text-slate-100 grid place-items-center p-6">
        <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass px-6 py-5 text-sm text-slate-300">
          Preparing your secure workspace...
        </div>
      </main>
    );
  }

  if (!token || !user) {
    return <AuthScreen onLogin={handleAuthSuccess} onRegister={handleAuthSuccess} />;
  }

  return (
    <main className="min-h-screen text-slate-100 bg-gradient-to-br from-ink via-slate-900 to-[#111827] p-4 md:p-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <Sidebar
          activeView={activeView}
          onChangeView={setActiveView}
          username={user.username}
          onLogout={handleLogout}
        />

        <section className="space-y-6">
          {activeView === "dashboard" && (
            <DashboardView
              history={history}
              historyError={historyError}
              settings={settings}
              username={user.username}
              onAuditDone={settings.autoRefresh ? loadHistory : undefined}
              onOpenHistory={() => setActiveView("history")}
              onOpenSettings={() => setActiveView("settings")}
            />
          )}
          {activeView === "history" && (
            <HistoryView history={history} error={historyError} onRefresh={loadHistory} />
          )}
          {activeView === "resume" && <ResumeStudio />}
          {activeView === "settings" && (
            <SettingsView settings={settings} onChange={handleSettingsChange} />
          )}
        </section>
      </div>
    </main>
  );
}

function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const action = mode === "login" ? onLogin : onRegister;
      const request = mode === "login" ? login : register;
      const authData = await request(username.trim(), password);
      await action(authData);
    } catch (authError) {
      setError(authError?.response?.data?.detail || authError?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#133b4f_0%,#0f131c_50%,#0b0f16_100%)] text-slate-100 grid place-items-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="rounded-[28px] border border-cyan-300/10 bg-white/5 backdrop-blur-xl shadow-glass p-8 md:p-10">
          <p className="text-cyan-200 uppercase tracking-[0.3em] text-xs">EthicalGuard AI</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
            Secure audits for every LLM response your team ships.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300 text-lg">
            Sign in to review bias, toxicity, safety, and PII findings with user-level history stored in a dedicated database.
          </p>
          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-sm">
            <FeatureCard title="Private history" description="Each user gets separate audit records saved in the new database." />
            <FeatureCard title="Instant scoring" description="Bias, toxicity, sentiment, and PII checks run as soon as you audit." />
            <FeatureCard title="Share-ready" description="Use the dashboard locally or through the generated public tunnel." />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-panel/90 backdrop-blur-xl shadow-glass p-6">
          <div className="flex gap-2 rounded-full bg-black/20 p-1 mb-5">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-4 py-2 text-sm transition ${mode === "login" ? "bg-electric text-black font-semibold" : "text-slate-300"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-full px-4 py-2 text-sm transition ${mode === "register" ? "bg-electric text-black font-semibold" : "text-slate-300"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Username</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none focus:border-electric"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none focus:border-electric"
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-electric text-black font-semibold py-3 hover:opacity-90"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function DashboardView({ history, historyError, settings, username, onAuditDone, onOpenHistory, onOpenSettings }) {
  const latestHighRisk =
    settings.notifyOnHighRisk &&
    history.find((item) => item.safety_score < 70 || item.toxicity_score > 25 || item.bias_score > 30);

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
        <p className="text-sm text-slate-400">Signed in as</p>
        <h2 className="text-2xl font-semibold mt-1">{username}</h2>
      </div>
      {latestHighRisk && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          High-risk activity detected in recent history. Review the latest flagged audit from the History view.
        </div>
      )}
      {historyError && (
        <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">
          {historyError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={onOpenHistory}
          className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5 text-left hover:border-electric/30 transition"
        >
          <p className="text-sm text-slate-300">Audit Sessions</p>
          <p className="mt-2 text-3xl font-semibold">{history.length}</p>
          <p className="mt-2 text-sm text-slate-400">Open full history view</p>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5 text-left hover:border-electric/30 transition"
        >
          <p className="text-sm text-slate-300">Controls</p>
          <p className="mt-2 text-3xl font-semibold">3</p>
          <p className="mt-2 text-sm text-slate-400">Manage auditor behavior</p>
        </button>
        <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
          <p className="text-sm text-slate-300">Latest Safety Trend</p>
          <p className="mt-2 text-3xl font-semibold">
            {history[0] ? history[0].safety_score.toFixed(1) : "0.0"}
          </p>
          <p className="mt-2 text-sm text-slate-400">Based on the most recent audit</p>
        </div>
      </div>

      <AuditPlayground onAuditDone={onAuditDone} settings={settings} />
    </>
  );
}

function HistoryView({ history, error, onRefresh }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">History</h2>
          <p className="text-sm text-slate-400">Review previous audit results and recent risk patterns.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 flex items-center gap-2"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-300 border-b border-white/10">
              <th className="py-2 text-left">Time</th>
              <th className="py-2 text-left">Safety</th>
              <th className="py-2 text-left">Bias</th>
              <th className="py-2 text-left">Toxicity</th>
              <th className="py-2 text-left">PII Findings</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="border-b border-white/5">
                <td className="py-3">{new Date(item.created_at).toLocaleString()}</td>
                <td className="py-3">{item.safety_score.toFixed(1)}</td>
                <td className="py-3">{item.bias_score.toFixed(1)}</td>
                <td className="py-3">{item.toxicity_score.toFixed(1)}</td>
                <td className="py-3">{Array.isArray(item.pii_findings) ? item.pii_findings.length : 0}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td className="py-3 text-slate-400" colSpan={5}>
                  No audits yet for this account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsView({ settings, onChange }) {
  const toggle = (key) => {
    onChange((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-slate-400">
          These preferences are stored in the database for your account.
        </p>
      </div>
      <SettingCard
        icon={<RefreshCcw size={18} className="text-electric" />}
        title="Auto Refresh History"
        description="Reload the history panel after every successful audit."
        enabled={settings.autoRefresh}
        onToggle={() => toggle("autoRefresh")}
      />
      <SettingCard
        icon={<Bell size={18} className="text-electric" />}
        title="High Risk Alerts"
        description="Highlight potentially unsafe responses more aggressively in the dashboard."
        enabled={settings.notifyOnHighRisk}
        onToggle={() => toggle("notifyOnHighRisk")}
      />
      <SettingCard
        icon={<ShieldCheck size={18} className="text-electric" />}
        title="Strict PII Detection"
        description="Keep PII scans in stricter review mode for email, phone, and card patterns."
        enabled={settings.strictPII}
        onToggle={() => toggle("strictPII")}
      />
    </div>
  );
}

function SettingCard({ icon, title, description, enabled, onToggle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-14 h-8 rounded-full transition relative ${enabled ? "bg-electric/80" : "bg-white/15"}`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${enabled ? "left-7" : "left-1"}`}
        />
      </button>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-slate-400">{description}</p>
    </div>
  );
}
