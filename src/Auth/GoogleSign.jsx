import React, { useContext, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import { AuthContext } from "../Auth/AuthProvider";
import { useToast } from "../context/ToastProvider";

const GoogleSign = () => {
  const { signInGoogle } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  // ================= GOOGLE LOGIN =================
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      // ✅ Firebase Google login
      const result = await signInGoogle();
      const user = result.user;

      // ================= JWT STEP =================
      // 🔥 Send user info to backend to get token
      const res = await axios.post(
        "http://localhost:5000/jwt",
        {
          email: user.email,
        },
        {
          withCredentials: true, // ✅ important for cookie
        }
      );

      // (optional) if you also return token manually
      // localStorage.setItem("token", res.data.token);

      // ================= SUCCESS =================
      addToast(`Welcome ${user.displayName || "User"} 🎉`, "success");

      navigate(from, { replace: true });

    } catch (error) {
      console.error(error);

      addToast(
        error?.response?.data?.message ||
          "Google sign-in failed ❌",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">

      {/* Divider */}
      <div className="flex items-center w-full my-4">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="px-3 text-sm text-gray-500">OR</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      {/* Google Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl shadow-sm
        hover:shadow-md hover:bg-gray-50 transition-all duration-300 active:scale-95 disabled:opacity-60"
      >
        <FcGoogle className="text-2xl" />

        <span className="font-medium text-gray-700">
          {loading ? "Signing in..." : "Continue with Google"}
        </span>
      </button>
    </div>
  );
};

export default GoogleSign;