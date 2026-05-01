import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";

const API = import.meta.env.VITE_API_URL;

// ================= SAVE USER =================
const saveUserToDB = async (user) => {
  return axios.post(`${API}/users`, {
    name: user.displayName || "No Name",
    email: user.email,
    photo: user.photoURL || "",
    provider: "password",
  });
};

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const { addToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  // 👉 redirect where user came from
  const from = location.state?.from?.pathname || "/";

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const result = await loginUser(data.email, data.password);
      const user = result.user;

      // JWT
      await axios.post(
        `${API}/jwt`,
        { email: user.email },
        { withCredentials: true }
      );

      // Save user (optional but useful)
      await saveUserToDB(user);

      // ✅ SUCCESS TOAST
      addToast("🎉 Login successful! Welcome back!", "success");

      reset();

      // ✅ redirect to previous page
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);

    } catch (err) {
      console.error(err);

      let message = "Login failed ❌";

      if (err.code === "auth/user-not-found") {
        message = "No account found with this email!";
      } else if (err.code === "auth/wrong-password") {
        message = "Incorrect password!";
      } else if (err.code === "auth/invalid-email") {
        message = "Invalid email!";
      }

      addToast(message, "error");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-amber-100 px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">

        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Welcome Back 👋
        </h2>
        <p className="text-center text-gray-500 text-sm mt-1">
          Login to continue your journey
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">

          {/* Email */}
          <div>
            <label className="text-sm text-gray-600">Email</label>

            <div className="flex items-center border rounded-lg px-3 py-2 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
              <FaEnvelope className="text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                className="ml-2 w-full outline-none"
                {...register("email", { required: "Email is required" })}
              />
            </div>

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-600">Password</label>

            <div className="flex items-center border rounded-lg px-3 py-2 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
              <FaLock className="text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="ml-2 w-full outline-none"
                {...register("password", {
                  required: "Password is required",
                })}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 transition"
          >
            {loading && (
              <span className="loading loading-spinner loading-sm"></span>
            )}
            <FaSignInAlt />
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

       

        {/* Google Login */}
        <GoogleSignIn />

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-amber-600 font-medium hover:underline"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;