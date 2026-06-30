// ======================================================
// Register.jsx
// Part 1
// Imports + Hooks + Validation + onSubmit()
// ======================================================

import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";

const Register = () => {
  // ======================================================
  // Context
  // ======================================================

  const {
    user,
    loading: authLoading,
    createUser,
    updateUserProfile,
  } = useContext(AuthContext);

  const { addToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  // ======================================================
  // Local Loading
  // ======================================================

  const [loading, setLoading] = useState(false);

  // ======================================================
  // Redirect Path
  // ======================================================

  const from = location.state?.from?.pathname || "/";

  // ======================================================
  // React Hook Form
  // ======================================================

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
  });

  const password = watch("password");

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
  // Submit
  // ======================================================

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const name = data.name.trim();

      const email = data.email.trim().toLowerCase();

      // ==========================================
      // Create Firebase User
      // ==========================================

      const result = await createUser(email, data.password);

      if (!result?.user) {
        throw new Error("User registration failed.");
      }

      // ==========================================
      // Update Firebase Profile
      // ==========================================

      await updateUserProfile(name);

      // Refresh Firebase User

      await result.user.reload();

      // ==========================================
      // Reset Form
      // ==========================================

      reset();

      // ==========================================
      // Success Message
      // ==========================================

      addToast("🎉 Registration Successful!", "success");

      // No navigate here.
      // AuthProvider will automatically redirect
      // after JWT cookie is created.
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      let message = "Registration failed.";

      switch (err.code) {
        case "auth/email-already-in-use":
          message = "This email is already registered.";
          break;

        case "auth/weak-password":
          message = "Password should contain at least 6 characters.";
          break;

        case "auth/invalid-email":
          message = "Invalid email address.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;

        default:
          message = err.message || "Something went wrong.";
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // JSX Starts (Part 2)
  // ======================================================
  // ======================================================
  // JSX
  // ======================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-10">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body">
          {/* ====================================================== */}
          {/* Header */}
          {/* ====================================================== */}

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Create Account 🚀</h1>

            <p className="text-base-content/70">
              Create your Biscuit Shop account and start shopping today.
            </p>
          </div>

          {/* ====================================================== */}
          {/* Form */}
          {/* ====================================================== */}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {/* ====================================================== */}
            {/* Full Name */}
            {/* ====================================================== */}

            <div>
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                className={`input input-bordered w-full ${
                  errors.name ? "input-error" : ""
                }`}
                {...register("name", {
                  required: "Full Name is required",

                  minLength: {
                    value: 3,
                    message: "Minimum 3 characters required.",
                  },

                  maxLength: {
                    value: 50,
                    message: "Maximum 50 characters allowed.",
                  },
                })}
              />

              {errors.name && (
                <p className="text-error text-sm mt-2">{errors.name.message}</p>
              )}
            </div>
            {/* ====================================================== */}
            {/* Email */}
            {/* ====================================================== */}

            <div>
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>

              <input
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                className={`input input-bordered w-full ${
                  errors.email ? "input-error" : ""
                }`}
                {...register("email", {
                  required: "Email is required.",

                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address.",
                  },
                })}
              />

              {errors.email && (
                <p className="text-error text-sm mt-2">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ====================================================== */}
            {/* Password */}
            {/* ====================================================== */}

            <div>
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>

              <input
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                className={`input input-bordered w-full ${
                  errors.password ? "input-error" : ""
                }`}
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
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
                    message:
                      "Password must contain uppercase, lowercase, number and special character.",
                  },
                })}
              />

              {errors.password && (
                <p className="text-error text-sm mt-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ====================================================== */}
            {/* Confirm Password */}
            {/* ====================================================== */}

            <div>
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>

              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                className={`input input-bordered w-full ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
                {...register("confirmPassword", {
                  required: "Please confirm your password.",

                  validate: (value) =>
                    value === password || "Passwords do not match.",
                })}
              />

              {errors.confirmPassword && (
                <p className="text-error text-sm mt-2">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            {/* ====================================================== */}
            {/* Terms & Conditions */}
            {/* ====================================================== */}

            <div>
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-warning"
                  {...register("terms", {
                    required: "You must accept the Terms & Conditions.",
                  })}
                />

                <span className="text-sm leading-6">
                  I agree to the{" "}
                  <Link to="/terms" className="link link-warning font-semibold">
                    Terms & Conditions
                  </Link>
                </span>
              </label>

              {errors.terms && (
                <p className="text-error text-sm mt-2">
                  {errors.terms.message}
                </p>
              )}
            </div>

            {/* ====================================================== */}
            {/* Submit Button */}
            {/* ====================================================== */}

            <button
              type="submit"
              disabled={loading || authLoading}
              className="btn btn-warning w-full"
            >
              {(loading || authLoading) && (
                <span className="loading loading-spinner loading-sm"></span>
              )}

              {loading || authLoading
                ? "Creating Account..."
                : "Create Account"}
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
          {/* Login Link */}
          {/* ====================================================== */}

          <p className="text-center text-sm mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="link link-warning font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
