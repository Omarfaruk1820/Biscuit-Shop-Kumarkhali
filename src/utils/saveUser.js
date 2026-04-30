import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const saveUserToDB = async (user, provider = "password") => {
  return await axios.post(`${API}/users`, {
    name: user.displayName || "No Name",
    email: user.email,
    photo: user.photoURL || "",
    provider,
  });
};