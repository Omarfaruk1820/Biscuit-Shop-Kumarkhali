import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaShoppingBag,
} from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Auth/AuthProvider";

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
    staleTime: 0,
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
      // 🔥 Backend already uses cart + user email
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

      await queryClient.invalidateQueries({ queryKey: ["cart"] });

      setForm({
        name: "",
        phone: "",
        address: "",
        city: "",
        zip: "",
        paymentMethod: "cod",
      });

      // 🔥 better UX delay
      setTimeout(() => {
        navigate("/success");
      }, 800);
    },

    onError: () => {
      setError("Order failed. Please try again.");
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

  if (isLoading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading checkout...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">

      {/* FORM */}
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

        <div className="bg-white p-6 mt-10 rounded-2xl shadow border">
          <h2 className="text-xl font-bold mb-4">
            🏠 Shipping Address
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name *"
              className="input"
            />

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone *"
              className="input"
            />

            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              className="input"
            />

            <input
              name="zip"
              value={form.zip}
              onChange={handleChange}
              placeholder="ZIP"
              className="input"
            />

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address *"
              className="input md:col-span-2"
            />
          </div>
        </div>

        {/* PAYMENT */}
        <div className="bg-white p-6 rounded-2xl shadow border">

          <h2 className="text-xl font-bold mb-4">
            💳 Payment Method
          </h2>

          <label className="flex items-center gap-3 p-3 border rounded-lg">
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
          <p className="text-red-500">{error}</p>
        )}
      </form>

      {/* SUMMARY */}
      <div className="bg-white p-6 mt-10 rounded-2xl shadow border">

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FaShoppingBag /> Order Summary
        </h2>

        <p>Subtotal: ৳{subtotal.toFixed(2)}</p>
        <p>Shipping: ৳{shipping}</p>

        <h3 className="text-xl font-bold text-amber-600 mt-3">
          Total: ৳{total.toFixed(2)}
        </h3>

        <button
          onClick={handleSubmit}
          disabled={orderMutation.isPending || !cart.length || isRedirecting}
          className="w-full mt-6 bg-amber-500 text-white py-3 rounded-xl disabled:opacity-60"
        >
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