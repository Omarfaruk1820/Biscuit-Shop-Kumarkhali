import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
} from "react-icons/fa";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";

const Register = () => {
  // =====================================================
  // Context
  // =====================================================

  const {
    createUser,
    updateUserProfile,
    user,
    role,
    loading: authLoading,
  } = useContext(AuthContext);

  const { addToast } = useToast();

  // =====================================================
  // Router
  // =====================================================

  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // Local State
  // =====================================================

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // =====================================================
  // React Hook Form
  // =====================================================

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

  // =====================================================
  // Redirect After Registration
  // AuthProvider controls user & role
  // =====================================================

  useEffect(() => {
    if (authLoading) return;

    if (!user || !role) return;

    if (role === "admin") {
      navigate("/", {
        replace: true,
      });
    } else {
      navigate("/", {
        replace: true,
      });
    }
  }, [user, role, authLoading, navigate]);

  const onSubmit = async (data) => {
    if (loading) return;

    setLoading(true);

    try {
      const name = data.name.trim();

      const email = data.email.trim().toLowerCase();

      const password = data.password;

      // Firebase Register
      const credential = await createUser(email, password);

      // Update Firebase Profile
      await updateUserProfile(name);

      // Refresh Firebase User
      await credential.user.reload();

      reset();

      addToast("🎉 Registration successful! Redirecting...", "success");

      // Do NOT navigate here.
      // AuthProvider will update user & role.
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      let message = "Registration failed.";

      switch (error.code) {
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
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* ===================================================== */}
        {/* Card */}
        {/* ===================================================== */}

        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body p-8">
            {/* ===================================================== */}
            {/* Header */}
            {/* ===================================================== */}

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                <FaUserPlus className="text-3xl text-warning" />
              </div>

              <h1 className="text-3xl font-bold">Create Account 🚀</h1>

              <p className="mt-2 text-base-content/70">
                Create your account and start shopping today.
              </p>
            </div>

            {/* ===================================================== */}
            {/* Register Form */}
            {/* ===================================================== */}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="mt-8 space-y-5"
            >
              {/* ===================================================== */}
              {/* Full Name */}
              {/* ===================================================== */}

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
                    disabled={loading || authLoading}
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
                    })}
                  />
                </label>

                {errors.name && (
                  <p className="mt-2 text-sm text-error">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* ===================================================== */}
              {/* Email */}
              {/* ===================================================== */}

              <div>
                <label htmlFor="email" className="label">
                  <span className="label-text font-semibold">
                    Email Address
                  </span>
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
                </label>

                {errors.email && (
                  <p className="mt-2 text-sm text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* ===================================================== */}
              {/* Password */}
              {/* ===================================================== */}

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
                    disabled={loading || authLoading}
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
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading || authLoading}
                    className="text-base-content/60 hover:text-warning transition"
                    aria-label={
                      showPassword ? "Hide Password" : "Show Password"
                    }
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

              {/* ===================================================== */}
              {/* Confirm Password */}
              {/* ===================================================== */}

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
                    disabled={loading || authLoading}
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
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={loading || authLoading}
                    className="text-base-content/60 hover:text-warning transition"
                    aria-label={
                      showConfirmPassword ? "Hide Password" : "Show Password"
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

              {/* ===================================================== */}
              {/* Terms */}
              {/* ===================================================== */}

              <div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    disabled={loading || authLoading}
                    className="checkbox checkbox-warning mt-1"
                    {...register("terms", {
                      required: "You must accept the Terms & Conditions.",
                    })}
                  />

                  <span className="text-sm leading-6">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="link link-warning font-semibold"
                    >
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

              {/* ===================================================== */}
              {/* Register Button */}
              {/* ===================================================== */}

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

            {/* ===================================================== */}
            {/* Divider */}
            {/* ===================================================== */}

            <div className="divider my-7">OR</div>

            {/* ===================================================== */}
            {/* Google Sign In */}
            {/* ===================================================== */}

            <GoogleSignIn />

            {/* ===================================================== */}
            {/* Login Link */}
            {/* ===================================================== */}

            <div className="mt-7 text-center">
              <p className="text-sm">
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

        {/* ===================================================== */}
        {/* Footer */}
        {/* ===================================================== */}

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
