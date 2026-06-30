import axios from "axios";

const axiosSecure = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosSecure.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized");
    }

    if (error.response?.status === 403) {
      console.log("Forbidden");
    }

    return Promise.reject(error);
  },
);

export default axiosSecure;
