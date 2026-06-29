import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";

const Register = () => {
  const { createUser, updateUserProfile } = useContext(AuthContext);

  const { addToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
  });

  // Watch password for confirm password validation
  const password = watch("password");

  // ===============================
  // Submit
  // ===============================
  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const name = data.name.trim();
      const email = data.email.trim().toLowerCase();

      // Create Firebase User
      await createUser(email, data.password);

      // Update Firebase Profile
      await updateUserProfile(name, "");

      addToast("🎉 Registration Successful!", "success");

      reset();

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      console.error(err);

      let message = "Registration Failed";

      switch (err.code) {
        case "auth/email-already-in-use":
          message = "Email already exists.";
          break;

        case "auth/weak-password":
          message = "Password is too weak.";
          break;

        case "auth/invalid-email":
          message = "Invalid email address.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please try again.";
          break;

        default:
          message = err.message;
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-xl p-8">
        {/* Header */}

        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account 🚀</h1>

          <p className="text-gray-500 mt-2">
            Join us today and start shopping.
          </p>
        </div>

        {/* Form */}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          {/* Name */}

          <div>
            <input
              type="text"
              autoComplete="name"
              placeholder="Full Name"
              className="input input-bordered w-full"
              {...register("name", {
                required: "Full Name is required",
                minLength: {
                  value: 3,
                  message: "Minimum 3 characters",
                },
              })}
            />

            {errors.name && (
              <p className="text-error text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}

          <div>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email Address"
              className="input input-bordered w-full"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
            />

            {errors.email && (
              <p className="text-error text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}

          <div>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Password"
              className="input input-bordered w-full"
              {...register("password", {
                required: "Password is required",

                minLength: {
                  value: 6,
                  message: "Minimum 6 characters",
                },

                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                  message: "Must contain uppercase, lowercase and number",
                },
              })}
            />

            {errors.password && (
              <p className="text-error text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}

          <div>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm Password"
              className="input input-bordered w-full"
              {...register("confirmPassword", {
                required: "Confirm Password is required",

                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />

            {errors.confirmPassword && (
              <p className="text-error text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms */}

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-warning"
              {...register("terms", {
                required: "You must accept Terms & Conditions",
              })}
            />

            <span className="text-sm">
              I agree to the
              <Link
                to="/terms"
                className="text-warning font-semibold ml-1 hover:underline"
              >
                Terms & Conditions
              </Link>
            </span>
          </label>

          {errors.terms && (
            <p className="text-error text-sm">{errors.terms.message}</p>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-warning w-full"
          >
            {loading && (
              <span className="loading loading-spinner loading-sm"></span>
            )}

            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Google */}

        <div className="my-6">
          <GoogleSignIn />
        </div>

        {/* Footer */}

        <p className="text-center text-sm">
          Already have an account?
          <Link
            to="/login"
            className="ml-2 text-warning font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
