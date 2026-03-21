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

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>친환경 절감 추천</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>
        이번 달 소비 패턴에서 탄소를 가장 많이 줄일 수 있는 행동을 추천해드려요.
      </p>

      {!loading && recommendations.length > 0 && (
        <div style={{
          background: "#f0fdf4", borderRadius: 12, padding: "16px 20px",
          marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: 13, color: "#16a34a", margin: "0 0 2px" }}>모든 추천을 실천하면</p>
            <p style={{ fontSize: 20, fontWeight: 500, color: "#15803d", margin: 0 }}>
              월 {totalSaving} kg CO₂ 절감 가능
            </p>
          </div>
          <div style={{ fontSize: 32 }}>🌱</div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#aaa" }}>불러오는 중...</p>
      ) : recommendations.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: 13 }}>
          분석할 소비 내역이 없어요. CSV를 먼저 업로드해주세요.
        </p>
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