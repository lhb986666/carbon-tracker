import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", age_group: "", region: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const AGE_GROUPS = ["10s", "20s", "30s", "40s", "50s", "60s+"];
  const REGIONS = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "기타"];

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await authAPI.register(form);
        setIsRegister(false);
        setError("회원가입 완료! 로그인해주세요.");
      } else {
        const res = await authAPI.login(form.email, form.password);
        localStorage.setItem("access_token", res.data.access_token);
        navigate("/dashboard");
      }
    } catch (e) {
      setError(e.response?.data?.detail ?? "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #e5e7eb", fontSize: 14,
    outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)"
    }}>
      {/* 왼쪽 — 소개 패널 */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "4rem",
        display: window.innerWidth < 768 ? "none" : "flex"
      }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🌍</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#15803d", margin: "0 0 16px", lineHeight: 1.2 }}>
          탄소발자국<br />추적기
        </h1>
        <p style={{ fontSize: 16, color: "#166534", lineHeight: 1.7, maxWidth: 360 }}>
          카드 소비 내역으로 나의 탄소 배출량을 분석하고 친환경 소비 습관을 만들어보세요.
        </p>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { icon: "📊", text: "CSV 업로드로 탄소 자동 분석" },
            { icon: "🌱", text: "친환경 대안 맞춤 추천" },
            { icon: "📱", text: "모바일 앱으로 실시간 확인" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: "#166534", fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 — 로그인 폼 */}
      <div style={{
        width: 440, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem", background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* 로고 */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 12px"
            }}>🌿</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#111" }}>탄소발자국 추적기</h2>
            <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>내 소비로 보는 탄소 배출량 분석</p>
          </div>

          {/* 탭 */}
          <div style={{ display: "flex", marginBottom: 24, borderBottom: "2px solid #f0f0f0" }}>
            {["로그인", "회원가입"].map((label, i) => (
              <button key={i} onClick={() => { setIsRegister(i === 1); setError(""); }}
                style={{
                  flex: 1, padding: "10px 0", fontSize: 14,
                  fontWeight: isRegister === (i === 1) ? 600 : 400,
                  color: isRegister === (i === 1) ? "#16a34a" : "#aaa",
                  background: "none", border: "none",
                  borderBottom: isRegister === (i === 1) ? "2px solid #16a34a" : "2px solid transparent",
                  cursor: "pointer", marginBottom: -2, transition: "all 0.2s"
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* 입력 폼 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="email" placeholder="이메일" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle} />
            <input type="password" placeholder="비밀번호" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle} />

            {isRegister && (
              <>
                <select value={form.age_group}
                  onChange={(e) => setForm({ ...form, age_group: e.target.value })}
                  style={inputStyle}>
                  <option value="">연령대 선택 (선택)</option>
                  {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  style={inputStyle}>
                  <option value="">지역 선택 (선택)</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </>
            )}

            {/* 에러/성공 메시지 */}
            {error && (
              <div style={{
                fontSize: 13, padding: "10px 14px", borderRadius: 10,
                background: error.includes("완료") ? "#f0fdf4" : "#fef2f2",
                color: error.includes("완료") ? "#16a34a" : "#b91c1c",
                border: `1px solid ${error.includes("완료") ? "#bbf7d0" : "#fecaca"}`,
                display: "flex", alignItems: "center", gap: 8
              }}>
                <span>{error.includes("완료") ? "✅" : "❌"}</span>
                <span>{error}</span>
              </div>
            )}

            {/* 제출 버튼 */}
            <button onClick={handleSubmit} disabled={loading}
              style={{
                padding: "14px", borderRadius: 12, border: "none",
                background: loading ? "#ccc" : "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: loading ? "default" : "pointer", marginTop: 4,
                transition: "opacity 0.2s"
              }}>
              {loading ? "처리 중..." : isRegister ? "🌿 회원가입" : "🌿 로그인"}
            </button>
          </div>

          {/* 하단 문구 */}
          <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
            탄소 중립을 위한 첫 걸음 🌍<br />
            내 소비가 지구에 미치는 영향을 확인해보세요
          </p>
        </div>
      </div>
    </div>
  );
}