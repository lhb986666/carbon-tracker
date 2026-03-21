import React from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendations";
import MyPage from "./pages/MyPage";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <nav style={{
        background: "#fff", borderBottom: "1px solid #eee",
        padding: "0 24px", display: "flex", alignItems: "center",
        height: 52, gap: 4,
      }}>
        <span style={{ fontSize: 18, marginRight: 16 }}>🌿</span>
        {[
          { to: "/upload", label: "업로드" },
          { to: "/dashboard", label: "대시보드" },
          { to: "/recommendations", label: "추천" },
          { to: "/mypage", label: "마이페이지" },
        ].map(({ to, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            padding: "6px 14px", borderRadius: 8, fontSize: 13,
            fontWeight: isActive ? 500 : 400,
            color: isActive ? "#1D9E75" : "#666",
            background: isActive ? "#f0fdf4" : "transparent",
            textDecoration: "none", transition: "all 0.15s",
          })}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/upload" element={
          <PrivateRoute><Layout><Upload /></Layout></PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
        } />
        <Route path="/recommendations" element={
          <PrivateRoute><Layout><Recommendations /></Layout></PrivateRoute>
        } />
        <Route path="/mypage" element={
          <PrivateRoute><Layout><MyPage /></Layout></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}