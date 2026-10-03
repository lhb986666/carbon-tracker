import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socialAPI } from "../api/client";

const RANK_MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [view, setView] = useState("monthly"); // "monthly" | "total"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const now = new Date();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      socialAPI.detail(groupId),
      socialAPI.leaderboard(groupId, now.getFullYear(), now.getMonth() + 1),
    ])
      .then(([g, lb]) => {
        setGroup(g.data);
        setLeaderboard(lb.data);
      })
      .catch(() => setError("그룹 정보를 불러오지 못했어요."))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleLeave = async () => {
    if (!window.confirm(`'${group?.name}' 그룹에서 나가시겠어요?`)) return;
    try {
      await socialAPI.leave(groupId);
      navigate("/social");
    } catch (e) {
      setError(e.response?.data?.detail || "그룹 나가기에 실패했어요.");
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "3rem 0", color: "#aaa", fontSize: 13 }}>
        불러오는 중...
      </p>
    );
  }

  if (error && !group) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
        <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>
        <button onClick={() => navigate("/social")} style={ghostBtnStyle}>목록으로</button>
      </div>
    );
  }

  const entries = leaderboard?.entries ?? [];
  const sortedByView = [...entries].sort((a, b) => {
    const av = view === "monthly" ? a.monthly_carbon_kg : a.total_carbon_kg;
    const bv = view === "monthly" ? b.monthly_carbon_kg : b.total_carbon_kg;
    if ((av === 0) !== (bv === 0)) return av === 0 ? 1 : -1;
    return av - bv;
  }).map((e, i) => ({ ...e, displayRank: i + 1 }));

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <button
        onClick={() => navigate("/social")}
        style={{ ...ghostBtnStyle, marginBottom: 16, padding: "6px 12px", fontSize: 12 }}
      >
        ← 목록으로
      </button>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: "1.5rem",
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            {group.name}
          </h1>
          <div
            onClick={handleCopyCode}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
              fontSize: 12, color: "#16a34a", background: "#f0fdf4",
              padding: "4px 10px", borderRadius: 8, cursor: "pointer",
            }}
          >
            초대 코드: <b>{group.invite_code}</b> {copied ? "✓ 복사됨" : "📋"}
          </div>
        </div>
        <button onClick={handleLeave} style={{ ...ghostBtnStyle, color: "#b91c1c", borderColor: "#fca5a5" }}>
          나가기
        </button>
      </div>

      {error && (
        <div style={{
          background: "#fef2f2", color: "#b91c1c", fontSize: 13,
          padding: "10px 14px", borderRadius: 10, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* 탭 */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 16, background: "#f0f0f0",
        borderRadius: 10, padding: 4, width: "fit-content",
      }}>
        <TabButton active={view === "monthly"} onClick={() => setView("monthly")}>
          이번 달
        </TabButton>
        <TabButton active={view === "total"} onClick={() => setView("total")}>
          전체 누적
        </TabButton>
      </div>

      {/* 리더보드 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sortedByView.map((e) => {
          const value = view === "monthly" ? e.monthly_carbon_kg : e.total_carbon_kg;
          return (
            <div
              key={e.user_id}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderRadius: 14,
                background: e.is_me ? "#f0fdf4" : "#fff",
                border: e.is_me ? "1.5px solid #86efac" : "1px solid #f0f0f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  width: 28, textAlign: "center", fontSize: e.displayRank <= 3 ? 18 : 13,
                  fontWeight: 600, color: "#888",
                }}>
                  {RANK_MEDAL[e.displayRank] || e.displayRank}
                </span>
                <span style={{ fontSize: 14, fontWeight: e.is_me ? 700 : 500, color: "#1a1a1a" }}>
                  {e.nickname}{e.is_me && " (나)"}
                </span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: value === 0 ? "#ccc" : "#16a34a" }}>
                {value === 0 ? "데이터 없음" : `${value.toFixed(1)}kg`}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 16 }}>
        탄소 배출량이 적을수록 순위가 높아요 🌱
      </p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 16px", borderRadius: 8, border: "none",
        background: active ? "#fff" : "transparent",
        color: active ? "#16a34a" : "#888",
        fontWeight: active ? 600 : 400, fontSize: 13,
        cursor: "pointer", boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {children}
    </button>
  );
}

const ghostBtnStyle = {
  padding: "9px 16px", borderRadius: 10, border: "1px solid #e5e5e5",
  background: "#fff", color: "#555", fontSize: 13, fontWeight: 500,
  cursor: "pointer", whiteSpace: "nowrap",
};
