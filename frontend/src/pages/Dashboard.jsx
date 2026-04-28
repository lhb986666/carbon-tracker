import React, { useEffect, useState } from "react";
import { analysisAPI, recommendAPI } from "../api/client";
import CarbonChart from "../components/CarbonChart";
import RecommendCard from "../components/RecommendCard";

export default function Dashboard() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [compare, setCompare] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [s, c, t, cmp, rec] = await Promise.all([
          analysisAPI.monthly(year, month),
          analysisAPI.byCategory(year, month),
          analysisAPI.trend(),
          analysisAPI.compare(year, month),
          recommendAPI.list(year, month),
        ]);
        setSummary(s.data);
        setByCategory(c.data);
        setTrend(t.data);
        setCompare(cmp.data);
        setRecommendations(rec.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [year, month]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
        <p style={{ color: "#888", fontSize: 14 }}>탄소 데이터를 불러오는 중...</p>
      </div>
    </div>
  );

  const eq = summary?.equivalents;
  const totalSaving = recommendations.reduce((a, r) => a + r.saving_kg, 0).toFixed(1);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#111" }}>내 탄소발자국</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>{year}년 {month}월 소비 분석</p>
        </div>
        <select
          value={`${year}-${month}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-");
            setYear(Number(y)); setMonth(Number(m));
          }}
          style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e0e0e0", fontSize: 13, background: "#fff", cursor: "pointer" }}
        >
          {Array.from({ length: 6 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const y = d.getFullYear(), m = d.getMonth() + 1;
            return <option key={i} value={`${y}-${m}`}>{y}년 {m}월</option>;
          })}
        </select>
      </div>

      {/* 총 배출량 히어로 카드 */}
      <div style={{
        background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
        borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "1.5rem",
        color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
      }}>
        <div>
          <p style={{ fontSize: 13, opacity: 0.85, margin: "0 0 4px" }}>이번 달 총 탄소 배출량</p>
          <p style={{ fontSize: 48, fontWeight: 700, margin: 0, lineHeight: 1 }}>
            {summary?.total_carbon_kg ?? 0}
          </p>
          <p style={{ fontSize: 16, opacity: 0.85, margin: "4px 0 0" }}>kg CO₂</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <MiniStat label="동일 연령대 대비" value={compare ? `${compare.diff_percent > 0 ? "+" : ""}${compare.diff_percent}%` : "-"} warn={compare?.diff_percent > 0} />
          <MiniStat label="절감 가능량" value={`${totalSaving} kg`} good />
        </div>
      </div>

      {/* 등가 환산 카드 */}
      {eq && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
          <EquivCard icon="🌳" value={`${eq.trees}그루`} label="나무 흡수 환산" color="#dcfce7" textColor="#15803d" />
          <EquivCard icon="✈️" value={`${eq.flights_seoul_busan}회`} label="서울↔부산 항공" color="#dbeafe" textColor="#1d4ed8" />
          <EquivCard icon="💨" value={`${eq.days_breathing}일`} label="성인 호흡량 환산" color="#f3e8ff" textColor="#7e22ce" />
        </div>
      )}

      {/* 차트 영역 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <Card title="업종별 탄소 배출">
          <CarbonChart data={byCategory} type="bar" />
        </Card>
        <Card title="6개월 추이">
          <CarbonChart data={trend} type="line" />
        </Card>
      </div>

      {/* 친환경 추천 */}
      <Card title="친환경 절감 추천">
        {recommendations.length > 0 && (
          <div style={{
            background: "#f0fdf4", borderRadius: 10, padding: "12px 16px",
            marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <p style={{ fontSize: 13, color: "#15803d", margin: 0 }}>모든 추천을 실천하면</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#15803d", margin: 0 }}>월 {totalSaving} kg CO₂ 절감 가능</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recommendations.map((rec, i) => (
            <RecommendCard key={i} rec={rec} year={year} month={month} />
          ))}
          {recommendations.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📂</p>
              <p style={{ color: "#aaa", fontSize: 13 }}>CSV를 업로드하면 맞춤 추천이 표시돼요</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, warn, good }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 16px", textAlign: "center", minWidth: 100 }}>
      <p style={{ fontSize: 11, opacity: 0.85, margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 600, margin: 0, color: warn ? "#fde68a" : good ? "#bbf7d0" : "#fff" }}>{value}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 16, padding: "20px" }}>
      <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px", color: "#111" }}>{title}</p>
      {children}
    </div>
  );
}

function EquivCard({ icon, value, label, color, textColor }) {
  return (
    <div style={{ background: color, borderRadius: 14, padding: "16px", textAlign: "center" }}>
      <p style={{ fontSize: 28, margin: "0 0 6px" }}>{icon}</p>
      <p style={{ fontSize: 20, fontWeight: 600, margin: 0, color: textColor }}>{value}</p>
      <p style={{ fontSize: 11, color: textColor, opacity: 0.8, margin: "4px 0 0" }}>{label}</p>
    </div>
  );
}