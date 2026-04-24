import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
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

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const result = await createUser(data.email, data.password);

      // ✅ update profile
      await updateProfile(result.user, {
        displayName: data.name,
        photoURL: "https://i.ibb.co/4pDNDk1/avatar.png",
      });

      // 🔥 important fix (refresh user)
      await result.user.reload();

      addToast("Account created successfully 🎉", "success");

      reset();

      navigate("/"); // ✅ go home after register

    } catch (error) {
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

            {/* Name */}
            <div>
              <label>Full Name</label>
              <div className="flex items-center border p-2 rounded">
                <FaUser />
                <input
                  className="w-full outline-none ml-2"
                  {...register("name", { required: "Name required" })}
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label>Email</label>
              <div className="flex items-center border p-2 rounded">
                <FaEnvelope />
                <input
                  className="w-full outline-none ml-2"
                  {...register("email", { required: "Email required" })}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label>Password</label>
              <div className="flex items-center border p-2 rounded">
                <FaLock />
                <input
                  type="password"
                  className="w-full outline-none ml-2"
                  {...register("password", {
                    required: "Password required",
                    minLength: { value: 6, message: "Min 6 chars" },
                  })}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={loading}
              className="w-full bg-amber-500 text-white py-2 rounded flex items-center justify-center gap-2"
            >
              <FaUserPlus />
              {loading ? "Creating..." : "Register"}
            </button>

            {/* Google */}
            <GoogleSign />

          </form>

          <p className="text-sm text-center mt-4">
            Already have account? <Link to="/login" className="text-amber-600">Login</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;