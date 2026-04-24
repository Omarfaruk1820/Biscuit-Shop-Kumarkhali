import React, { useContext, useState } from "react";
import axios from "axios";
import {
  FaCreditCard,
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

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const email = user?.email?.toLowerCase()?.trim();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    paymentMethod: "cod",
  });

  // ================= FETCH CART =================
  const { data: cart = [], isLoading } = useQuery({
    queryKey: ["cart", email],
    enabled: !!email,
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:5000/cart?email=${email}`
      );
      return res.data?.data || [];
    },
  });

  // ================= PRICE CALC =================
  const getPrice = (item) => {
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    return price - (price * discount) / 100;
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + getPrice(item) * item.quantity,
    0
  );

  const shipping = cart.length > 0 ? 50 : 0;
  const total = subtotal + shipping;

  // ================= ORDER MUTATION =================
  const orderMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        "http://localhost:5000/orders",
        {
          email,
          customer: form,
          items: cart,
          total,
        }
      );
      return res.data;
    },

    onSuccess: async () => {
      // 🔥 REFRESH CART (NO MANUAL STATE)
      await queryClient.invalidateQueries({
        queryKey: ["cart", email],
      });

      // 👉 GO SUCCESS PAGE
      navigate("/success");
    },
  });

  // ================= HANDLE SUBMIT =================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.address) {
      alert("Please fill required fields ❌");
      return;
    }

    if (!cart.length) {
      alert("Cart is empty 🛒");
      return;
    }

    orderMutation.mutate();
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading checkout...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">

      {/* ================= LEFT FORM ================= */}
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

        {/* SHIPPING */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">
            🏠 Shipping Address
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Full Name *"
              className="border p-2 rounded w-full"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              placeholder="Phone *"
              className="border p-2 rounded w-full"
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />

            <input
              placeholder="City"
              className="border p-2 rounded w-full"
              onChange={(e) =>
                setForm({ ...form, city: e.target.value })
              }
            />

            <input
              placeholder="ZIP"
              className="border p-2 rounded w-full"
              onChange={(e) =>
                setForm({ ...form, zip: e.target.value })
              }
            />

            <textarea
              placeholder="Full Address *"
              className="border p-2 rounded md:col-span-2 w-full"
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />
          </div>
        </div>

        {/* PAYMENT */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">
            💳 Payment Method
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
              <input
                type="radio"
                checked={form.paymentMethod === "cod"}
                onChange={() =>
                  setForm({ ...form, paymentMethod: "cod" })
                }
              />
              <FaMoneyBillWave /> Cash on Delivery
            </label>

            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
              <input
                type="radio"
                checked={form.paymentMethod === "stripe"}
                onChange={() =>
                  setForm({ ...form, paymentMethod: "stripe" })
                }
              />
              <FaCreditCard /> Online Payment
            </label>
          </div>
        </div>
      </form>

      {/* ================= RIGHT SUMMARY ================= */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow h-fit">

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FaShoppingBag /> Order Summary
        </h2>

        {/* ITEMS */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center">
              Cart is empty
            </p>
          ) : (
            cart.map((item) => {
              const final = getPrice(item);

              return (
                <div
                  key={item._id}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    ৳{(final * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* TOTAL */}
        <div className="border-t mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>৳{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Shipping</span>
            <span>৳{shipping}</span>
          </div>

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-amber-600">
              ৳{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={orderMutation.isPending}
          className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {orderMutation.isPending
            ? "Processing..."
            : "Place Order 🚀"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;