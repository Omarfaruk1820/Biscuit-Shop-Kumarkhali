import { useContext, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";

import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaLock,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";

/* ==========================================================================
   CONFIG
========================================================================== */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 50;

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 50;

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

/* ==========================================================================
   COMPONENT
========================================================================== */

const Register = () => {
  const {
    createUser,
    signInWithGoogle,
    loading: authLoading,
  } = useContext(AuthContext);

  const { addToast } = useToast();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ------------------------------------------------------------------------
     FORM
  ------------------------------------------------------------------------ */

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

  const password = watch("password");

  const isSubmitting = loading || googleLoading || authLoading;

  /* ------------------------------------------------------------------------
     ERROR MESSAGE
  ------------------------------------------------------------------------ */

  const getErrorMessage = (error) => {
    const backendMessage =
      error?.response?.data?.message || error?.response?.data?.error;

    if (backendMessage) {
      return backendMessage;
    }

    switch (error?.code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please login instead.";

      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/weak-password":
        return "Password must be at least 6 characters.";

      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";

      case "auth/too-many-requests":
        return "Too many requests. Please try again later.";

      case "auth/operation-not-allowed":
        return "Email and password registration is currently disabled.";

      case "auth/user-disabled":
        return "This Firebase account has been disabled.";

      case "auth/quota-exceeded":
        return "Authentication quota has been exceeded. Please try again later.";

      case "auth/invalid-api-key":
        return "Firebase configuration is invalid.";

      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";

      case "auth/cancelled-popup-request":
        return "Google sign-in was cancelled.";

      case "auth/popup-blocked":
        return "The Google sign-in popup was blocked. Please allow popups and try again.";

      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";

      case "auth/credential-already-in-use":
        return "This Google account is already linked to another account.";

      case "auth/firebase-authentication-failed":
        return "Firebase authentication failed. Please try again.";

      case "auth/firebase-uid-missing":
        return "Firebase account information is incomplete.";

      case "auth/firebase-email-missing":
        return "Firebase account email is missing.";

      case "user/email-conflict":
        return "This Firebase account is linked to another email.";

      case "user/uid-conflict":
        return "This Firebase account is already linked to another account.";

      case "user/duplicate":
        return "An account with this information already exists.";

      case "user/create-failed":
        return "Unable to create your account. Please try again.";

      case "auth/user-token-expired":
        return "Your authentication session expired. Please try again.";

      case "auth/requires-recent-login":
        return "Please login again to continue.";

      default:
        return error?.message || "Authentication failed. Please try again.";
    }
  };

  /* ------------------------------------------------------------------------
     EMAIL/PASSWORD REGISTER
  ------------------------------------------------------------------------ */

  const onSubmit = async (formData) => {
    if (isSubmitting) {
      return;
    }

    setLoading(true);

    try {
      const name = String(formData.name || "").trim();

      const email = String(formData.email || "")
        .trim()
        .toLowerCase();

      const passwordValue = String(formData.password || "");

      /* --------------------------------------------------------------------
         EXTRA VALIDATION
      -------------------------------------------------------------------- */

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

      if (!STRONG_PASSWORD_REGEX.test(passwordValue)) {
        throw new Error(
          "Password must include uppercase, lowercase, and at least one number.",
        );
      }

      if (passwordValue !== formData.confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (!formData.terms) {
        throw new Error(
          "You must accept the Terms & Conditions and Privacy Policy.",
        );
      }

      /* --------------------------------------------------------------------
         CREATE EMAIL ACCOUNT

         AuthProvider handles:
         1. Firebase registration
         2. Firebase profile update
         3. MongoDB user creation
         4. Email verification
         5. Keeping Firebase session active
      -------------------------------------------------------------------- */

      const result = await createUser(email, passwordValue, name);

      if (!result?.success) {
        throw new Error(
          result?.message || "Registration could not be completed.",
        );
      }

      /* --------------------------------------------------------------------
         RESET FORM
      -------------------------------------------------------------------- */

      reset({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      setShowPassword(false);
      setShowConfirmPassword(false);

      /* --------------------------------------------------------------------
         SUCCESS TOAST
      -------------------------------------------------------------------- */

      const successMessage = result?.verificationSent
        ? "Account created successfully. A verification email has been sent."
        : "Account created successfully. Welcome!";

      addToast(successMessage, "success");

      /* --------------------------------------------------------------------
         REDIRECT HOME

         The user remains authenticated.
      -------------------------------------------------------------------- */

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error?.response?.data || error?.message || error,
      );

      addToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------
     GOOGLE SIGN-IN / REGISTRATION
  ------------------------------------------------------------------------ */

  const handleGoogleSignIn = async () => {
    if (isSubmitting) {
      return;
    }

    if (!formDataTermsAccepted()) {
      return;
    }

    setGoogleLoading(true);

    try {
      /* --------------------------------------------------------------------
         AuthProvider handles:

         1. Google popup
         2. Firebase authentication
         3. MongoDB user create/get
         4. User validation
         5. Application user state
      -------------------------------------------------------------------- */

      const result = await signInWithGoogle();

      if (!result?.success) {
        throw new Error(
          result?.message || "Google sign-in could not be completed.",
        );
      }

      /* --------------------------------------------------------------------
         SUCCESS MESSAGE
      -------------------------------------------------------------------- */

      const successMessage = result?.isNewUser
        ? "Google account created successfully. Welcome!"
        : "Google sign-in successful. Welcome back!";

      addToast(successMessage, "success");

      /* --------------------------------------------------------------------
         REDIRECT HOME

         User is already authenticated.
      -------------------------------------------------------------------- */

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "GOOGLE REGISTER ERROR:",
        error?.response?.data || error?.message || error,
      );

      /*
       * The AuthProvider already treats popup cancellation specially.
       * We don't need to show an error toast when the user simply closes
       * the Google popup.
       */

      const cancelled =
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request";

      if (!cancelled) {
        addToast(getErrorMessage(error), "error");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ------------------------------------------------------------------------
     TERMS CHECK FOR GOOGLE

     Google users don't need the email/password fields, but your registration
     page still requires accepting your Terms & Conditions and Privacy Policy.
  ------------------------------------------------------------------------ */

  const formDataTermsAccepted = () => {
    const termsCheckbox = document.getElementById("terms");

    if (!termsCheckbox?.checked) {
      addToast(
        "Please accept the Terms & Conditions and Privacy Policy first.",
        "error",
      );

      return false;
    }

    return true;
  };

  /* ==========================================================================
     UI
  ========================================================================== */

  return (
    <div className="min-h-screen bg-base-200 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
          {/* ----------------------------------------------------------------
             HEADER
          ---------------------------------------------------------------- */}

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

          {/* ----------------------------------------------------------------
             REGISTER FORM
          ---------------------------------------------------------------- */}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 space-y-5"
          >
            {/* --------------------------------------------------------------
               NAME
            -------------------------------------------------------------- */}

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

                    validate: (value) => {
                      const trimmed = String(value).trim();

                      return (
                        trimmed.length >= NAME_MIN_LENGTH ||
                        `Name must be at least ${NAME_MIN_LENGTH} characters.`
                      );
                    },
                  })}
                />
              </div>

              {errors.name && (
                <p className="mt-2 text-sm text-error">{errors.name.message}</p>
              )}
            </div>

            {/* --------------------------------------------------------------
               EMAIL
            -------------------------------------------------------------- */}

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

            {/* --------------------------------------------------------------
               PASSWORD
            -------------------------------------------------------------- */}

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
                      value: STRONG_PASSWORD_REGEX,
                      message:
                        "Include uppercase, lowercase, and at least one number.",
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

            {/* --------------------------------------------------------------
               CONFIRM PASSWORD
            -------------------------------------------------------------- */}

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
                    <FaEyeSlash size={18} aria-hidden="true" />
                  ) : (
                    <FaEye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* --------------------------------------------------------------
               TERMS
            -------------------------------------------------------------- */}

            <div>
              <label
                htmlFor="terms"
                className="flex cursor-pointer items-start gap-3"
              >
                <input
                  id="terms"
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

            {/* --------------------------------------------------------------
               EMAIL REGISTER BUTTON
            -------------------------------------------------------------- */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-warning w-full"
            >
              {loading ? (
                <>
                  <span
                    className="loading loading-spinner loading-sm"
                    aria-hidden="true"
                  />

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

          {/* ----------------------------------------------------------------
             DIVIDER
          ---------------------------------------------------------------- */}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-base-300" />

            <span className="text-sm text-base-content/50">OR</span>

            <div className="h-px flex-1 bg-base-300" />
          </div>

          {/* ----------------------------------------------------------------
             GOOGLE REGISTER / SIGN-IN
          ---------------------------------------------------------------- */}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="btn btn-outline w-full"
          >
            {googleLoading ? (
              <>
                <span
                  className="loading loading-spinner loading-sm"
                  aria-hidden="true"
                />

                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <FaGoogle aria-hidden="true" />

                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* ----------------------------------------------------------------
             LOGIN
          ---------------------------------------------------------------- */}

          <div className="mt-7 text-center">
            <p className="text-sm text-base-content/70">
              Already have an account?{" "}
              <Link to="/login" className="link link-warning font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------------
           FOOTER
        ------------------------------------------------------------------ */}

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
