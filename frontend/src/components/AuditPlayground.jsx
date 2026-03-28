import { useState } from "react";
import { Download, ShieldAlert, Sparkles } from "lucide-react";

import { bulkAudit, exportPdf, generateRedTeam, runAudit } from "../api";
import SafetyRadar from "./SafetyRadar";

export default function AuditPlayground({ onAuditDone, settings }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [redTeamPrompts, setRedTeamPrompts] = useState([]);
  const [bulkSummary, setBulkSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const piiFindings = Array.isArray(result?.pii_findings) ? result.pii_findings : [];
  const visiblePiiFindings = settings?.strictPII ? piiFindings : piiFindings.slice(0, 1);

  const handleAudit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await runAudit(input, "manual");
      setResult(data);
      setBulkSummary(null);
      onAuditDone?.();
    } catch (auditError) {
      setError(auditError?.response?.data?.detail || auditError?.message || "Audit failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedTeam = async () => {
    if (!input.trim()) return;
    setError("");
    try {
      const prompts = await generateRedTeam(input);
      setRedTeamPrompts(prompts);
    } catch (redTeamError) {
      setError(redTeamError?.response?.data?.detail || redTeamError?.message || "Red-team generation failed.");
    }
  };

  const handleDownload = async () => {
    if (!input.trim()) return;
    setError("");
    try {
      const blob = await exportPdf(input);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compliance-certificate.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError?.response?.data?.detail || downloadError?.message || "PDF export failed.");
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const data = await bulkAudit(file);
      setBulkSummary(data);
    } catch (bulkError) {
      setError(bulkError?.response?.data?.detail || bulkError?.message || "Bulk audit failed.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
        <h2 className="text-lg font-semibold mb-3">Audit Playground</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={12}
          placeholder="Paste prompt or LLM output to audit..."
          className="w-full rounded-xl bg-black/30 border border-white/10 p-3 resize-none outline-none focus:border-electric"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAudit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-electric text-black font-semibold hover:opacity-90"
          >
            {loading ? "Auditing..." : "Run Audit"}
          </button>
          <button
            type="button"
            onClick={handleRedTeam}
            className="px-4 py-2 rounded-lg bg-violet/80 text-white font-semibold flex items-center gap-2"
          >
            <Sparkles size={16} />
            Auto-Generate Attack Prompts
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 flex items-center gap-2"
          >
            <Download size={16} />
            Download Certificate
          </button>
          <label className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 cursor-pointer">
            Bulk CSV Audit
            <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {redTeamPrompts.length > 0 && (
          <div className="mt-5">
            <h3 className="font-medium mb-2">Generated Attack Prompts</h3>
            <ul className="space-y-2 text-sm text-slate-200">
              {redTeamPrompts.map((p) => (
                <li key={p} className="rounded-lg bg-black/20 border border-white/10 p-2">{p}</li>
              ))}
            </ul>
          </div>
        )}

        {bulkSummary && (
          <div className="mt-5 text-sm rounded-lg border border-white/10 bg-black/20 p-3">
            Bulk audit completed: {bulkSummary.count} prompts analyzed.
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5">
          <h2 className="text-lg font-semibold mb-3">Auditor Report</h2>
          {!result && <p className="text-slate-300">Run an audit to see results.</p>}
          {result && (
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Bias" value={result.bias} />
              <Metric label="Toxicity" value={result.toxicity} />
              <Metric label="Safety" value={result.safety} />
            </div>
          )}

          {result?.flags?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-300" />
                Flags
              </h3>
              <ul className="space-y-2 text-sm">
                {result.flags.map((f) => (
                  <li key={f} className="rounded-lg bg-red-500/10 border border-red-300/20 p-2">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">PII Findings</h3>
              {visiblePiiFindings.length === 0 ? (
                <p className="text-sm text-slate-400">No PII patterns detected.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {visiblePiiFindings.map((item) => (
                    <li
                      key={`${item.type}-${item.value}`}
                      className="rounded-lg bg-black/20 border border-white/10 p-2"
                    >
                      <span className="font-medium">{item.type}</span>: {item.value}
                    </li>
                  ))}
                </ul>
              )}
              {!settings?.strictPII && piiFindings.length > visiblePiiFindings.length && (
                <p className="mt-2 text-xs text-slate-400">
                  Strict PII mode is off, so only the first finding is shown here.
                </p>
              )}
            </div>
          )}
        </div>
        <SafetyRadar result={result} />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase text-slate-300">{label}</p>
      <p className="text-xl font-semibold">{Number(value || 0).toFixed(1)}</p>
    </div>
  );
}
