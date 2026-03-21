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
    padding: "10px 14px", borderRadius: 8,
    border: "1px solid #e5e7eb", fontSize: 13,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8faf8" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", width: 380, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🌿</div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>탄소발자국 추적기</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>내 소비로 보는 탄소 배출량 분석</p>
        </div>

        <div style={{ display: "flex", marginBottom: 24, borderBottom: "1px solid #eee" }}>
          {["로그인", "회원가입"].map((label, i) => (
            <button key={i} onClick={() => { setIsRegister(i === 1); setError(""); }}
              style={{
                flex: 1, padding: "8px 0", fontSize: 14,
                fontWeight: isRegister === (i === 1) ? 500 : 400,
                color: isRegister === (i === 1) ? "#1D9E75" : "#aaa",
                background: "none", border: "none",
                borderBottom: isRegister === (i === 1) ? "2px solid #1D9E75" : "2px solid transparent",
                cursor: "pointer", marginBottom: -1,
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="이메일" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          <input type="password" placeholder="비밀번호" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} style={inputStyle} />
          {isRegister && (
            <>
              <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} style={inputStyle}>
                <option value="">연령대 선택 (선택)</option>
                {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} style={inputStyle}>
                <option value="">지역 선택 (선택)</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </>
          )}
          {error && (
            <p style={{
              fontSize: 12, margin: 0, padding: "8px 12px", borderRadius: 8,
              background: error.includes("완료") ? "#f0fdf4" : "#fef2f2",
              color: error.includes("완료") ? "#16a34a" : "#b91c1c",
            }}>{error}</p>
          )}
          <button onClick={handleSubmit} disabled={loading}
            style={{
              padding: "12px", borderRadius: 10, border: "none",
              background: loading ? "#ccc" : "#1D9E75", color: "#fff",
              fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer", marginTop: 4,
            }}>
            {loading ? "처리 중..." : isRegister ? "회원가입" : "로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}