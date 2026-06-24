// ==============================
// Cart.jsx (PART 1)
// Imports + Hooks + React Query
// ==============================

import React, { useContext, useMemo } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  FaTrash,
  FaPlus,
  FaMinus,
  FaArrowLeft,
  FaShoppingBag,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const Cart = () => {
  // ================= CONTEXT =================
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const email = user?.email;

  // ================= GET CART =================
  const {
    data: cartResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cart", email],
    enabled: !!email,

    queryFn: async () => {
      const res = await axios.get(`${API}/carts`, {
        withCredentials: true,
      });
      return res.data;
    },
  });

  const carts = cartResponse?.data || [];
  const summary = cartResponse?.summary || {
    totalItems: 0,
    totalQuantity: 0,
    totalPrice: 0,
  };

  // ================= REMOVE ITEM =================
  const removeMutation = useMutation({
    mutationFn: (id) =>
      axios.delete(`${API}/carts/${id}`, {
        withCredentials: true,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", email] });
      addToast("🗑️ Item removed", "success");
    },

    onError: (err) => {
      addToast(err.response?.data?.message || "Remove failed", "error");
    },
  });

  // ================= UPDATE QUANTITY =================
  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }) =>
      axios.patch(
        `${API}/carts/${id}`,
        { quantity },
        { withCredentials: true },
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", email] });
    },

    onError: (err) => {
      addToast(err.response?.data?.message || "Update failed", "error");
    },
  });

  // ================= HANDLERS =================
  const handleRemove = (id) => removeMutation.mutate(id);

  const handleIncrease = (item) =>
    updateMutation.mutate({
      id: item._id,
      quantity: item.quantity + 1,
    });

  const handleDecrease = (item) => {
    if (item.quantity <= 1) return;
    updateMutation.mutate({
      id: item._id,
      quantity: item.quantity - 1,
    });
  };
  return (
    <section className="max-w-6xl mx-auto p-4">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🛒 My Cart</h1>
          <p className="text-gray-500">Review your selected products</p>
        </div>

        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded flex items-center gap-2"
          >
            <FaArrowLeft />
            Back
          </button>

          <button
            onClick={() => navigate("/products")}
            className="px-4 py-2 bg-amber-500 text-white rounded flex items-center gap-2"
          >
            <FaShoppingBag />
            Shop More
          </button>
        </div>
      </div>

      {/* ================= LOADING ================= */}
      {isLoading && <p className="text-center py-10">Loading cart...</p>}

      {/* ================= ERROR ================= */}
      {isError && (
        <p className="text-center text-red-500 py-10">Failed to load cart</p>
      )}

      {/* ================= EMPTY CART ================= */}
      {!isLoading && carts.length === 0 && (
        <div className="text-center p-10 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">Cart is empty</h2>
          <button
            onClick={() => navigate("/products")}
            className="mt-4 bg-amber-500 text-white px-6 py-2 rounded"
          >
            Shop Now
          </button>
        </div>
      )}

      {/* ================= CART ITEMS ================= */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {carts.map((item) => (
            <div
              key={item._id}
              className="flex gap-4 bg-white p-4 rounded shadow"
            >
              {/* IMAGE */}
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-contain"
              />

              {/* INFO */}
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>

                <p className="text-gray-600">Price: ৳{item.finalPrice}</p>

                <p className="text-green-600 font-bold">
                  Subtotal: ৳{item.subtotal}
                </p>

                {/* QUANTITY */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => handleDecrease(item)}
                    className="p-2 border rounded"
                  >
                    <FaMinus />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => handleIncrease(item)}
                    className="p-2 border rounded"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* DELETE */}
              <button
                onClick={() => handleRemove(item._id)}
                className="text-red-500"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
        {/* ================= ORDER SUMMARY ================= */}
        <div className="bg-white p-6 rounded shadow h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>

          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>Total Items</span>
              <span>{summary.totalItems}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Quantity</span>
              <span>{summary.totalQuantity}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Price</span>
              <span>৳{summary.totalPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Delivery</span>
              <span>Free</span>
            </div>
          </div>

          <hr className="my-4" />

          {/* GRAND TOTAL */}
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>৳{summary.totalPrice.toFixed(2)}</span>
          </div>

          {/* CHECKOUT */}
          <button
            onClick={() => navigate("/checkout")}
            className="w-full mt-5 bg-amber-500 text-white py-3 rounded"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </section>
  );
};

export default Cart;
