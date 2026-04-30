import React, { useContext, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import { AuthContext } from "../Auth/AuthProvider";
import { useToast } from "../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

// ================= SAVE USER =================
const saveUserToDB = async (user) => {
  return axios.post(`${API}/users`, {
    name: user.displayName,
    email: user.email,
    photo: user.photoURL,
    provider: "google",
  });
};

const GoogleSignIn = () => {
  const { signInGoogle } = useContext(AuthContext);
  const { addToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const result = await signInGoogle();
      const user = result.user;

      // JWT
      await axios.post(
        `${API}/jwt`,
        { email: user.email },
        { withCredentials: true }
      );

      // MongoDB
      await saveUserToDB(user);

      addToast(`Welcome ${user.displayName || "User"} 🎉`, "success");

      navigate(from, { replace: true });

    } catch (error) {
      console.error(error);
      addToast("Google sign-in failed ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">

      <div className="flex items-center w-full my-4">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="px-3 text-sm text-gray-500">OR</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition disabled:opacity-60"
      >
        <FcGoogle className="text-2xl" />
        {loading ? "Signing in..." : "Continue with Google"}
      </button>

    </div>
  );
};

export default GoogleSignIn;