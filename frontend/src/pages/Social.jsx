import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socialAPI } from "../api/client";

export default function Social() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadGroups = () => {
    setLoading(true);
    socialAPI
      .list()
      .then((r) => setGroups(r.data))
      .catch(() => setError("그룹 목록을 불러오지 못했어요."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await socialAPI.create(groupName.trim());
      setGroupName("");
      setShowCreate(false);
      loadGroups();
    } catch (e) {
      setError(e.response?.data?.detail || "그룹 생성에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await socialAPI.join(inviteCode.trim());
      setInviteCode("");
      setShowJoin(false);
      loadGroups();
    } catch (e) {
      setError(e.response?.data?.detail || "그룹 참여에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "2rem",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>소셜</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
            style={ghostBtnStyle}
          >
            참여하기
          </button>
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
            style={primaryBtnStyle}
          >
            + 그룹 만들기
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "#fef2f2", color: "#b91c1c", fontSize: 13,
          padding: "10px 14px", borderRadius: 10, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {showCreate && (
        <InlineForm
          placeholder="그룹 이름 (예: 호남대 스터디팀)"
          value={groupName}
          onChange={setGroupName}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          submitting={submitting}
          submitLabel="만들기"
        />
      )}

      {showJoin && (
        <InlineForm
          placeholder="초대 코드 (예: L1IR9I)"
          value={inviteCode}
          onChange={(v) => setInviteCode(v.toUpperCase())}
          onSubmit={handleJoin}
          onCancel={() => setShowJoin(false)}
          submitting={submitting}
          submitLabel="참여"
        />
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "3rem 0" }}>
          불러오는 중...
        </p>
      ) : groups.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "3rem 0", color: "#aaa", fontSize: 13,
        }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>👥</p>
          <p>아직 참여 중인 그룹이 없어요.</p>
          <p>그룹을 만들거나 초대 코드로 참여해보세요.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map((g) => (
            <div
              key={g.id}
              onClick={() => navigate(`/social/${g.id}`)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 18px", background: "#fff", borderRadius: 14,
                border: "1px solid #f0f0f0", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "#bbf7d0")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "#f0f0f0")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  🌿
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
                    {g.name}
                    {g.is_owner && (
                      <span style={{
                        fontSize: 10, color: "#16a34a", background: "#f0fdf4",
                        padding: "1px 6px", borderRadius: 4, marginLeft: 6,
                      }}>
                        방장
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 11, color: "#aaa", margin: "2px 0 0" }}>
                    멤버 {g.member_count}명 · 코드 {g.invite_code}
                  </p>
                </div>
              </div>
              <span style={{ color: "#ccc", fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineForm({ placeholder, value, onChange, onSubmit, onCancel, submitting, submitLabel }) {
  return (
    <div style={{
      display: "flex", gap: 8, marginBottom: 16, padding: "14px",
      background: "#f8f9fa", borderRadius: 12, border: "1px solid #f0f0f0",
    }}>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        style={{
          flex: 1, padding: "10px 12px", borderRadius: 8,
          border: "1px solid #e5e5e5", fontSize: 13, outline: "none",
        }}
      />
      <button onClick={onSubmit} disabled={submitting} style={primaryBtnStyle}>
        {submitting ? "처리 중..." : submitLabel}
      </button>
      <button onClick={onCancel} style={ghostBtnStyle}>취소</button>
    </div>
  );
}

const primaryBtnStyle = {
  padding: "9px 16px", borderRadius: 10, border: "none",
  background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 500,
  cursor: "pointer", whiteSpace: "nowrap",
};

const ghostBtnStyle = {
  padding: "9px 16px", borderRadius: 10, border: "1px solid #e5e5e5",
  background: "#fff", color: "#555", fontSize: 13, fontWeight: 500,
  cursor: "pointer", whiteSpace: "nowrap",
};
