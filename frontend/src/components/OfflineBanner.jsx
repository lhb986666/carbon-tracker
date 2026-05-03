import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      background: "#fef2f2",
      borderBottom: "1px solid #fecaca",
      padding: "8px 24px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      color: "#b91c1c",
    }}>
      <span>📡</span>
      <span>인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있어요.</span>
    </div>
  );
}
