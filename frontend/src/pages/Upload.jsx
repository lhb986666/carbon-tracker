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
      setMessage(`✅ ${res.data.total_rows}건 분석 완료!`);
      const updated = await uploadAPI.list();
      setHistory(updated.data);
    } catch (e) {
      setStatus("error");
      setMessage(e.response?.data?.detail ?? "업로드 실패. 파일 형식을 확인해주세요.");
    }
  };

  const STATUS_COLOR = { done: "#16a34a", error: "#b91c1c", uploading: "#b45309" };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>소비 내역 업로드</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>
        카드사에서 내려받은 CSV 파일을 업로드하면 탄소 배출량을 자동 분석합니다.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#1D9E75" : "#d1d5db"}`,
          borderRadius: 14, padding: "48px 24px", textAlign: "center",
          cursor: "pointer", transition: "border-color 0.2s",
          background: dragging ? "#f0fdf4" : "#fafafa", marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
        <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>
          {file ? file.name : "CSV 파일을 드래그하거나 클릭해서 업로드"}
        </p>
        <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
          지원: 신한카드, KB국민카드, 하나카드 내역 CSV
        </p>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {message && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 12, fontSize: 13,
          background: status === "done" ? "#f0fdf4" : status === "error" ? "#fef2f2" : "#fffbeb",
          color: STATUS_COLOR[status] ?? "#111",
        }}>
          {message}
        </div>
      )}

      <button onClick={handleUpload} disabled={!file || status === "uploading"}
        style={{
          width: "100%", padding: "13px", borderRadius: 10, border: "none",
          background: !file || status === "uploading" ? "#d1d5db" : "#1D9E75",
          color: "#fff", fontSize: 14, fontWeight: 500,
          cursor: !file || status === "uploading" ? "default" : "pointer",
          marginBottom: "1.5rem",
        }}
      >
        {status === "uploading" ? "분석 중..." : "분석 시작"}
      </button>

      {status === "done" && (
        <button onClick={() => navigate("/dashboard")}
          style={{
            width: "100%", padding: "13px", borderRadius: 10,
            border: "1px solid #1D9E75", background: "#fff",
            color: "#1D9E75", fontSize: 14, fontWeight: 500,
            cursor: "pointer", marginBottom: "1.5rem",
          }}
        >
          대시보드에서 결과 확인 →
        </button>
      )}

      {history.length > 0 && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>업로드 이력</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((h) => (
              <div key={h.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "#f8f8f6", borderRadius: 10, fontSize: 13,
              }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{h.filename}</span>
                  <span style={{ color: "#aaa", marginLeft: 8 }}>
                    {new Date(h.uploaded_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#888" }}>{h.total_rows}건</span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 6,
                    background: h.status === "done" ? "#f0fdf4" : "#fef2f2",
                    color: h.status === "done" ? "#16a34a" : "#b91c1c",
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