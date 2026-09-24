const TREND_STYLE = {
  증가: { icon: "📈", color: "#b91c1c", bg: "#fef2f2" },
  감소: { icon: "📉", color: "#15803d", bg: "#f0fdf4" },
  유지: { icon: "➖", color: "#666", bg: "#f5f5f5" },
};

export default function AIRecommendCard({ rec }) {
  const style = TREND_STYLE[rec.trend] ?? TREND_STYLE.유지;

  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{rec.category}</span>
        <span style={{
          fontSize: 10, padding: "2px 8px",
          background: style.color, color: "#fff", borderRadius: 4,
        }}>
          {style.icon} {rec.trend}
        </span>
      </div>

      <p style={{ fontSize: 12, color: "#555", margin: "0 0 6px", lineHeight: 1.5 }}>
        {rec.situation}
      </p>

      <div style={{ background: style.bg, borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
        <p style={{ fontSize: 11, color: style.color, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
          💡 {rec.insight}
        </p>
      </div>

      <p style={{ fontSize: 12, color: "#111", margin: "0 0 10px", lineHeight: 1.5, fontWeight: 500 }}>
        ✅ {rec.action}
      </p>

      <div style={{ display: "flex", gap: 16, paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#16a34a", margin: 0 }}>
            -{rec.expected_saving_krw?.toLocaleString()}원
          </p>
          <p style={{ fontSize: 10, color: "#aaa", margin: 0 }}>예상 절약</p>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: style.color, margin: 0 }}>
            -{rec.expected_saving_kg}kg
          </p>
          <p style={{ fontSize: 10, color: "#aaa", margin: 0 }}>CO₂ 절감</p>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>
            {rec.expected_reduction_pct}%
          </p>
          <p style={{ fontSize: 10, color: "#aaa", margin: 0 }}>감축률</p>
        </div>
      </div>
    </div>
  );
}