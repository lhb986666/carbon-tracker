import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadAPI } from "../api/client";

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    uploadAPI.list().then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  const handleFile = (f) => {
    if (!f?.name.endsWith(".csv")) {
      setMessage("CSV 파일만 업로드 가능합니다.");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setMessage("분석 중...");
    try {
      const res = await uploadAPI.uploadCSV(file);
      setStatus("done");
      setMessage(`${res.data.total_rows}건 분석 완료!`);
      const updated = await uploadAPI.list();
      setHistory(updated.data);
    } catch (e) {
      setStatus("error");
      setMessage(e.response?.data?.detail ?? "업로드 실패. 파일 형식을 확인해주세요.");
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>

      {/* 헤더 */}
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4, color: "#111" }}>소비 내역 업로드</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: "2rem" }}>
        카드사에서 내려받은 CSV 파일을 업로드하면 탄소 배출량을 자동 분석합니다.
      </p>

      {/* 지원 카드사 안내 */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["신한카드", "KB국민카드", "하나카드", "현대카드", "삼성카드"].map(card => (
          <span key={card} style={{
            fontSize: 12, padding: "4px 10px", borderRadius: 20,
            background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0"
          }}>{card}</span>
        ))}
      </div>

      {/* 드래그 업로드 영역 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#16a34a" : file ? "#16a34a" : "#d1d5db"}`,
          borderRadius: 16, padding: "48px 24px", textAlign: "center",
          cursor: "pointer", transition: "all 0.2s",
          background: dragging ? "#f0fdf4" : file ? "#f0fdf4" : "#fafafa",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {file ? "✅" : "📂"}
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: file ? "#16a34a" : "#111" }}>
          {file ? file.name : "CSV 파일을 드래그하거나 클릭해서 업로드"}
        </p>
        <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
          {file ? `${(file.size / 1024).toFixed(1)} KB` : "클릭하거나 파일을 여기로 드래그하세요"}
        </p>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {/* 상태 메시지 */}
      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 12, fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
          background: status === "done" ? "#f0fdf4" : status === "error" ? "#fef2f2" : "#fffbeb",
          color: status === "done" ? "#16a34a" : status === "error" ? "#b91c1c" : "#b45309",
          border: `1px solid ${status === "done" ? "#bbf7d0" : status === "error" ? "#fecaca" : "#fde68a"}`,
        }}>
          <span>{status === "done" ? "✅" : status === "error" ? "❌" : "⏳"}</span>
          <span>{message}</span>
        </div>
      )}

      {/* 분석 시작 버튼 */}
      <button onClick={handleUpload} disabled={!file || status === "uploading"}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: !file || status === "uploading" ? "#d1d5db" : "#16a34a",
          color: "#fff", fontSize: 15, fontWeight: 600,
          cursor: !file || status === "uploading" ? "default" : "pointer",
          marginBottom: 12, transition: "background 0.2s",
        }}
      >
        {status === "uploading" ? "⏳ 분석 중..." : "🌿 분석 시작"}
      </button>

      {/* 대시보드 이동 버튼 */}
      {status === "done" && (
        <button onClick={() => navigate("/dashboard")}
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            border: "1.5px solid #16a34a", background: "#fff",
            color: "#16a34a", fontSize: 15, fontWeight: 600,
            cursor: "pointer", marginBottom: "1.5rem",
          }}
        >
          대시보드에서 결과 확인 →
        </button>
      )}

      {/* 업로드 이력 */}
      {history.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#111" }}>업로드 이력</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((h) => (
              <div key={h.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: "#f8f9fa", borderRadius: 12,
                fontSize: 13, border: "1px solid #f0f0f0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div>
                    <p style={{ fontWeight: 500, margin: 0, color: "#111" }}>{h.filename}</p>
                    <p style={{ color: "#aaa", margin: "2px 0 0", fontSize: 11 }}>
                      {new Date(h.uploaded_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#16a34a", fontWeight: 500 }}>{h.total_rows}건</span>
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20,
                    background: h.status === "done" ? "#f0fdf4" : "#fef2f2",
                    color: h.status === "done" ? "#16a34a" : "#b91c1c",
                    border: `1px solid ${h.status === "done" ? "#bbf7d0" : "#fecaca"}`,
                  }}>
                    {h.status === "done" ? "완료" : h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}