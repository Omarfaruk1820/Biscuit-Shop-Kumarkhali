// src/api/axiosPublic.js

import axios from "axios";

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable.");
}

const axiosPublic = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosPublic.interceptors.response.use(
  (response) => response,

  (error) => {
    if (!error?.response) {
      console.error(
        "Axios Public Network Error:",
        error?.message || "Network error.",
      );
    }

    if (error?.code === "ECONNABORTED") {
      console.error("Axios Public Request Timeout.");
    }

    return Promise.reject(error);
  },
);

export default axiosPublic;
