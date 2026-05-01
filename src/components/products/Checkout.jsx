import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaShoppingBag,
} from "react-icons/fa";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

// ================= FETCH CART =================
const fetchCart = async () => {
  const res = await axios.get(`${API}/carts`, {
    withCredentials: true,
  });
  return res.data;
};

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [form, setForm] = useState({
    name: user?.displayName || "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    paymentMethod: "cod",
  });

  // ================= CART =================
  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: !!user,
  });

  const cart = data?.data || [];

  // ================= SAFE REDIRECT =================
  useEffect(() => {
    if (!isLoading && user && cart.length === 0 && !isRedirecting) {
      navigate("/cart");
    }
  }, [cart, isLoading, user, navigate, isRedirecting]);

  // ================= PRICE =================
  const getPrice = (item) => {
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    return price - (price * discount) / 100;
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + getPrice(item) * item.quantity,
    0
  );

  const shipping = cart.length ? 50 : 0;
  const total = subtotal + shipping;

  // ================= MUTATION =================
  const orderMutation = useMutation({
    mutationFn: async () => {
      return axios.post(
        `${API}/orders`,
        {
          customer: form,
        },
        { withCredentials: true }
      );
    },

    onSuccess: async () => {
      setIsRedirecting(true);

      addToast("🎉 Order placed successfully!", "success");

      await queryClient.invalidateQueries({ queryKey: ["cart"] });

      setForm({
        name: "",
        phone: "",
        address: "",
        city: "",
        zip: "",
        paymentMethod: "cod",
      });

      setTimeout(() => {
        navigate("/success");
      }, 1000);
    },

    onError: () => {
      setError("Order failed. Please try again.");
      addToast("Order failed ❌", "error");
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (orderMutation.isPending || isRedirecting) return;

    if (!form.name || !form.phone || !form.address) {
      setError("Please fill required fields");
      return;
    }

    if (!cart.length) {
      setError("Cart is empty");
      return;
    }

    orderMutation.mutate();
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg text-amber-500"></span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid lg:grid-cols-3 gap-6">

      {/* ================= FORM ================= */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-2 space-y-6"
      >

        {/* SHIPPING */}
        <div className="bg-white p-5 md:p-6 mt-10 rounded-2xl shadow border">
          <h2 className="text-lg md:text-xl font-bold mb-4">
            🏠 Shipping Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name *"
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
            />

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone *"
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
            />

            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
            />

            <input
              name="zip"
              value={form.zip}
              onChange={handleChange}
              placeholder="ZIP"
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
            />

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address *"
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none md:col-span-2"
            />
          </div>
        </div>

        {/* PAYMENT */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow border">
          <h2 className="text-lg md:text-xl font-bold mb-4">
            💳 Payment Method
          </h2>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={form.paymentMethod === "cod"}
              onChange={handleChange}
            />
            <FaMoneyBillWave /> Cash on Delivery
          </label>
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </form>

      {/* ================= SUMMARY ================= */}
      <div className="bg-white p-5 md:p-6 rounded-2xl mt-10 shadow border h-fit">

        <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <FaShoppingBag /> Order Summary
        </h2>

        <div className="space-y-2 text-sm md:text-base text-gray-600">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>৳{subtotal.toFixed(2)}</span>
          </p>

          <p className="flex justify-between">
            <span>Shipping</span>
            <span>৳{shipping}</span>
          </p>

          <hr />

          <p className="flex justify-between text-lg font-bold text-amber-600">
            <span>Total</span>
            <span>৳{total.toFixed(2)}</span>
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            orderMutation.isPending ||
            !cart.length ||
            isRedirecting
          }
          className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60 flex justify-center items-center gap-2"
        >
          {orderMutation.isPending && (
            <span className="loading loading-spinner loading-sm"></span>
          )}
          {orderMutation.isPending
            ? "Processing..."
            : isRedirecting
            ? "Redirecting..."
            : "Place Order"}
        </button>

      </div>
    </div>
  );
};

export default Checkout;