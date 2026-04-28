import { useEffect, useState } from "react";
import { recommendAPI } from "../api/client";
import RecommendCard from "../components/RecommendCard";

export default function Recommendations() {
  const today = new Date();
  const [year] = useState(today.getFullYear());
  const [month] = useState(today.getMonth() + 1);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendAPI.list(year, month, 10)
      .then((r) => setRecommendations(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const totalSaving = recommendations.reduce((a, r) => a + r.saving_kg, 0).toFixed(1);
  const highCount = recommendations.filter(r => r.priority === "high").length;
  const medCount = recommendations.filter(r => r.priority === "medium").length;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
        <p style={{ color: "#888", fontSize: 14 }}>추천 데이터를 불러오는 중...</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>

      {/* 헤더 */}
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4, color: "#111" }}>친환경 절감 추천</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>
        이번 달 소비 패턴에서 탄소를 가장 많이 줄일 수 있는 행동을 추천해드려요.
      </p>

      {recommendations.length > 0 && (
        <>
          {/* 총 절감 히어로 카드 */}
          <div style={{
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
            borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "1.5rem",
            color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <p style={{ fontSize: 13, opacity: 0.85, margin: "0 0 4px" }}>모든 추천을 실천하면</p>
              <p style={{ fontSize: 36, fontWeight: 700, margin: 0, lineHeight: 1 }}>
                월 {totalSaving} kg CO₂
              </p>
              <p style={{ fontSize: 14, opacity: 0.85, margin: "6px 0 0" }}>절감 가능해요</p>
            </div>
            <div style={{ fontSize: 56 }}>🌱</div>
          </div>

          {/* 우선순위 통계 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
            <StatBadge label="높음" count={highCount} color="#fef2f2" textColor="#b91c1c" borderColor="#fecaca" />
            <StatBadge label="보통" count={medCount} color="#fffbeb" textColor="#b45309" borderColor="#fde68a" />
            <StatBadge label="전체 추천" count={recommendations.length} color="#f0fdf4" textColor="#16a34a" borderColor="#bbf7d0" />
          </div>
        </>
      )}

      {/* 추천 카드 목록 */}
      {recommendations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📂</div>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#111", marginBottom: 8 }}>아직 분석 데이터가 없어요</p>
          <p style={{ fontSize: 13, color: "#aaa" }}>CSV 파일을 업로드하면 맞춤 추천을 받을 수 있어요</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recommendations.map((rec, i) => (
            <RecommendCard key={i} rec={rec} year={year} month={month} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, count, color, textColor, borderColor }) {
  return (
    <div style={{
      background: color, borderRadius: 12, padding: "12px 16px",
      textAlign: "center", border: `1px solid ${borderColor}`
    }}>
      <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: textColor }}>{count}</p>
      <p style={{ fontSize: 12, color: textColor, opacity: 0.8, margin: "4px 0 0" }}>{label}</p>
    </div>
  );
}