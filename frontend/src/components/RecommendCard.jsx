import { useState } from "react";
import { recommendAPI } from "../api/client";

const PRIORITY_STYLE = {
  high:   { bg: "#fef2f2", color: "#b91c1c", label: "높음" },
  medium: { bg: "#fffbeb", color: "#b45309", label: "보통" },
  low:    { bg: "#f0fdf4", color: "#15803d", label: "낮음" },
};

export default function RecommendCard({ rec, year, month }) {
  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(false);
  const style = PRIORITY_STYLE[rec.priority] ?? PRIORITY_STYLE.low;

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await recommendAPI.simulate(rec.category, year, month);
      setSim(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: style.bg, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: style.color }}>{rec.action}</span>
            <span style={{
              fontSize: 10, padding: "1px 6px",
              background: style.color, color: "#fff", borderRadius: 4,
            }}>
              {style.label}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{rec.alternative}</p>
          <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>{rec.tip}</p>

          {sim && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff", borderRadius: 8 }}>
              <p style={{ fontSize: 12, margin: 0 }}>
                현재 <strong>{sim.current_carbon_kg} kg</strong> →
                절감 후 <strong style={{ color: "#16a34a" }}>{sim.remaining_kg} kg</strong>
                <span style={{ color: "#888", marginLeft: 4 }}>({sim.saving_percent}% 절감)</span>
              </p>
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", marginLeft: 12, flexShrink: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: style.color, margin: 0 }}>
            -{rec.saving_kg} kg
          </p>
          <p style={{ fontSize: 10, color: "#aaa", margin: "2px 0 8px" }}>절감 가능</p>
          <button onClick={handleSimulate} disabled={loading}
            style={{
              fontSize: 11, padding: "4px 10px",
              border: `1px solid ${style.color}`, borderRadius: 6,
              background: "#fff", color: style.color, cursor: "pointer",
            }}
          >
            {loading ? "계산 중..." : "시뮬레이션"}
          </button>
        </div>
      </div>
    </div>
  );
}