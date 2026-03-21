import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
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
};

export default api;