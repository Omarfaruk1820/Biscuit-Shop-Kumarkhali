import axios from "axios";

// ============================================================
// CONFIG
// ============================================================

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

const REQUEST_TIMEOUT = 15000;

// ============================================================
// VALIDATION
// ============================================================

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable.");
}

// ============================================================
// AXIOS PUBLIC INSTANCE
// ============================================================

const axiosPublic = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

axiosPublic.interceptors.response.use(
  (response) => response,

  (error) => {
    if (!error?.response) {
      console.error(
        "AXIOS PUBLIC NETWORK ERROR:",
        error?.message || "Network error.",
      );
    }

    if (error?.code === "ECONNABORTED") {
      console.error("AXIOS PUBLIC REQUEST TIMEOUT.");
    }

    return Promise.reject(error);
  },
);

export default axiosPublic;
