import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";
import auth from "./firebase.config";

const Login = () => {
  // ==========================
  // Context
  // ==========================
  const { loginUser } = useContext(AuthContext);
  const { addToast } = useToast();

  // ==========================
  // Router
  // ==========================
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect after login
  const from = location.state?.from?.pathname || "/";

  // ==========================
  // Local State
  // ==========================
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ==========================
  // React Hook Form
  // ==========================
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  // ==========================
  // Remember Email
  // ==========================
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remember-email");

    if (rememberedEmail) {
      setValue("email", rememberedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  // ==========================
  // Login Handler
  // ==========================
  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const email = data.email.trim().toLowerCase();
      const password = data.password;

      await loginUser(email, password);

      // Remember Email
      if (rememberMe) {
        localStorage.setItem("remember-email", email);
      } else {
        localStorage.removeItem("remember-email");
      }

      addToast("🎉 Login successful! Welcome back.", "success");

      reset({
        email: rememberMe ? email : "",
        password: "",
      });

      navigate(from, {
        replace: true,
      });
    } catch (err) {
      console.error("Login Error:", err);

      let message = "Login failed.";

      switch (err.code) {
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;

        case "auth/wrong-password":
          message = "Incorrect password.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/invalid-credential":
          message = "Incorrect email or password.";
          break;

        case "auth/user-disabled":
          message = "This account has been disabled.";
          break;

        case "auth/too-many-requests":
          message = "Too many failed login attempts. Please try again later.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        default:
          message = err.message || "Unable to login.";
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Forgot Password
  // ==========================
  const handleForgotPassword = async () => {
    const email = watch("email")?.trim().toLowerCase();

    if (!email) {
      addToast("Please enter your email address first.", "warning");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      addToast(
        "Password reset email has been sent. Please check your inbox.",
        "success",
      );
    } catch (err) {
      console.error("Reset Password Error:", err);

      let message = "Unable to send password reset email.";

      switch (err.code) {
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        default:
          message = err.message || message;
      }

      addToast(message, "error");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10">
          {/* ==========================
              Header
          ========================== */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome Back 👋
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Login to continue your shopping journey
            </p>
          </div>

          {/* ==========================
              Login Form
          ========================== */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {/* ==========================
                Email
            ========================== */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all duration-300 hover:border-amber-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200">
                <FaEnvelope className="text-gray-400" />

                <input
                  id="email"
                  type="email"
                  spellCheck={false}
                  autoComplete="email"
                  disabled={loading}
                  placeholder="Enter your email"
                  className="ml-3 w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Please enter a valid email address",
                    },
                  })}
                />
              </div>

              {errors.email && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ==========================
                Password
            ========================== */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all duration-300 hover:border-amber-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200">
                <FaLock className="text-gray-400" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={loading}
                  placeholder="Enter your password"
                  className="ml-3 w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters long",
                    },
                  })}
                />

                <button
                  type="button"
                  tabIndex={0}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-2 text-gray-500 transition hover:text-amber-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ==========================
                Remember Me & Forgot Password
            ========================== */}
            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="checkbox checkbox-warning checkbox-sm"
                />

                <span className="text-gray-600">Remember me</span>
              </label>

              <button
                type="button"
                disabled={loading}
                onClick={handleForgotPassword}
                className="font-medium text-amber-600 transition hover:text-amber-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                Forgot Password?
              </button>
            </div>

            {/* ==========================
                Login Button
            ========================== */}
            <button
              type="submit"
              disabled={loading}
              className="btn h-12 w-full rounded-xl border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Logging in...
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  Login
                </>
              )}
            </button>
          </form>

          {/* ==========================
              Divider
          ========================== */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>

            <span className="px-4 text-sm font-medium text-gray-400">OR</span>

            <div className="flex-1 border-t border-gray-200"></div>
          </div>
          {/* ==========================
              Google Sign In
          ========================== */}
          <div className="mt-6">
            <GoogleSignIn />
          </div>

          {/* ==========================
              Register Link
          ========================== */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                state={{ from: location.state?.from }}
                className="font-semibold text-amber-600 transition hover:text-amber-700 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to our{" "}
          <Link
            to="/terms"
            className="font-medium text-amber-600 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="font-medium text-amber-600 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default Login;
