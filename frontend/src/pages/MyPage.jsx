import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, uploadAPI } from "../api/client";

export default function MyPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    uploadAPI.list().then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await authAPI.logout();
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "1.5rem" }}>마이페이지</h1>

      <Section title="업로드 이력">
        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: "#aaa" }}>업로드 내역이 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((h) => (
              <div key={h.id} style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 14px", background: "#f8f8f6", borderRadius: 10, fontSize: 13,
              }}>
                <span style={{ fontWeight: 500 }}>{h.filename}</span>
                <span style={{ color: "#aaa" }}>
                  {new Date(h.uploaded_at).toLocaleDateString("ko-KR")} · {h.total_rows}건
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="계정">
        <button onClick={handleLogout}
          style={{
            padding: "10px 20px", borderRadius: 10,
            border: "1px solid #fca5a5", background: "#fff",
            color: "#b91c1c", fontSize: 13, cursor: "pointer",
          }}
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
      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>{title}</p>
      {children}
    </div>
  );
}