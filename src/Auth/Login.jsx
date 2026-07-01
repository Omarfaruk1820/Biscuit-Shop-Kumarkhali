// ======================================================
// Login.jsx
// Part 1
// Imports, Hooks, AuthContext, Redirect Logic,
// Remember Me, Validation, onSubmit,
// Forgot Password, Error Handling
// ======================================================

import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { sendPasswordResetEmail } from "firebase/auth";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
} from "react-icons/fa";

import auth from "./firebase.config";
import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";

// ======================================================
// Component
// ======================================================

const Login = () => {
  // ======================================================
  // Context
  // ======================================================

  const { user, loading: authLoading, loginUser } = useContext(AuthContext);

  const { addToast } = useToast();

  // ======================================================
  // Router
  // ======================================================

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // ======================================================
  // Local State
  // ======================================================

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ======================================================
  // React Hook Form
  // ======================================================

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ======================================================
  // Remember Me
  // ======================================================

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remember-email");

    if (rememberedEmail) {
      setValue("email", rememberedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  // ======================================================
  // Redirect After AuthProvider Completes Login
  // ======================================================

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, {
        replace: true,
      });
    }
  }, [user, authLoading, navigate, from]);

  // ======================================================
  // Login Handler
  // ======================================================

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const email = data.email.trim().toLowerCase();
      const password = data.password;

      // Firebase Login
      await loginUser(email, password);

      // Remember Email
      if (rememberMe) {
        localStorage.setItem("remember-email", email);
      } else {
        localStorage.removeItem("remember-email");
      }

      // AuthProvider will:
      // POST /users
      // POST /auth/jwt
      // GET /auth/me
      // setUser()
      // setRole()
      // Redirect happens inside useEffect()

      addToast("🎉 Login successful!", "success");
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      let message = "Unable to login.";

      switch (err.code) {
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;

        case "auth/wrong-password":
          message = "Incorrect password.";
          break;

        case "auth/invalid-credential":
          message = "Incorrect email or password.";
          break;

        case "auth/user-disabled":
          message = "This account has been disabled.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "auth/too-many-requests":
          message = "Too many login attempts. Please try again later.";
          break;

        default:
          message = err.message || message;
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Forgot Password
  // ======================================================

  const handleForgotPassword = async () => {
    const email = watch("email")?.trim().toLowerCase();

    if (!email) {
      addToast("Please enter your email address first.", "warning");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
      });

      addToast(
        "Password reset email has been sent. Please check your inbox.",
        "success",
      );
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);

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

        case "auth/too-many-requests":
          message = "Too many requests. Please try again later.";
          break;

        default:
          message = err.message || message;
      }

      addToast(message, "error");
    }
  };

  // ======================================================
  // Part 2 starts below...
  // ======================================================
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body p-8">
            {/* ====================================================== */}
            {/* Header */}
            {/* ====================================================== */}

            <div className="text-center">
              <h1 className="text-3xl font-bold text-base-content">
                Welcome Back 👋
              </h1>

              <p className="mt-2 text-base-content/70">
                Login to your Biscuit Shop account
              </p>
            </div>

            {/* ====================================================== */}
            {/* Login Form */}
            {/* ====================================================== */}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              {/* ====================================================== */}
              {/* Email */}
              {/* ====================================================== */}

              <div>
                <label htmlFor="email" className="label">
                  <span className="label-text font-medium">Email Address</span>
                </label>

                <div
                  className={`input input-bordered flex items-center gap-3 w-full ${
                    errors.email ? "input-error" : ""
                  }`}
                >
                  <FaEnvelope className="text-base-content/50" />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    disabled={loading || authLoading}
                    placeholder="Enter your email"
                    className="grow bg-transparent outline-none"
                    {...register("email", {
                      required: "Email is required.",

                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address.",
                      },
                    })}
                  />
                </div>

                {errors.email && (
                  <p className="mt-2 text-sm text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* ====================================================== */}
              {/* Password */}
              {/* ====================================================== */}

              <div>
                <label htmlFor="password" className="label">
                  <span className="label-text font-medium">Password</span>
                </label>

                <div
                  className={`input input-bordered flex items-center gap-3 w-full ${
                    errors.password ? "input-error" : ""
                  }`}
                >
                  <FaLock className="text-base-content/50" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={loading || authLoading}
                    placeholder="Enter your password"
                    className="grow bg-transparent outline-none"
                    {...register("password", {
                      required: "Password is required.",

                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters.",
                      },

                      maxLength: {
                        value: 50,
                        message: "Password cannot exceed 50 characters.",
                      },
                    })}
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading || authLoading}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-base-content/60 hover:text-warning transition"
                  >
                    {showPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-2 text-sm text-error">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* ====================================================== */}
              {/* Remember Me + Forgot Password */}
              {/* ====================================================== */}

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-warning checkbox-sm"
                    checked={rememberMe}
                    disabled={loading || authLoading}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />

                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  disabled={loading || authLoading}
                  onClick={handleForgotPassword}
                  className="font-medium text-warning hover:underline disabled:opacity-60"
                >
                  Forgot Password?
                </button>
              </div>

              {/* ====================================================== */}
              {/* Login Button */}
              {/* ====================================================== */}

              <button
                type="submit"
                disabled={loading || authLoading}
                className="btn btn-warning w-full"
              >
                {(loading || authLoading) && (
                  <span className="loading loading-spinner loading-sm"></span>
                )}

                {loading || authLoading ? (
                  "Signing In..."
                ) : (
                  <>
                    <FaSignInAlt />
                    Login
                  </>
                )}
              </button>
            </form>

            {/* ====================================================== */}
            {/* Divider */}
            {/* ====================================================== */}

            <div className="divider my-6">OR</div>

            {/* ====================================================== */}
            {/* Google Sign In */}
            {/* ====================================================== */}

            <GoogleSignIn />

            {/* ====================================================== */}
            {/* Register */}
            {/* ====================================================== */}

            <div className="mt-6 text-center">
              <p className="text-sm">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  state={{ from: location.state?.from }}
                  className="link link-warning font-semibold"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* Footer */}
        {/* ====================================================== */}

        <div className="mt-6 text-center text-xs text-base-content/60">
          By signing in you agree to our{" "}
          <Link to="/terms" className="link link-warning">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="link link-warning">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
};

export default Login;
