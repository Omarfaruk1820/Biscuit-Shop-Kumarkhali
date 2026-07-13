import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("❌ Missing VITE_API_URL in .env");
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

axiosSecure.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

axiosSecure.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (!error.response) {
      console.error("Network Error:", error.message);
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      console.warn("401 Unauthorized");
    }

    if (error.response.status === 403) {
      console.warn("403 Forbidden");
    }

    if (error.response.status >= 500) {
      console.error("Internal Server Error");
    }

    return Promise.reject(error);
  },
);

export default axiosSecure;
