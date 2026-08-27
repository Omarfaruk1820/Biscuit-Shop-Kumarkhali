import axios from "axios";
import { auth } from "../Auth/firebase.config";

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable.");
}

const axiosSecure = axios.create({
  baseURL: API_URL,
  timeout: 15000,

  withCredentials: true,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosSecure.interceptors.request.use(
  async (config) => {
    const firebaseUser = auth.currentUser;

    if (firebaseUser) {
      const idToken = await firebaseUser.getIdToken();

      config.headers.Authorization = `Bearer ${idToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosSecure.interceptors.response.use(
  (response) => response,

  (error) => {
    const response = error?.response;

    if (!response) {
      console.error(
        "AXIOS SECURE NETWORK ERROR:",
        error?.message || "Network error.",
      );

      return Promise.reject(error);
    }

    console.error("AXIOS SECURE ERROR:", {
      status: response.status,
      code: response.data?.code,
      message: response.data?.message,
      url: response.config?.url,
    });

    return Promise.reject(error);
  },
);

export default axiosSecure;
