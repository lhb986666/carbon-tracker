import axios from "axios";

const api = axios.create({
  baseURL: "http://54.116.69.43:8080",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (email, password) =>
    api.post(
      "/api/auth/login",
      new URLSearchParams({ username: email, password }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    ),
  logout: () => api.post("/api/auth/logout"),
  me: () => api.get("/api/auth/me"),
  updateMe: (data) => api.patch("/api/auth/me", data),
};

export const socialAPI = {
  list: () => api.get("/api/groups"),
  create: (name) => api.post("/api/groups", { name }),
  join: (invite_code) => api.post("/api/groups/join", { invite_code }),
  detail: (groupId) => api.get(`/api/groups/${groupId}`),
  leave: (groupId) => api.delete(`/api/groups/${groupId}/leave`),
  leaderboard: (groupId, year, month) =>
    api.get(`/api/groups/${groupId}/leaderboard`, { params: { year, month, _: Date.now() } }),
};

export const uploadAPI = {
  uploadCSV: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/api/uploads", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: () => api.get("/api/uploads"),
  status: (id) => api.get(`/api/uploads/${id}/status`),
};

export const analysisAPI = {
  monthly: (year, month) =>
    api.get("/api/analysis/monthly", { params: { year, month } }),
  byCategory: (year, month) =>
    api.get("/api/analysis/by-category", { params: { year, month } }),
  trend: () => api.get("/api/analysis/trend"),
  compare: (year, month) =>
    api.get("/api/analysis/compare", { params: { year, month } }),
};

export const recommendAPI = {
  list: (year, month) =>
    api.get("/api/recommendations", { params: { year, month } }),
  simulate: (category, year, month) =>
    api.get("/api/recommendations/simulate", {
      params: { category, year, month },
    }),
  getAI: (year, month) =>
    api.get("/api/recommendations/ai", {
      params: { year, month, _: Date.now() },
    }),
};

export default api;