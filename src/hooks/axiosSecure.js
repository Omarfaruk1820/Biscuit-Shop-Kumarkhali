import axios from "axios";
import { auth } from "../Auth/firebase.config";

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();
const REQUEST_TIMEOUT = 15000;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable.");
}

const axiosSecure = axios.create({
  baseURL: API_URL,
  withCredentials: false,
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
        throw new Error("No authenticated Firebase user found.");
      }

      const token = await firebaseUser.getIdToken(false);

      if (!token) {
        throw new Error("Unable to obtain Firebase ID token.");
      }

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;

      return config;
    } catch (error) {
      console.error("AXIOS SECURE AUTH ERROR:", error?.message || error);

      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosSecure.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error?.response) {
      console.error(
        "AXIOS SECURE NETWORK ERROR:",
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
      console.warn("AXIOS SECURE 401:", message);
    }

    if (status === 403) {
      console.warn("AXIOS SECURE 403:", message);
    }

    if (status >= 500) {
      console.error("AXIOS SECURE SERVER ERROR:", message);
    }

    return Promise.reject(error);
  },
);

export default axiosSecure;
