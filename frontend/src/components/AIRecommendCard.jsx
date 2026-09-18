const TREND_STYLE = {
  증가: { icon: "📈", color: "#b91c1c", bg: "#fef2f2" },
  감소: { icon: "📉", color: "#15803d", bg: "#f0fdf4" },
  유지: { icon: "➖", color: "#666", bg: "#f5f5f5" },
};

export default function AIRecommendCard({ rec }) {
  const style = TREND_STYLE[rec.trend] ?? TREND_STYLE.유지;

  return (
    <div style={{ background: style.bg, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{rec.category}</span>
            <span style={{
              fontSize: 10, padding: "1px 6px",
              background: style.color, color: "#fff", borderRadius: 4,
            }}>
              {style.icon} {rec.trend}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#555", margin: 0, lineHeight: 1.5 }}>{rec.message}</p>
        </div>

        <div style={{ textAlign: "right", marginLeft: 12, flexShrink: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: style.color, margin: 0 }}>
            -{rec.expected_reduction_pct}%
          </p>
          <p style={{ fontSize: 10, color: "#aaa", margin: "2px 0 0" }}>예상 절감</p>
        </div>
      </div>
    </div>
  );
}