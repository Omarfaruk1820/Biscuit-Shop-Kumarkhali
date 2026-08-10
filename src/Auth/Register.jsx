import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
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
import GoogleSignIn from "./GoogleSign";

const API = import.meta.env.VITE_API_URL;

const Register = () => {
  const { createUser, loading: authLoading } = useContext(AuthContext);

  const { addToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const isSubmitting = loading || authLoading;

  // =========================================================
  // REGISTER
  // =========================================================

  const onSubmit = async (formData) => {
    if (isSubmitting) return;

    if (!API) {
      addToast("API URL is not configured.", "error");
      return;
    }

    setLoading(true);

    try {
      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const passwordValue = formData.password;

      // =====================================================
      // 1. CREATE FIREBASE AUTH ACCOUNT
      // =====================================================

      const credential = await createUser(email, passwordValue);

      const firebaseUser = credential?.user;

      if (!firebaseUser) {
        throw new Error("Unable to create the authentication account.");
      }

      // =====================================================
      // 2. SAVE ALL APPLICATION USER INFORMATION
      //    TO MONGODB /users
      //
      //    IMPORTANT:
      //    Do NOT send role from frontend.
      //    Server automatically creates:
      //
      //    role: "user"
      //    status: "active"
      // =====================================================

      const userData = {
        name,
        email,
        photo: "",
        provider: "password",
        emailVerified: Boolean(firebaseUser.emailVerified),
      };

      const response = await axios.post(`${API}/users`, userData, {
        withCredentials: true,
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to save user information.",
        );
      }

      // =====================================================
      // 3. SUCCESS
      // =====================================================

      reset();

      addToast(
        "🎉 Registration successful! Welcome to Biscuit Shop.",
        "success",
      );

      // =====================================================
      // 4. REDIRECT
      // =====================================================

      const redirectPath = location.state?.from?.pathname || "/";

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      let message = "Registration failed.";

      switch (error?.code) {
        case "auth/email-already-in-use":
          message = "This email is already registered.";
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

        default:
          message = error?.response?.data?.message || error?.message || message;
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <FaUserPlus className="text-3xl text-warning" />
            </div>

            <h1 className="text-3xl font-bold">Create Account 🚀</h1>

            <p className="mt-2 text-base-content/70">
              Create your account and start shopping today.
            </p>
          </div>

          {/* =================================================
              FORM
          ================================================= */}

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

              <label
                className={`input input-bordered flex items-center gap-3 ${
                  errors.name ? "input-error" : ""
                }`}
              >
                <FaUser className="text-base-content/50" />

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
                      value: 3,
                      message: "Name must be at least 3 characters.",
                    },

                    maxLength: {
                      value: 50,
                      message: "Name cannot exceed 50 characters.",
                    },

                    validate: (value) =>
                      value.trim().length >= 3 || "Please enter a valid name.",
                  })}
                />
              </label>

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

              <label
                className={`input input-bordered flex items-center gap-3 ${
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

                    setValueAs: (value) => value.trim().toLowerCase(),
                  })}
                />
              </label>

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

              <label
                className={`input input-bordered flex items-center gap-3 ${
                  errors.password ? "input-error" : ""
                }`}
              >
                <FaLock className="text-base-content/50" />

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
                      value: 6,
                      message: "Password must be at least 6 characters.",
                    },

                    maxLength: {
                      value: 50,
                      message: "Password cannot exceed 50 characters.",
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
                  className="text-base-content/60 transition hover:text-warning"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </label>

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

              <label
                className={`input input-bordered flex items-center gap-3 ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
              >
                <FaLock className="text-base-content/50" />

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
                  className="text-base-content/60 transition hover:text-warning"
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
              </label>

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
                REGISTER BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-warning w-full"
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-sm" />
              )}

              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* =================================================
              GOOGLE LOGIN
          ================================================= */}

          <div className="divider my-7">OR</div>

          <GoogleSignIn />

          {/* =================================================
              LOGIN LINK
          ================================================= */}

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

        {/* =================================================
            FOOTER
        ================================================= */}

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
