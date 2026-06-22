import axios from "axios";

const API = axios.create({
  baseURL: "https://biscuit-shop-server.vercel.app",
  withCredentials: true, // 🔥 MUST
});

export default API;
