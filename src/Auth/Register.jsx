import { useContext, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";

import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";

import { AuthContext } from "./AuthProvider";

import { useToast } from "../context/ToastProvider";

import GoogleSign from "./GoogleSign";

// ============================================================
// CONSTANTS
// ============================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 50;

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 50;

// ============================================================
// REGISTER
// ============================================================

const Register = () => {
  // ==========================================================
  // AUTH
  // ==========================================================

  const { createUser, loading: authLoading } = useContext(AuthContext);

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==========================================================
  // FORM
  // ==========================================================

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onChange",

    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  // ==========================================================
  // PASSWORD
  // ==========================================================

  const password = watch("password");

  // ==========================================================
  // SUBMIT STATE
  // ==========================================================

  const isSubmitting = loading || authLoading;

  // ==========================================================
  // REDIRECT PATH
  // ==========================================================

  const getRedirectPath = () => {
    const from = location.state?.from;

    if (typeof from === "string" && from.startsWith("/")) {
      return from;
    }

    if (from?.pathname) {
      return `${from.pathname}` + `${from.search || ""}` + `${from.hash || ""}`;
    }

    return "/";
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const onSubmit = async (formData) => {
    if (isSubmitting) {
      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // CLEAN INPUT
      // ======================================================

      const name = String(formData.name || "").trim();

      const email = String(formData.email || "")
        .trim()
        .toLowerCase();

      const passwordValue = String(formData.password || "");

      // ======================================================
      // EXTRA VALIDATION
      // ======================================================

      if (!name) {
        throw new Error("Full name is required.");
      }

      if (name.length < NAME_MIN_LENGTH) {
        throw new Error(`Name must be at least ${NAME_MIN_LENGTH} characters.`);
      }

      if (name.length > NAME_MAX_LENGTH) {
        throw new Error(`Name cannot exceed ${NAME_MAX_LENGTH} characters.`);
      }

      if (!email) {
        throw new Error("Email is required.");
      }

      if (!EMAIL_REGEX.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!passwordValue) {
        throw new Error("Password is required.");
      }

      if (passwordValue.length < PASSWORD_MIN_LENGTH) {
        throw new Error(
          `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
        );
      }

      if (passwordValue.length > PASSWORD_MAX_LENGTH) {
        throw new Error(
          `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters.`,
        );
      }

      // ======================================================
      // CREATE ACCOUNT
      //
      // AuthProvider handles:
      //
      // Firebase registration
      //        ↓
      // Firebase profile
      //        ↓
      // POST /auth/register
      //        ↓
      // POST /auth/jwt
      //        ↓
      // HTTP-only JWT cookie
      //        ↓
      // setUser()
      //
      // Firebase user remains signed in.
      // ======================================================

      const result = await createUser(email, passwordValue, name);

      // ======================================================
      // CHECK RESULT
      // ======================================================

      if (!result?.success) {
        throw new Error(
          result?.message || "Registration could not be completed.",
        );
      }

      // ======================================================
      // RESET FORM
      // ======================================================

      reset();

      setShowPassword(false);
      setShowConfirmPassword(false);

      // ======================================================
      // SUCCESS TOAST
      // ======================================================

      addToast(
        result?.message || "Registration successful! Welcome to our store.",
        "success",
      );

      // ======================================================
      // REDIRECT
      //
      // Register
      //    ↓
      // Automatically Logged In
      //    ↓
      // Home
      // ======================================================

      navigate(getRedirectPath(), {
        replace: true,
      });
    } catch (error) {
      // ======================================================
      // DEBUG
      // ======================================================

      console.error(
        "REGISTER ERROR:",
        error?.response?.data || error?.message || error,
      );

      // ======================================================
      // DEFAULT ERROR
      // ======================================================

      let message = "Registration failed. Please try again.";

      // ======================================================
      // FIREBASE ERRORS
      // ======================================================

      switch (error?.code) {
        case "auth/email-already-in-use":
          message = "This email is already registered. Please login instead.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/weak-password":
          message = "Password must be at least 6 characters.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "auth/too-many-requests":
          message = "Too many requests. Please try again later.";
          break;

        case "auth/operation-not-allowed":
          message = "Email and password registration is currently disabled.";
          break;

        case "auth/user-disabled":
          message = "This Firebase account has been disabled.";
          break;

        case "auth/quota-exceeded":
          message =
            "Authentication quota has been exceeded. Please try again later.";
          break;

        case "auth/invalid-api-key":
          message =
            "Firebase configuration is invalid. Please contact support.";
          break;

        // ====================================================
        // BACKEND ERRORS
        // ====================================================

        case "auth/firebase-authentication-failed":
          message = "Firebase authentication failed. Please try again.";
          break;

        case "auth/firebase-uid-missing":
          message = "Firebase account information is incomplete.";
          break;

        case "auth/firebase-email-missing":
          message = "Firebase account email is missing.";
          break;

        case "user/email-conflict":
          message = "This Firebase account is linked to another email.";
          break;

        case "user/uid-conflict":
          message = "This email is already linked to another account.";
          break;

        case "user/duplicate":
          message = "An account with this information already exists.";
          break;

        case "user/create-failed":
          message = "Unable to create your account. Please try again.";
          break;

        case "auth/session-failed":
          message =
            "Your account was created, but the login session could not be created. Please try logging in.";
          break;

        default:
          message = error?.response?.data?.message || error?.message || message;
      }

      // ======================================================
      // ERROR TOAST
      // ======================================================

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-base-200 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        {/* ==================================================
            REGISTER CARD
        ================================================== */}

        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <FaUserPlus
                className="text-3xl text-warning"
                aria-hidden="true"
              />
            </div>

            <h1 className="text-3xl font-bold">Create Account</h1>

            <p className="mt-2 text-base-content/70">
              Create your account and start shopping today.
            </p>
          </div>

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 space-y-5"
          >
            {/* =================================================
                NAME
            ================================================= */}

            <div>
              <label htmlFor="name" className="label">
                <span className="label-text font-semibold">Full Name</span>
              </label>

              <div
                className={`input input-bordered flex items-center gap-3 ${
                  errors.name ? "input-error" : ""
                }`}
              >
                <FaUser className="text-base-content/50" aria-hidden="true" />

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  disabled={isSubmitting}
                  placeholder="Enter your full name"
                  className="grow bg-transparent outline-none"
                  {...register("name", {
                    required: "Full name is required.",

                    minLength: {
                      value: NAME_MIN_LENGTH,
                      message: `Name must be at least ${NAME_MIN_LENGTH} characters.`,
                    },

                    maxLength: {
                      value: NAME_MAX_LENGTH,
                      message: `Name cannot exceed ${NAME_MAX_LENGTH} characters.`,
                    },

                    validate: (value) =>
                      String(value).trim().length >= NAME_MIN_LENGTH ||
                      "Please enter a valid name.",
                  })}
                />
              </div>

              {errors.name && (
                <p className="mt-2 text-sm text-error">{errors.name.message}</p>
              )}
            </div>

            {/* =================================================
                EMAIL
            ================================================= */}

            <div>
              <label htmlFor="email" className="label">
                <span className="label-text font-semibold">Email Address</span>
              </label>

              <div
                className={`input input-bordered flex items-center gap-3 ${
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
                className={`input input-bordered flex items-center gap-3 ${
                  errors.password ? "input-error" : ""
                }`}
              >
                <FaLock className="text-base-content/50" aria-hidden="true" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  placeholder="Create a strong password"
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

                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                      message: "Include uppercase, lowercase and one number.",
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

            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <div>
              <label htmlFor="confirmPassword" className="label">
                <span className="label-text font-semibold">
                  Confirm Password
                </span>
              </label>

              <div
                className={`input input-bordered flex items-center gap-3 ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
              >
                <FaLock className="text-base-content/50" aria-hidden="true" />

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  placeholder="Confirm your password"
                  className="grow bg-transparent outline-none"
                  {...register("confirmPassword", {
                    required: "Please confirm your password.",

                    validate: (value) =>
                      value === password || "Passwords do not match.",
                  })}
                />

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  className="text-base-content/60 transition hover:text-warning disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* =================================================
                TERMS
            ================================================= */}

            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  disabled={isSubmitting}
                  className="checkbox checkbox-warning mt-1"
                  {...register("terms", {
                    required: "You must accept the Terms & Conditions.",
                  })}
                />

                <span className="text-sm leading-6">
                  I agree to the{" "}
                  <Link to="/terms" className="link link-warning font-semibold">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="link link-warning font-semibold"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {errors.terms && (
                <p className="mt-2 text-sm text-error">
                  {errors.terms.message}
                </p>
              )}
            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-warning w-full"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />

                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <FaUserPlus aria-hidden="true" />

                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* ==================================================
              GOOGLE
          ================================================== */}

          <div className="divider my-7">OR</div>

          <GoogleSign />

          {/* ==================================================
              LOGIN
          ================================================== */}

          <div className="mt-7 text-center">
            <p className="text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                state={{
                  from: location.state?.from,
                }}
                className="link link-warning font-semibold"
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-6 text-center text-xs text-base-content/60">
          By creating an account, you agree to our{" "}
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

export default Register;
