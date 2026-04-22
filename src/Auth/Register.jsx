import React from "react";
import { useForm } from "react-hook-form";
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastProvider";

const Register = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log("REGISTER DATA:", data);

    addToast("Account created successfully 🎉", "success");

    reset();

    setTimeout(() => {
      navigate("/login");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-white to-amber-200">

      {/* CONTAINER */}
      <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden">

        {/* LEFT SIDE (BRAND / IMAGE) */}
        <div className="hidden md:flex flex-col justify-center items-center bg-amber-500 text-white p-10">

          <img
            src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
            alt="biscuit"
            className="w-24 mb-4"
          />

          <h2 className="text-3xl font-bold mb-2">
            Biscuit Shop
          </h2>

          <p className="text-center text-sm opacity-90">
            Freshly baked happiness 🍪 delivered to your door.
            Join us and enjoy premium quality biscuits every day.
          </p>

        </div>

        {/* RIGHT SIDE (FORM) */}
        <div className="p-6 sm:p-8 md:p-10">

          {/* HEADER */}
          <div className="text-center md:text-left mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-600">
              Create Account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Start your biscuit journey today
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >

            {/* NAME */}
            <div>
              <label className="text-sm font-medium">
                Full Name
              </label>

              <div className="flex items-center border rounded-lg px-3 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
                <FaUser className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full p-2 outline-none text-sm sm:text-base"
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
              <label className="text-sm font-medium">
                Email
              </label>

              <div className="flex items-center border rounded-lg px-3 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
                <FaEnvelope className="text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-2 outline-none text-sm sm:text-base"
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
              <label className="text-sm font-medium">
                Password
              </label>

              <div className="flex items-center border rounded-lg px-3 mt-1 focus-within:ring-2 focus-within:ring-amber-400">
                <FaLock className="text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full p-2 outline-none text-sm sm:text-base"
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
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
            >
              <FaUserPlus /> Register
            </button>

          </form>

          {/* FOOTER */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-amber-600 font-semibold hover:underline"
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