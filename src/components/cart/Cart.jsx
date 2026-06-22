import React, { useContext } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaTrash, FaArrowRight } from "react-icons/fa";
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

const Carts = () => {
  const { user } = useContext(AuthContext);

  const { addToast } = useToast();

  const queryClient = useQueryClient();

  const navigate = useNavigate();

  // ================= GET CART =================
  const { data, isLoading } = useQuery({
    queryKey: ["cart", user?.email],
    queryFn: fetchCart,
    enabled: !!user,
  });

  const cart = data?.data || [];

  const summary = data?.summary || {
    totalItems: 0,
    totalQuantity: 0,
    totalPrice: 0,
  };

  // ================= DELETE =================
  const deleteItem = useMutation({
    mutationFn: (id) =>
      axios.delete(`${API}/carts/${id}`, {
        withCredentials: true,
      }),

    onSuccess: () => {
      addToast("Item removed 🗑️", "success");

      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },

    onError: () => {
      addToast("Failed to remove item ❌", "error");
    },
  });

  const getFinalPrice = (item) => {
    const price = Number(item.price);

    const discount = Number(item.discount || 0);

    return price - (price * discount) / 100;
  };

  // ================= NOT LOGIN =================
  if (!user) {
    return <div className="text-center py-20">Please login first 🔐</div>;
  }

  // ================= LOADING =================
  if (isLoading) {
    return <div className="text-center py-20">Loading...</div>;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* HEADER */}
      <h2 className="text-3xl font-bold mb-8 text-center">🛒 My Cart</h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2">
          {cart.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
              Cart is empty 🛒
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const price = getFinalPrice(item);

                return (
                  <div
                    key={item._id}
                    className="bg-white shadow rounded-xl p-4 flex flex-col sm:flex-row gap-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full sm:w-28 h-28 object-cover rounded"
                    />

                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.name}</h3>

                      <p className="text-gray-500 mt-1">
                        Price: ৳{price.toFixed(2)}
                      </p>

                      <p className="mt-1">Quantity: {item.quantity}</p>

                      <p className="font-bold text-amber-600 mt-2">
                        Total: ৳{(price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteItem.mutate(item._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 h-fit"
                    >
                      <FaTrash />
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-white rounded-xl shadow p-6 h-fit">
          <h3 className="text-2xl font-bold mb-5">Order Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Products</span>
              <span>{summary.totalItems}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Quantity</span>
              <span>{summary.totalQuantity}</span>
            </div>

            <hr />

            <div className="flex justify-between text-xl font-bold text-amber-600">
              <span>Total Price</span>
              <span>৳{summary.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            disabled={!cart.length}
            className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
          >
            Proceed To Checkout
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Carts;
