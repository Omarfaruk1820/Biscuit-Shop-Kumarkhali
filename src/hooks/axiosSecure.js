import axios from "axios";

// ======================================================
// Environment Validation
// ======================================================

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("❌ Missing VITE_API_URL in .env");
}

// ======================================================
// Axios Secure Instance
// ======================================================

const axiosSecure = axios.create({
  baseURL: API_URL,

  withCredentials: true,

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ======================================================
// Request Interceptor
// ======================================================

axiosSecure.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

// ======================================================
// Response Interceptor
// ======================================================

axiosSecure.interceptors.response.use(
  (response) => response,

  async (error) => {
    // ==========================================
    // Network Error
    // ==========================================

    if (!error.response) {
      console.error("Network Error:", error.message);
      return Promise.reject(error);
    }

    // ==========================================
    // Unauthorized
    // ==========================================

    if (error.response.status === 401) {
      console.warn("401 Unauthorized");
    }

    // ==========================================
    // Forbidden
    // ==========================================

    if (error.response.status === 403) {
      console.warn("403 Forbidden");
    }

    // ==========================================
    // Server Error
    // ==========================================

    if (error.response.status >= 500) {
      console.error("Internal Server Error");
    }

    return Promise.reject(error);
  },
);

export default axiosSecure;
