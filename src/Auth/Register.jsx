import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import axios from "axios";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";
import GoogleSign from "./GoogleSign";

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

  // 🔐 SUBMIT
  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // ✅ 1. Create Firebase user
      const result = await createUser(data.email, data.password);

      // ✅ 2. Update profile
      await updateProfile(result.user, {
        displayName: data.name,
        photoURL: "https://i.ibb.co/4pDNDk1/avatar.png",
      });

      // ✅ 3. Refresh user (IMPORTANT FIX)
      await result.user.reload();

      // ✅ 4. Save user to DB (IMPORTANT for admin role later)
      await axios.post("http://localhost:5000/users", {
        name: data.name,
        email: data.email,
        role: "user", // default role
        createdAt: new Date(),
      });

      addToast("Account created successfully 🎉", "success");

      reset();

      // ✅ Redirect
      navigate("/");

    } catch (error) {
      console.error(error);
      addToast(error.message || "Registration failed ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 to-white px-4">

      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden">

        {/* LEFT */}
        <div className="hidden md:flex flex-col items-center justify-center bg-amber-500 text-white p-10">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
            alt="logo"
            className="w-24 mb-4"
          />
          <h2 className="text-3xl font-bold">Biscuit Shop</h2>
          <p className="text-center text-sm mt-2">
            Fresh biscuits delivered daily 🍪
          </p>
        </div>

        {/* RIGHT */}
        <div className="p-8">

          <h2 className="text-2xl font-bold text-amber-600 mb-6">
            Create Account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* NAME */}
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <div className="flex items-center border rounded px-3 py-2 mt-1">
                <FaUser className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full ml-2 outline-none"
                  {...register("name", {
                    required: "Name is required",
                  })}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center border rounded px-3 py-2 mt-1">
                <FaEnvelope className="text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full ml-2 outline-none"
                  {...register("email", {
                    required: "Email is required",
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="flex items-center border rounded px-3 py-2 mt-1">
                <FaLock className="text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full ml-2 outline-none"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Minimum 6 characters",
                    },
                  })}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <FaUserPlus />
              {loading ? "Creating..." : "Register"}
            </button>

            {/* GOOGLE */}
            <GoogleSign />

          </form>

          {/* FOOTER */}
          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-600 font-semibold">
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;