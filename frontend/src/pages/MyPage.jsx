import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, uploadAPI } from "../api/client";

export default function MyPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    uploadAPI.list().then((r) => setHistory(r.data)).catch(() => {});
    authAPI.me().then((r) => setUser(r.data)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await authAPI.logout();
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: "2rem", color: "#1a1a1a" }}>마이페이지</h1>

      {/* 사용자 정보 카드 */}
      {user && (
        <div style={{
          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
          borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem",
          color: "#fff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24
            }}>🌿</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{user.email}</p>
              <p style={{ fontSize: 13, margin: "4px 0 0", opacity: 0.85 }}>
                {user.age_group && `${user.age_group} · `}{user.region || "지역 미설정"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 12, marginBottom: "1.5rem"
      }}>
        <StatCard label="총 업로드" value={`${history.length}회`} icon="📂" />
        <StatCard
          label="총 분석 건수"
          value={`${history.reduce((a, b) => a + (b.total_rows || 0), 0)}건`}
          icon="📊"
        />
      </div>

      {/* 업로드 이력 */}
      <Section title="업로드 이력">
        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "2rem 0" }}>
            업로드 내역이 없습니다.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((h) => (
              <div key={h.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: "#f8f9fa", borderRadius: 12,
                fontSize: 13, border: "1px solid #f0f0f0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <span style={{ fontWeight: 500, color: "#1a1a1a" }}>{h.filename}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#16a34a", fontWeight: 500 }}>{h.total_rows}건</div>
                  <div style={{ color: "#aaa", fontSize: 11 }}>
                    {new Date(h.uploaded_at).toLocaleDateString("ko-KR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 계정 설정 */}
      <Section title="계정 설정">
        <button onClick={handleLogout} style={{
          width: "100%", padding: "12px 20px", borderRadius: 12,
          border: "1px solid #fca5a5", background: "#fff",
          color: "#b91c1c", fontSize: 14, fontWeight: 500,
          cursor: "pointer", transition: "all 0.2s"
        }}
          onMouseOver={e => e.target.style.background = "#fff1f1"}
          onMouseOut={e => e.target.style.background = "#fff"}
        >
          로그아웃
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#1a1a1a" }}>{title}</p>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{
      background: "#f8f9fa", borderRadius: 12, padding: "1rem",
      border: "1px solid #f0f0f0", textAlign: "center"
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: "#16a34a" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{label}</div>
    </div>
  );
}