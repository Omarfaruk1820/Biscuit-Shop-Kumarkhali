import React from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <FaCheckCircle className="text-green-500 text-6xl mb-4" />

      <h1 className="text-2xl font-bold">Order Placed Successfully!</h1>

      <p className="text-gray-500 mt-2">
        Thank you for your purchase 🍪
      </p>

      <button
        onClick={() => navigate("/")}
        className="mt-6 bg-amber-500 text-white px-6 py-2 rounded"
      >
        Go Home
      </button>
    </div>
  );
};

export default Success;