import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import axios from "axios";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";

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
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const result = await createUser(data.email, data.password);
      const user = result.user;

      await updateProfile(user, {
        displayName: data.name,
      });

      await user.reload();

      // JWT
      await axios.post(
        `${API}/jwt`,
        { email: user.email },
        { withCredentials: true }
      );

      // MongoDB
      await saveUserToDB(user);

      addToast("Account created 🎉", "success");

      reset();
      navigate("/login");

    } catch (err) {
      console.error(err);
      addToast("Register failed ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-amber-100">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">

        <h2 className="text-xl font-bold text-center text-amber-600 mb-4">
          Register
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <input
            placeholder="Name"
            className="input input-bordered w-full"
            {...register("name", { required: true })}
          />

          <input
            placeholder="Email"
            className="input input-bordered w-full"
            {...register("email", { required: true })}
          />

          <input
            type="password"
            placeholder="Password"
            className="input input-bordered w-full"
            {...register("password", { required: true })}
          />

          <button className="btn bg-amber-500 text-white w-full">
            {loading ? "Creating..." : "Register"}
          </button>

        </form>

        <p className="text-sm text-center mt-4">
          Already have account?{" "}
          <Link to="/login" className="text-amber-600">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;