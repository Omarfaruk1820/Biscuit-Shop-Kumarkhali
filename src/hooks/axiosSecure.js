import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL");
}

const axiosSecure = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosSecure.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

axiosSecure.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network Error");
    }

    return Promise.reject(error);
  },
);

export default axiosSecure;
