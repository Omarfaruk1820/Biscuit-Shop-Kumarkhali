import { useContext, useEffect, useState } from "react";

import { sendPasswordResetEmail } from "firebase/auth";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";

import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";

import { auth } from "./firebase.config";
import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSign from "./GoogleSign";

// ============================================================
// CONSTANTS
// ============================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 50;

const REMEMBER_EMAIL_KEY = "remember-email";

// ============================================================
// LOGIN
// ============================================================

const Login = () => {
  // ==========================================================
  // AUTH CONTEXT
  // ==========================================================

  const { user, loading: authLoading, loginUser } = useContext(AuthContext);

  // ==========================================================
  // TOAST
  // ==========================================================

  const { addToast } = useToast();

  // ==========================================================
  // ROUTER
  // ==========================================================

  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ==========================================================
  // FORM
  // ==========================================================

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

  // ==========================================================
  // FORM VALUES
  // ==========================================================

  const emailValue = watch("email");

  // ==========================================================
  // SUBMITTING
  // ==========================================================

  const isSubmitting = loading || authLoading;

  // ==========================================================
  // LOAD REMEMBERED EMAIL
  // ==========================================================

  useEffect(() => {
    try {
      const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);

      if (!rememberedEmail) {
        return;
      }

      setValue("email", rememberedEmail);
      setRememberMe(true);
    } catch (error) {
      console.error("LOAD REMEMBERED EMAIL ERROR:", error?.message || error);
    }
  }, [setValue]);

  // ==========================================================
  // GET REDIRECT PATH
  // ==========================================================

  const getRedirectPath = () => {
    const from = location.state?.from;

    // --------------------------------------------
    // String path
    // --------------------------------------------

    if (typeof from === "string" && from.startsWith("/")) {
      return from;
    }

    // --------------------------------------------
    // Location object
    // --------------------------------------------

    if (from?.pathname) {
      return `${from.pathname}` + `${from.search || ""}` + `${from.hash || ""}`;
    }

    // --------------------------------------------
    // Default
    // --------------------------------------------

    return "/";
  };

  // ==========================================================
  // REDIRECT AFTER AUTHENTICATION
  // ==========================================================

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const destination = getRedirectPath();

    navigate(destination, {
      replace: true,
    });
  }, [user, authLoading, location.state, navigate]);

  // ==========================================================
  // LOGIN SUBMIT
  // ==========================================================

  const onSubmit = async (formData) => {
    if (isSubmitting) {
      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // NORMALIZE INPUT
      // ======================================================

      const email = String(formData.email || "")
        .trim()
        .toLowerCase();

      const password = String(formData.password || "");

      // ======================================================
      // EXTRA VALIDATION
      // ======================================================

      if (!email) {
        throw new Error("Email is required.");
      }

      if (!EMAIL_REGEX.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        );
      }

      if (password.length > MAX_PASSWORD_LENGTH) {
        throw new Error(
          `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`,
        );
      }

      // ======================================================
      // REMEMBER EMAIL
      // ======================================================

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch (storageError) {
        console.error(
          "REMEMBER EMAIL ERROR:",
          storageError?.message || storageError,
        );
      }

      // ======================================================
      // LOGIN
      // ======================================================
      //
      // AuthProvider handles:
      //
      // signInWithEmailAndPassword()
      //          ↓
      // Firebase authentication
      //          ↓
      // Firebase ID token
      //          ↓
      // POST /auth/jwt
      //          ↓
      // HTTP-only application cookie
      //          ↓
      // GET /auth/me
      //          ↓
      // AuthContext user
      //
      // Login.jsx does NOT call these endpoints directly.
      //
      // ======================================================

      const authenticatedUser = await loginUser(email, password);

      if (!authenticatedUser) {
        throw new Error("Login could not be completed.");
      }

      // ======================================================
      // CLEAR PASSWORD FIELD
      // ======================================================

      reset({
        email: rememberMe ? email : "",
        password: "",
      });

      setShowPassword(false);

      // ======================================================
      // SUCCESS
      // ======================================================

      addToast("Login successful! Welcome back.", "success");

      // ======================================================
      // IMPORTANT
      // ======================================================
      //
      // Do not navigate here.
      //
      // AuthProvider updates `user`.
      // The redirect effect above handles navigation.
      //
      // ======================================================
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error?.response?.data || error?.message || error,
      );

      // ======================================================
      // ERROR MESSAGE
      // ======================================================

      let message = "Unable to login. Please try again.";

      // ======================================================
      // FIREBASE AUTH ERRORS
      // ======================================================

      switch (error?.code) {
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;

        case "auth/wrong-password":
          message = "Incorrect email or password.";
          break;

        case "auth/invalid-credential":
          message = "Incorrect email or password.";
          break;

        case "auth/invalid-login-credentials":
          message = "Incorrect email or password.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/user-disabled":
          message = "This Firebase account has been disabled.";
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

        case "auth/invalid-api-key":
          message = "Firebase configuration is invalid.";
          break;

        // ====================================================
        // BACKEND EMAIL VERIFICATION
        // ====================================================

        case "auth/email-not-verified":
          message = "Please verify your email address before logging in.";
          break;

        // ====================================================
        // BACKEND USER ERRORS
        // ====================================================

        case "user/not-found":
          message = "Your account could not be found. Please register first.";
          break;

        case "user/blocked":
          message = "Your account has been blocked.";
          break;

        // ====================================================
        // SESSION ERRORS
        // ====================================================

        case "auth/user-token-expired":
          message = "Your Firebase session has expired. Please login again.";
          break;

        case "auth/requires-recent-login":
          message = "Please login again to continue.";
          break;

        default:
          message = error?.response?.data?.message || error?.message || message;
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  const handleForgotPassword = async () => {
    if (isSubmitting) {
      return;
    }

    const email = String(emailValue || "")
      .trim()
      .toLowerCase();

    // ========================================================
    // EMAIL REQUIRED
    // ========================================================

    if (!email) {
      addToast("Please enter your email address first.", "warning");

      return;
    }

    // ========================================================
    // EMAIL VALIDATION
    // ========================================================

    if (!EMAIL_REGEX.test(email)) {
      addToast("Please enter a valid email address.", "warning");

      return;
    }

    try {
      // ======================================================
      // FIREBASE PASSWORD RESET
      // ======================================================

      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      // ======================================================
      // SUCCESS
      // ======================================================

      addToast(
        "Password reset email has been sent. Please check your inbox.",
        "success",
      );
    } catch (error) {
      console.error("PASSWORD RESET ERROR:", error?.message || error);

      let message = "Unable to send password reset email.";

      switch (error?.code) {
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/missing-email":
          message = "Please enter your email address.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "auth/too-many-requests":
          message = "Too many requests. Please try again later.";
          break;

        case "auth/unauthorized-continue-uri":
          message =
            "The password reset redirect URL is not authorized in Firebase.";
          break;

        case "auth/operation-not-allowed":
          message = "Password reset is currently unavailable.";
          break;

        default:
          message = error?.response?.data?.message || error?.message || message;
      }

      addToast(message, "error");
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-base-200 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        {/* ==================================================
            LOGIN CARD
        ================================================== */}

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <FaSignInAlt
                className="text-3xl text-warning"
                aria-hidden="true"
              />
            </div>

            <h1 className="text-3xl font-bold">Welcome Back 👋</h1>

            <p className="mt-2 text-base-content/70">
              Login to your Biscuit Shop account
            </p>
          </div>

          {/* ==================================================
              LOGIN FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 space-y-5"
          >
            {/* =================================================
                EMAIL
            ================================================= */}

            <div>
              <label htmlFor="email" className="label">
                <span className="label-text font-semibold">Email Address</span>
              </label>

              <div
                className={`input input-bordered flex w-full items-center gap-3 ${
                  errors.email ? "input-error" : ""
                }`}
              >
                <FaEnvelope
                  className="text-base-content/50"
                  aria-hidden="true"
                />

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
                      value: EMAIL_REGEX,
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

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div>
              <label htmlFor="password" className="label">
                <span className="label-text font-semibold">Password</span>
              </label>

              <div
                className={`input input-bordered flex w-full items-center gap-3 ${
                  errors.password ? "input-error" : ""
                }`}
              >
                <FaLock className="text-base-content/50" aria-hidden="true" />

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
                      value: MIN_PASSWORD_LENGTH,
                      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
                    },

                    maxLength: {
                      value: MAX_PASSWORD_LENGTH,
                      message: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`,
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
                    <FaEyeSlash size={18} aria-hidden="true" />
                  ) : (
                    <FaEye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-sm text-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* =================================================
                REMEMBER + FORGOT PASSWORD
            ================================================= */}

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

            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-warning w-full"
            >
              {isSubmitting ? (
                <>
                  <span
                    className="loading loading-spinner loading-sm"
                    aria-hidden="true"
                  />

                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <FaSignInAlt aria-hidden="true" />

                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* ==================================================
              GOOGLE LOGIN
          ================================================== */}

          <div className="divider my-7">OR</div>

          <GoogleSign />

          {/* ==================================================
              REGISTER
          ================================================== */}

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

        {/* ==================================================
            TERMS
        ================================================== */}

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
