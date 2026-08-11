import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL?.trim();

if (!API_URL) {
  throw new Error("Missing VITE_API_URL in .env");
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
    if (!error.response) {
      console.error("Network Error:", error.message);
    }

    if (error.code === "ECONNABORTED") {
      console.error("Axios Request Timeout.");
    }

    return Promise.reject(error);
  },
);

export default axiosPublic;
