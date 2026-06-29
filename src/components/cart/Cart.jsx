import React, { useContext } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaTrash,
  FaPlus,
  FaMinus,
  FaArrowLeft,
  FaShoppingBag,
  FaTruck,
  FaShieldAlt,
  FaCreditCard,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const Cart = () => {
  const { user, loading } = useContext(AuthContext);
  const { addToast } = useToast();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const email = user?.email;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["cart", email],
    enabled: !!email && !loading,

    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,

    queryFn: async () => {
      const res = await axios.get(`${API}/carts`, {
        withCredentials: true,
      });

      return res.data;
    },
  });

  const carts = data?.data || [];

  const summary = data?.summary || {
    totalItems: 0,
    totalQuantity: 0,
    totalPrice: 0,
  };

  // ======================
  // DELETE ITEM
  // ======================

  const removeMutation = useMutation({
    mutationFn: (id) =>
      axios.delete(`${API}/carts/${id}`, {
        withCredentials: true,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart", email],
      });

      addToast("Item removed successfully", "success");
    },
  });

  // ======================
  // UPDATE QUANTITY
  // ======================

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }) =>
      axios.patch(
        `${API}/carts/${id}`,
        { quantity },
        {
          withCredentials: true,
        },
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart", email],
      });
    },
  });

  const handleIncrease = (item) => {
    updateMutation.mutate({
      id: item._id,
      quantity: item.quantity + 1,
    });
  };

  const handleDecrease = (item) => {
    if (item.quantity <= 1) return;

    updateMutation.mutate({
      id: item._id,
      quantity: item.quantity - 1,
    });
  };

  const handleRemove = (id) => {
    removeMutation.mutate(id);
  };

  // ======================
  // LOADING
  // ======================

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-warning"></span>
      </div>
    );
  }

  // ======================
  // ERROR
  // ======================

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h2 className="text-red-500 text-xl">
          {error?.message || "Failed to load cart"}
        </h2>
      </div>
    );
  }

  // ======================
  // EMPTY CART
  // ======================

  if (!carts.length) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center bg-white rounded-3xl shadow p-10">
          <div className="text-7xl mb-5">🛒</div>

          <h2 className="text-3xl font-bold">Your Cart is Empty</h2>

          <p className="text-gray-500 mt-3">Add some products and come back.</p>

          <button
            onClick={() => navigate("/products")}
            className="btn btn-warning text-white mt-6"
          >
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }
  console.log("USER:", user);
console.log("EMAIL:", email);
console.log("CART RESPONSE:", data);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Shopping Cart</h1>

          <p className="text-gray-500 mt-2">{summary.totalItems} Items</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <FaArrowLeft />
            Back
          </button>

          <button
            onClick={() => navigate("/products")}
            className="btn btn-warning text-white"
          >
            <FaShoppingBag />
            Shop More
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* CART ITEMS */}

        <div className="lg:col-span-2 space-y-4">
          {carts.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border shadow-sm p-4"
            >
              <div className="flex flex-col md:flex-row gap-5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-32 h-32 object-contain mx-auto md:mx-0"
                />

                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.name}</h3>

                  <p className="text-gray-500 mt-2">
                    Price: ৳{item.finalPrice}
                  </p>

                  <p className="text-green-600 font-bold">
                    Subtotal: ৳{item.subtotal}
                  </p>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => handleDecrease(item)}
                      className="btn btn-sm btn-outline"
                    >
                      <FaMinus />
                    </button>

                    <span className="font-bold">{item.quantity}</span>

                    <button
                      onClick={() => handleIncrease(item)}
                      className="btn btn-sm btn-outline"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(item._id)}
                  className="btn btn-circle btn-error btn-outline"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* SUMMARY */}

        <div>
          <div className="sticky top-24 bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-5">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Items</span>
                <span>{summary.totalItems}</span>
              </div>

              <div className="flex justify-between">
                <span>Total Quantity</span>
                <span>{summary.totalQuantity}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>

              <hr />

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>

                <span>৳{Number(summary.totalPrice).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="btn btn-warning text-white w-full mt-6"
            >
              Proceed To Checkout
            </button>

            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaTruck />
                Free Shipping
              </div>

              <div className="flex items-center gap-2">
                <FaShieldAlt />
                Secure Shopping
              </div>

              <div className="flex items-center gap-2">
                <FaCreditCard />
                Safe Payment
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cart;
