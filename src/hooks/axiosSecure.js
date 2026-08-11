import axios from "axios";

// ============================================================
// API URL
// ============================================================

const API_URL = import.meta.env.VITE_API_URL?.trim();

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable.");
}

// ============================================================
// AXIOS INSTANCE
// ============================================================

const axiosSecure = axios.create({
  baseURL: API_URL,

  // Important:
  // Sends JWT cookie to the backend.
  withCredentials: true,

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

axiosSecure.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    // ========================================================
    // NETWORK ERROR
    // ========================================================

    if (!error.response) {
      console.error("Axios Network Error:", error.message);

      return Promise.reject(error);
    }

    // ========================================================
    // HTTP ERROR
    // ========================================================

    const status = error.response.status;

    if (status === 401) {
      console.warn(
        "401 Unauthorized:",
        error.response?.data?.message || "Authentication required.",
      );
    }

    if (status === 403) {
      console.warn(
        "403 Forbidden:",
        error.response?.data?.message || "Access denied.",
      );
    }

    if (status >= 500) {
      console.error(
        "Server Error:",
        error.response?.data?.message || "Internal server error.",
      );
    }

    return Promise.reject(error);
  },
);

export default axiosSecure;
