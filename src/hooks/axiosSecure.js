// src/api/axiosSecure.js

import axios from "axios";

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable.");
}

const axiosSecure = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosSecure.interceptors.response.use(
  (response) => response,

  (error) => {
    if (!error?.response) {
      console.error(
        "Axios Secure Network Error:",
        error?.message || "Network error.",
      );

      return Promise.reject(error);
    }

    const status = error.response.status;
    const message = error.response?.data?.message || "Request failed.";

    if (status === 401) {
      console.warn("401 Unauthorized:", message);
    }

    if (status === 403) {
      console.warn("403 Forbidden:", message);
    }

    if (status >= 500) {
      console.error("Server Error:", message);
    }

    return Promise.reject(error);
  },
);

export default axiosSecure;
