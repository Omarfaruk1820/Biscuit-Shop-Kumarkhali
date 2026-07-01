import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";

// ======================================================
// Component
// ======================================================

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
  // Local State
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
    formState: { errors, isSubmitting },
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

  // ======================================================
  // Redirect After AuthProvider Completes Authentication
  // ======================================================

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, {
        replace: true,
      });
    }
  }, [authLoading, user, navigate, from]);

  // ======================================================
  // Submit
  // ======================================================

  const onSubmit = async (formData) => {
    if (loading) return;

    setLoading(true);

    try {
      const name = formData.name.trim();

      const email = formData.email.trim().toLowerCase();

      // ==========================================
      // Create Firebase Account
      // ==========================================

      const credential = await createUser(email, formData.password);

      if (!credential?.user) {
        throw new Error("Unable to create user account.");
      }

      // ==========================================
      // Update Firebase Profile
      // ==========================================

      await updateUserProfile(name);

      // ==========================================
      // Refresh Current User
      // ==========================================

      await credential.user.reload();

      // ==========================================
      // Reset Form
      // ==========================================

      reset();

      // ==========================================
      // Success Message
      // ==========================================

      addToast("🎉 Registration completed successfully.", "success");

      // ==================================================
      // IMPORTANT
      //
      // AuthProvider will automatically:
      //
      // POST /users
      // POST /auth/jwt
      // GET /auth/me
      // Sync MongoDB
      // Sync Role
      // Create JWT Cookie
      // Redirect User
      // ==================================================
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      let message = "Registration failed. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          message = "This email address is already registered.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/weak-password":
          message = "Password must contain at least 6 characters.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;

        default:
          message = error?.response?.data?.message || error?.message || message;
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };
  // ======================================================
  // Register.jsx
  // Part 2
  // Responsive JSX
  // ======================================================

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-lg bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body p-6 md:p-8">
          {/* ====================================================== */}
          {/* Header */}
          {/* ====================================================== */}

          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              Create Account 🚀
            </h1>

            <p className="text-base-content/70">
              Create your Biscuit Shop account and start shopping today.
            </p>
          </div>

          {/* ====================================================== */}
          {/* Form */}
          {/* ====================================================== */}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 space-y-5"
          >
            {/* ====================================================== */}
            {/* Name */}
            {/* ====================================================== */}

            <div>
              <label htmlFor="name" className="label">
                <span className="label-text font-semibold">Full Name</span>
              </label>

              <input
                id="name"
                type="text"
                autoComplete="name"
                autoFocus
                disabled={loading || authLoading}
                aria-invalid={errors.name ? "true" : "false"}
                placeholder="Enter your full name"
                className={`input input-bordered w-full ${
                  errors.name ? "input-error" : ""
                }`}
                {...register("name")}
              />

              {errors.name && (
                <p className="text-error text-sm mt-2">{errors.name.message}</p>
              )}
            </div>

            {/* ====================================================== */}
            {/* Email */}
            {/* ====================================================== */}

            <div>
              <label htmlFor="email" className="label">
                <span className="label-text font-semibold">Email Address</span>
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={loading || authLoading}
                aria-invalid={errors.email ? "true" : "false"}
                placeholder="Enter your email address"
                className={`input input-bordered w-full ${
                  errors.email ? "input-error" : ""
                }`}
                {...register("email")}
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
              <label htmlFor="password" className="label">
                <span className="label-text font-semibold">Password</span>
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={loading || authLoading}
                aria-invalid={errors.password ? "true" : "false"}
                placeholder="Create a strong password"
                className={`input input-bordered w-full ${
                  errors.password ? "input-error" : ""
                }`}
                {...register("password")}
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
              <label htmlFor="confirmPassword" className="label">
                <span className="label-text font-semibold">
                  Confirm Password
                </span>
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={loading || authLoading}
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                placeholder="Confirm your password"
                className={`input input-bordered w-full ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
                {...register("confirmPassword")}
              />

              {errors.confirmPassword && (
                <p className="text-error text-sm mt-2">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* ====================================================== */}
            {/* Terms */}
            {/* ====================================================== */}

            <div>
              <label
                htmlFor="terms"
                className="label cursor-pointer justify-start gap-3"
              >
                <input
                  id="terms"
                  type="checkbox"
                  disabled={loading || authLoading}
                  className="checkbox checkbox-warning"
                  {...register("terms")}
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
            {/* Register Button */}
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

          <div className="divider my-7">OR</div>

          {/* ====================================================== */}
          {/* Google Login */}
          {/* ====================================================== */}

          <GoogleSignIn />

          {/* ====================================================== */}
          {/* Footer */}
          {/* ====================================================== */}

          <p className="text-center text-sm mt-7">
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
