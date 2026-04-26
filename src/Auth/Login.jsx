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
import { useToast } from "../context/ToastProvider";
import { AuthContext } from "./AuthProvider";
import GoogleSign from "./GoogleSign";
import axios from "axios";

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // 🔐 LOGIN + JWT
  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // ✅ Firebase login
      const result = await loginUser(data.email, data.password);

      const user = result.user;

      // 🔥 IMPORTANT: Send email to backend for JWT
      await axios.post(
        "http://localhost:5000/jwt",
        { email: user.email },
        { withCredentials: true } // ✅ MUST
      );

      addToast("Login successful 🎉", "success");

      reset();

      // ✅ redirect
      navigate(from, { replace: true });

    } catch (error) {
      console.log(error);

      const message =
        error?.message || "Invalid email or password ❌";

      addToast(message, "error");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-white to-amber-200">

      {/* CONTAINER */}
      <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden">

        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-center items-center bg-amber-500 text-white p-10">

          <img
            src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
            alt="biscuit"
            className="w-24 mb-4"
          />

          <h2 className="text-3xl font-bold mb-2">
            Biscuit Shop
          </h2>

          <p className="text-center text-sm opacity-90">
            Freshly baked biscuits 🍪 with love and quality.
            Login to continue your delicious journey.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-6 sm:p-8 md:p-10">

          {/* HEADER */}
          <div className="text-center md:text-left mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-600">
              Welcome Back 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Login to your account
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium">Email</label>

              <div className="flex items-center border rounded-lg px-3 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
                <FaEnvelope className="text-gray-400" />

                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-2 outline-none"
                  {...register("email", {
                    required: "Email is required",
                  })}
                />
              </div>

              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium">Password</label>

              <div className="flex items-center border rounded-lg px-3 mt-1 focus-within:ring-2 focus-within:ring-amber-400">

                <FaLock className="text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full p-2 outline-none"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Minimum 6 characters",
                    },
                  })}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 ml-2"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60"
            >
              <FaSignInAlt />
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* GOOGLE */}
            <GoogleSign />

          </form>

          {/* FOOTER */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-amber-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;