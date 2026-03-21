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

  if (loading) return <p style={{ padding: "2rem" }}>분석 데이터를 불러오는 중...</p>;

  const eq = summary?.equivalents;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>내 탄소발자국</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
            {year}년 {month}월 소비 분석
          </p>
        </div>
        <select
          value={`${year}-${month}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-");
            setYear(Number(y)); setMonth(Number(m));
          }}
          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
        >
          {Array.from({ length: 6 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const y = d.getFullYear(), m = d.getMonth() + 1;
            return <option key={i} value={`${y}-${m}`}>{y}년 {m}월</option>;
          })}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <MetricCard label="이번 달 총 배출량" value={`${summary?.total_carbon_kg ?? 0} kg`} sub="CO₂" />
        <MetricCard
          label="동일 연령대 평균 대비"
          value={compare ? `${compare.diff_percent > 0 ? "+" : ""}${compare.diff_percent}%` : "-"}
          sub={compare ? `평균 ${compare.avg_carbon_kg} kg` : ""}
          warn={compare?.diff_percent > 0}
        />
        <MetricCard
          label="절감 가능량"
          value={`${recommendations.reduce((a, r) => a + r.saving_kg, 0).toFixed(1)} kg`}
          sub="추천 실천 시" good
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12, marginBottom: "1.5rem" }}>
        <Card title="업종별 탄소 배출">
          <CarbonChart data={byCategory} type="bar" />
        </Card>
        <Card title="6개월 추이">
          <CarbonChart data={trend} type="line" />
        </Card>
      </div>

      {eq && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
          <EquivCard value={`🌳 ${eq.trees}그루`} label="나무 흡수 환산" />
          <EquivCard value={`✈ 서울↔부산 ${eq.flights_seoul_busan}회`} label="항공 탄소 환산" />
          <EquivCard value={`💨 ${eq.days_breathing}일`} label="성인 호흡량 환산" />
        </div>
      )}

      <Card title="친환경 절감 추천">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recommendations.map((rec, i) => (
            <RecommendCard key={i} rec={rec} year={year} month={month} />
          ))}
          {recommendations.length === 0 && (
            <p style={{ color: "#aaa", fontSize: 13 }}>추천 데이터가 없습니다. CSV를 업로드해주세요.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, sub, warn, good }) {
  return (
    <div style={{ background: "#f8f8f6", borderRadius: 10, padding: "14px 16px" }}>
      <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, margin: 0, color: warn ? "#d97706" : good ? "#16a34a" : "#111" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "#aaa", margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "16px" }}>
      <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px" }}>{title}</p>
      {children}
    </div>
  );
}

function EquivCard({ value, label }) {
  return (
    <div style={{ background: "#f8f8f6", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
      <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>{label}</p>
    </div>
  );
}