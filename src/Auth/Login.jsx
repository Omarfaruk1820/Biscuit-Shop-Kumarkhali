import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { sendPasswordResetEmail } from "firebase/auth";

import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";

import auth from "./firebase.config";
import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";

const Login = () => {
  // ============================================================
  // AUTH CONTEXT
  // ============================================================

  const { loginUser, user, loading: authLoading } = useContext(AuthContext);

  // ============================================================
  // TOAST
  // ============================================================

  const { addToast } = useToast();

  // ============================================================
  // ROUTER
  // ============================================================

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // ============================================================
  // STATE
  // ============================================================

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isSubmitting = loading || authLoading;

  // ============================================================
  // FORM
  // ============================================================

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onChange",

    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ============================================================
  // LOAD REMEMBERED EMAIL
  // ============================================================

  useEffect(() => {
    try {
      const rememberedEmail = localStorage.getItem("remember-email");

      if (rememberedEmail) {
        setValue("email", rememberedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error("LOAD REMEMBERED EMAIL ERROR:", error);
    }
  }, [setValue]);

  // ============================================================
  // REDIRECT AFTER AUTHENTICATION
  //
  // Login
  //   ↓
  // Firebase
  //   ↓
  // AuthProvider
  //   ↓
  // MongoDB
  //   ↓
  // JWT Cookie
  //   ↓
  // /auth/me
  //   ↓
  // user
  //   ↓
  // redirect
  // ============================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      return;
    }

    navigate(from, {
      replace: true,
    });
  }, [user, authLoading, navigate, from]);

  // ============================================================
  // LOGIN SUBMIT
  // ============================================================

  const onSubmit = async (formData) => {
    if (loading || authLoading) {
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------------
      // NORMALIZE INPUT
      // --------------------------------------------------------

      const email = String(formData.email || "")
        .trim()
        .toLowerCase();

      const password = String(formData.password || "");

      // --------------------------------------------------------
      // EXTRA VALIDATION
      // --------------------------------------------------------

      if (!email) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      // --------------------------------------------------------
      // FIREBASE LOGIN
      //
      // AuthProvider will automatically handle:
      //
      // Firebase user
      //      ↓
      // /users
      //      ↓
      // /auth/jwt
      //      ↓
      // /auth/me
      //      ↓
      // application user
      // --------------------------------------------------------

      await loginUser(email, password);

      // --------------------------------------------------------
      // REMEMBER EMAIL
      // --------------------------------------------------------

      try {
        if (rememberMe) {
          localStorage.setItem("remember-email", email);
        } else {
          localStorage.removeItem("remember-email");
        }
      } catch (storageError) {
        console.error("REMEMBER EMAIL ERROR:", storageError);
      }

      // --------------------------------------------------------
      // RESET PASSWORD FIELD
      // --------------------------------------------------------

      reset({
        email: rememberMe ? email : "",
        password: "",
      });

      // --------------------------------------------------------
      // SUCCESS MESSAGE
      // --------------------------------------------------------

      addToast("Login successful! Welcome back.", "success");

      // --------------------------------------------------------
      // DO NOT NAVIGATE HERE
      //
      // AuthProvider updates `user`.
      // The useEffect above handles navigation.
      // --------------------------------------------------------
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      let message = "Unable to login.";

      switch (error?.code) {
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

        case "auth/operation-not-allowed":
          message = "Email and password login is currently disabled.";
          break;

        default:
          message =
            error?.response?.data?.message ||
            error?.message ||
            "Unable to login.";
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const handleForgotPassword = async () => {
    if (isSubmitting) {
      return;
    }

    const email = String(watch("email") || "")
      .trim()
      .toLowerCase();

    if (!email) {
      addToast("Please enter your email address first.", "warning");
      return;
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      addToast("Please enter a valid email address.", "warning");
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
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);

      let message = "Unable to send password reset email.";

      switch (error?.code) {
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

        case "auth/missing-email":
          message = "Please enter your email address.";
          break;

        default:
          message = error?.message || "Unable to send password reset email.";
      }

      addToast(message, "error");
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-base-200 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        {/* ======================================================
            LOGIN CARD
        ====================================================== */}

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <FaSignInAlt className="text-3xl text-warning" />
            </div>

            <h1 className="text-3xl font-bold">Welcome Back 👋</h1>

            <p className="mt-2 text-base-content/70">
              Login to your Biscuit Shop account
            </p>
          </div>

          {/* ====================================================
              LOGIN FORM
          ==================================================== */}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 space-y-5"
          >
            {/* ==================================================
                EMAIL
            ================================================== */}

            <div>
              <label htmlFor="email" className="label">
                <span className="label-text font-semibold">Email Address</span>
              </label>

              <div
                className={`input input-bordered flex w-full items-center gap-3 ${
                  errors.email ? "input-error" : ""
                }`}
              >
                <FaEnvelope className="text-base-content/50" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  disabled={isSubmitting}
                  placeholder="Enter your email"
                  className="grow bg-transparent outline-none"
                  {...register("email", {
                    required: "Email is required.",

                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email address.",
                    },

                    setValueAs: (value) => String(value).trim().toLowerCase(),
                  })}
                />
              </div>

              {errors.email && (
                <p className="mt-2 text-sm text-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <div>
              <label htmlFor="password" className="label">
                <span className="label-text font-semibold">Password</span>
              </label>

              <div
                className={`input input-bordered flex w-full items-center gap-3 ${
                  errors.password ? "input-error" : ""
                }`}
              >
                <FaLock className="text-base-content/50" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="text-base-content/60 transition hover:text-warning disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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

            {/* ==================================================
                REMEMBER ME + FORGOT PASSWORD
            ================================================== */}

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isSubmitting}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="checkbox checkbox-warning checkbox-sm"
                />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleForgotPassword}
                className="font-semibold text-warning transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Forgot Password?
              </button>
            </div>

            {/* ==================================================
                LOGIN BUTTON
            ================================================== */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-warning w-full"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Signing In...
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  Login
                </>
              )}
            </button>
          </form>

          {/* ====================================================
              DIVIDER
          ==================================================== */}

          <div className="divider my-7">OR</div>

          {/* ====================================================
              GOOGLE LOGIN
          ==================================================== */}

          <GoogleSignIn />

          {/* ====================================================
              REGISTER LINK
          ==================================================== */}

          <div className="mt-8 text-center">
            <p className="text-sm text-base-content/70">
              Don't have an account?{" "}
              <Link
                to="/register"
                state={{
                  from: location.state?.from,
                }}
                className="font-semibold text-warning transition hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* ======================================================
            TERMS
        ====================================================== */}

        <div className="mt-6 text-center text-xs text-base-content/60">
          By signing in, you agree to our{" "}
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
