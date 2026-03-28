import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export default function SafetyRadar({ result }) {
  const data = [
    { metric: "Safety", score: result?.safety ?? 0 },
    { metric: "Bias", score: result?.bias ?? 0 },
    { metric: "Toxicity", score: result?.toxicity ?? 0 },
    { metric: "PII Risk", score: Math.min(100, (result?.pii_findings?.length || 0) * 25) },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-4 h-72">
      <h3 className="font-medium mb-3">Safety Radar</h3>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis dataKey="metric" stroke="#dbe7ff" />
          <Radar
            dataKey="score"
            stroke="#56ccf2"
            fill="#8b7dff"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
