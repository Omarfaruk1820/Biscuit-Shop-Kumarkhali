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

// ============================================================================
// CONFIG
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 50;

const REMEMBER_EMAIL_KEY = "remember-email";

// ============================================================================
// HELPERS
// ============================================================================

const getErrorMessage = (error) => {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.details;

  if (backendMessage) {
    return String(backendMessage);
  }

  switch (error?.code) {
    // Firebase authentication
    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Incorrect email or password.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/user-disabled":
      return "This Firebase account has been disabled.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    case "auth/too-many-requests":
      return "Too many login attempts. Please try again later.";

    case "auth/operation-not-allowed":
      return "Email and password login is currently disabled.";

    case "auth/invalid-api-key":
      return "Firebase configuration is invalid.";

    // Backend user/account errors
    case "user/not-found":
      return "Your account could not be found. Please register first.";

    case "user/blocked":
      return "Your account has been blocked.";

    case "user/inactive":
      return "Your account is currently inactive.";

    case "auth/email-mismatch":
      return "Your authentication email does not match your account.";

    case "auth/uid-mismatch":
      return "Your authentication identity does not match your account.";

    case "auth/firebase-authentication-failed":
      return "Firebase authentication failed. Please try again.";

    // JWT/session errors
    case "auth/session-failed":
      return "Unable to create your login session. Please try again.";

    case "auth/user-token-expired":
      return "Your Firebase session has expired. Please login again.";

    case "auth/requires-recent-login":
      return "Please login again to continue.";

    default:
      return error?.message || "Unable to login. Please try again.";
  }
};

const getRedirectPath = (location) => {
  const from = location?.state?.from;

  if (typeof from === "string" && from.startsWith("/")) {
    return from;
  }

  if (from?.pathname?.startsWith("/")) {
    return `${from.pathname}${from.search || ""}${from.hash || ""}`;
  }

  return null;
};

const getDashboardPath = (user) => {
  if (user?.role === "admin") {
    return "/dashboard/admin-dashboard";
  }

  if (user?.role === "user" || user?.role === "customer") {
    return "/dashboard/user-dashboard";
  }

  return "/";
};

// ============================================================================
// LOGIN COMPONENT
// ============================================================================

const Login = () => {
  const { user, loading: authLoading, loginUser } = useContext(AuthContext);

  const { addToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isSubmitting = loading || authLoading;

  // ==========================================================================
  // FORM
  // ==========================================================================

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

  const emailValue = watch("email");

  // ==========================================================================
  // LOAD REMEMBERED EMAIL
  // ==========================================================================

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

  // ==========================================================================
  // REDIRECT AUTHENTICATED USER
  // ==========================================================================

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const redirectPath = getRedirectPath(location);

    if (redirectPath) {
      navigate(redirectPath, {
        replace: true,
      });

      return;
    }

    navigate(getDashboardPath(user), {
      replace: true,
    });
  }, [user, authLoading, navigate, location]);

  // ==========================================================================
  // LOGIN SUBMIT
  // ==========================================================================

  const onSubmit = async (formData) => {
    if (isSubmitting) {
      return;
    }

    setLoading(true);

    try {
      const email = String(formData.email || "")
        .trim()
        .toLowerCase();

      const password = String(formData.password || "");

      // ----------------------------------------------------------------------
      // VALIDATION
      // ----------------------------------------------------------------------

      if (!email) {
        throw new Error("Email is required.");
      }

      if (!EMAIL_REGEX.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      if (password.length < PASSWORD_MIN_LENGTH) {
        throw new Error(
          `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
        );
      }

      if (password.length > PASSWORD_MAX_LENGTH) {
        throw new Error(
          `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters.`,
        );
      }

      // ----------------------------------------------------------------------
      // REMEMBER EMAIL
      // ----------------------------------------------------------------------

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

      // ----------------------------------------------------------------------
      // AUTH PROVIDER
      //
      // AuthProvider is responsible for:
      // - Firebase login
      // - Firebase ID token
      // - Backend user lookup
      // - JWT/session creation
      // - Application user creation
      // ----------------------------------------------------------------------

      const result = await loginUser(email, password);

      if (!result?.success) {
        throw new Error(result?.message || "Login could not be completed.");
      }

      // ----------------------------------------------------------------------
      // CLEAR PASSWORD
      // ----------------------------------------------------------------------

      reset({
        email: rememberMe ? email : "",
        password: "",
      });

      setShowPassword(false);

      // ----------------------------------------------------------------------
      // SUCCESS
      // ----------------------------------------------------------------------

      addToast(result?.message || "Login successful! Welcome back.", "success");

      // Navigation is intentionally handled by the authentication
      // redirect effect above after AuthProvider updates `user`.
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error?.response?.data || error?.message || error,
      );

      addToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FORGOT PASSWORD
  // ==========================================================================

  const handleForgotPassword = async () => {
    if (isSubmitting) {
      return;
    }

    const email = String(emailValue || "")
      .trim()
      .toLowerCase();

    if (!email) {
      addToast("Please enter your email address first.", "warning");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      addToast("Please enter a valid email address.", "warning");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

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

  // ==========================================================================
  // UI
  // ==========================================================================

  return (
    <div className="min-h-screen bg-base-200 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
          {/* ==================================================================
              HEADER
          ================================================================== */}

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

          {/* ==================================================================
              LOGIN FORM
          ================================================================== */}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 space-y-5"
          >
            {/* ------------------------------------------------------------------
                EMAIL
            ------------------------------------------------------------------ */}

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

            {/* ------------------------------------------------------------------
                PASSWORD
            ------------------------------------------------------------------ */}

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
                      value: PASSWORD_MIN_LENGTH,
                      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
                    },

                    maxLength: {
                      value: PASSWORD_MAX_LENGTH,
                      message: `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters.`,
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

            {/* ------------------------------------------------------------------
                REMEMBER ME + FORGOT PASSWORD
            ------------------------------------------------------------------ */}

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

            {/* ------------------------------------------------------------------
                LOGIN BUTTON
            ------------------------------------------------------------------ */}

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

          {/* ==================================================================
              GOOGLE LOGIN
          ================================================================== */}

          <div className="divider my-7">OR</div>

          <GoogleSign />

          {/* ==================================================================
              REGISTER
          ================================================================== */}

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

        {/* ====================================================================
            TERMS
        ==================================================================== */}

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
