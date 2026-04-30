import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { AuthContext } from "./AuthProvider";
import { useToast } from "../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

// ================= SAVE USER =================
const saveUserToDB = async (user) => {
  return axios.post(`${API}/users`, {
    name: user.displayName || "No Name",
    email: user.email,
    photo: user.photoURL || "",
    provider: "password",
  });
};

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const { addToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const result = await loginUser(data.email, data.password);
      const user = result.user;

      // JWT
      await axios.post(
        `${API}/jwt`,
        { email: user.email },
        { withCredentials: true }
      );

      // MongoDB save
      await saveUserToDB(user);

      addToast("Login successful 🎉", "success");

      reset();
      navigate(from, { replace: true });

    } catch (err) {
      console.error(err);
      addToast("Login failed ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 to-white">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-6">

        <h2 className="text-2xl font-bold text-center text-amber-600 mb-6">
          Login
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* EMAIL */}
          <div>
            <label>Email</label>
            <div className="flex items-center border px-3 py-2 rounded mt-1">
              <FaEnvelope />
              <input
                type="email"
                className="ml-2 w-full outline-none"
                {...register("email", { required: true })}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label>Password</label>
            <div className="flex items-center border px-3 py-2 rounded mt-1">
              <FaLock />
              <input
                type={showPassword ? "text" : "password"}
                className="ml-2 w-full outline-none"
                {...register("password", { required: true })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-amber-500 text-white py-2 rounded flex justify-center gap-2"
          >
            <FaSignInAlt />
            {loading ? "Logging..." : "Login"}
          </button>

        </form>

        <p className="text-center mt-4 text-sm">
          No account?{" "}
          <Link to="/register" className="text-amber-600">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;