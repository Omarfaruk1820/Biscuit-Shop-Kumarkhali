import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import axios from "axios";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSignIn from "./GoogleSign";

const API = import.meta.env.VITE_API_URL;

// ================= SAVE USER =================
const saveUserToDB = async (user) => {
  return axios.post(`${API}/users`, {
    name: user.displayName,
    email: user.email,
    photo: user.photoURL || "",
    provider: "password",
  });
};

const Register = () => {
  const { createUser } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // 🔥 Create user
      const result = await createUser(data.email, data.password);
      const user = result.user;

      // 🔥 Update profile
      await updateProfile(user, {
        displayName: data.name,
      });

      await user.reload();

      // 🔥 Get JWT
      await axios.post(
        `${API}/jwt`,
        { email: user.email },
        { withCredentials: true },
      );

      // 🔥 Save to DB
      await saveUserToDB(user);

      // ✅ SUCCESS TOAST
      addToast("🎉 Registration successful! Welcome!", "success");

      reset();

      // ✅ একটু delay দিয়ে redirect (UX better)
      setTimeout(() => {
        navigate("/", { replace: true }); // 👉 HOME PAGE
      }, 1200);
    } catch (err) {
      console.error(err);

      let message = "Registration failed ❌";

      if (err.code === "auth/email-already-in-use") {
        message = "Email already exists!";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters!";
      } else if (err.code === "auth/invalid-email") {
        message = "Invalid email address!";
      }

      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-amber-100 to-orange-200 px-4">
      <div className="w-full max-w-md mt-10 bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Create Account 🚀
        </h2>
        <p className="text-center text-gray-500 text-sm mt-1">
          Join with us today
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              {...register("email", {
                required: "Email is required",
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition duration-200 font-semibold flex justify-center items-center gap-2"
          >
            {loading && (
              <span className="loading loading-spinner loading-sm"></span>
            )}
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        {/* Google */}
        <GoogleSignIn />

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-amber-600 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
