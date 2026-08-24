import axios from "axios";
import { auth } from "../Auth/firebase.config";

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

const REQUEST_TIMEOUT = 15000;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable.");
}

const axiosSecure = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosSecure.interceptors.request.use(
  async (config) => {
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        return Promise.reject(
          new Error("No authenticated Firebase user found."),
        );
      }

      const token = await firebaseUser.getIdToken();

      if (!token) {
        return Promise.reject(new Error("Unable to get Firebase ID token."));
      }

      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${token}`;

      return config;
    } catch (error) {
      console.error("AXIOS SECURE REQUEST ERROR:", error);

      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error),
);

axiosSecure.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error?.response) {
      console.error(
        "Axios Secure Network Error:",
        error?.message || "Network error.",
      );

      return Promise.reject(error);
    }

    const status = error.response.status;

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Request failed.";

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
