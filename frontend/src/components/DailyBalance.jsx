import React, { useEffect, useState } from "react";
import { analysisAPI } from "../api/client";

const fmt = (n) => (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2));

export default function DailyBalance({ year, month }) {
  const [days, setDays] = useState([]);
  const [day, setDay] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 선택한 달에서 거래가 있는 날짜 목록 → 가장 최근 날짜를 기본 선택
  useEffect(() => {
    setLoading(true);
    analysisAPI
      .activeDays(year, month)
      .then((r) => {
        setDays(r.data);
        setDay(r.data[0]?.date ?? "");
        if (r.data.length === 0) {
          setData(null);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [year, month]);

  useEffect(() => {
    if (!day) return;
    setLoading(true);
    analysisAPI
      .dailyBalance(day)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [day]);

  if (!loading && days.length === 0) {
    return <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "1.5rem 0" }}>
      이 달에는 하루 단위로 볼 거래가 없어요
    </p>;
  }
  if (!data) {
    return <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "1.5rem 0" }}>불러오는 중...</p>;
  }

  const net = data.net_kg;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, background: "#fff" }}
        >
          {days.map((d) => (
            <option key={d.date} value={d.date}>{d.date} ({d.count}건)</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
          <Pill color="#b91c1c" bg="#fef2f2">+ 배출 {fmt(data.total_emission_kg)}kg</Pill>
          <Pill color="#15803d" bg="#f0fdf4">− 절감 {fmt(data.total_saved_kg)}kg</Pill>
          <Pill color="#111" bg="#f3f4f6">순 {net > 0 ? "+" : ""}{fmt(net)}kg</Pill>
        </div>
      </div>

      <FlowChart items={data.items} />

      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 8 }}>
        {data.items.map((it) => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "52px 1fr auto", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f3f3", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "#888" }}>
              <div style={{ fontWeight: 600, color: "#555" }}>{it.time}</div>
              <div style={{ fontSize: 10 }}>{it.slot}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, color: "#111", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.merchant} <span style={{ fontSize: 11, color: "#999", fontWeight: 400 }}>· {it.category}</span>
              </div>
              {it.saved_kg > 0 && (
                <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>
                  {it.baseline} 대비 {fmt(it.saved_kg)}kg 절감 👏
                </div>
              )}
              {it.potential_saving_kg > 0 && (
                <div style={{ fontSize: 11, color: "#a16207", marginTop: 2 }}>
                  💡 {it.tip} → −{fmt(it.potential_saving_kg)}kg 가능
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#b91c1c" }}>+{fmt(it.emission_kg)}</div>
              {it.saved_kg > 0 && (
                <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>−{fmt(it.saved_kg)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.potential_saving_kg > 0 && (
        <div style={{ marginTop: 12, background: "#fffbeb", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#a16207" }}>
          추천대로 실천하면 이 날 <b>−{fmt(data.potential_saving_kg)}kg</b> 더 줄일 수 있어요
        </div>
      )}
      <p style={{ fontSize: 11, color: "#bbb", margin: "10px 0 0" }}>
        * 카드 내역에는 결제 시각이 없어, 업종별 대표 시간대로 아침→저녁 순서를 추정해 보여줘요.
      </p>
    </div>
  );
}

function Pill({ children, color, bg }) {
  return (
    <span style={{ background: bg, color, padding: "4px 10px", borderRadius: 999, fontWeight: 600 }}>
      {children}
    </span>
  );
}

// 하루 흐름에 따른 누적 탄소(순 배출) 계단 그래프
function FlowChart({ items }) {
  if (items.length === 0) return null;
  const W = 600, H = 120, P = 16;
  const pts = [{ x: 0, v: 0 }, ...items.map((it, i) => ({ x: i + 1, v: it.cumulative_kg }))];
  const vals = pts.map((p) => p.v);
  const min = Math.min(0, ...vals), max = Math.max(0.0001, ...vals);
  const xs = (i) => P + (i / (pts.length - 1 || 1)) * (W - P * 2);
  const ys = (v) => H - P - ((v - min) / (max - min || 1)) * (H - P * 2);
  const path = pts
    .map((p, i) => (i === 0 ? `M ${xs(i)} ${ys(p.v)}` : `L ${xs(i)} ${ys(pts[i - 1].v)} L ${xs(i)} ${ys(p.v)}`))
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", background: "#fafafa", borderRadius: 10 }}>
      <line x1={P} x2={W - P} y1={ys(0)} y2={ys(0)} stroke="#ddd" strokeDasharray="4 4" />
      <path d={path} fill="none" stroke="#16a34a" strokeWidth="2.5" />
      {pts.slice(1).map((p, i) => {
        const up = items[i].emission_kg - items[i].saved_kg >= 0;
        return <circle key={i} cx={xs(i + 1)} cy={ys(p.v)} r="4" fill={up ? "#ef4444" : "#16a34a"} />;
      })}
      <text x={P} y={12} fontSize="10" fill="#999">아침</text>
      <text x={W - P} y={12} fontSize="10" fill="#999" textAnchor="end">저녁</text>
    </svg>
  );
}
