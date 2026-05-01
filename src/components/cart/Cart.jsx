import React, { useContext } from "react";
import axios from "axios";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: !!user,
  });

  const cart = data?.data || [];
  const summary = data?.summary || {};

  // ================= DELETE =================
  const deleteItem = useMutation({
    mutationFn: (id) =>
      axios.delete(`${API}/carts/${id}`, {
        withCredentials: true,
      }),

    onSuccess: () => {
      addToast("Item removed 🗑️", "success");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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
    return (
      <div className="text-center py-20 text-gray-600">
        Please login first 🔐
      </div>
    );
  }

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg text-amber-500"></span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

      {/* HEADER */}
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
        🛒 My Cart
      </h2>

      {/* ================= MAIN GRID ================= */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ================= CART ITEMS ================= */}
        <div className="lg:col-span-2">

          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              Cart is empty 🛒
            </div>
          ) : (
            <div className="space-y-4">

              {cart.map((item) => {
                const price = getFinalPrice(item);

                return (
                  <div
                    key={item._id}
                    className="flex flex-col sm:flex-row items-center gap-4 bg-white shadow rounded-xl p-4"
                  >
                    {/* IMAGE */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full sm:w-24 h-24 object-cover rounded"
                    />

                    {/* INFO */}
                    <div className="flex-1 w-full">
                      <h3 className="font-semibold text-lg">
                        {item.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        Price: ৳{price.toFixed(2)}
                      </p>

                      <p className="text-sm">
                        Qty: {item.quantity}
                      </p>

                      <p className="font-bold text-amber-600">
                        Total: ৳
                        {(price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* DELETE */}
                    <button
                      onClick={() => deleteItem.mutate(item._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="bg-white shadow rounded-xl p-6 h-fit">

          <h3 className="text-xl font-bold mb-4 text-center">
            Order Summary
          </h3>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex justify-between">
              <span>Products</span>
              <span>{summary.totalItems || 0}</span>
            </p>

            <p className="flex justify-between">
              <span>Quantity</span>
              <span>{summary.totalQuantity || 0}</span>
            </p>

            <hr />

            <p className="flex justify-between font-bold text-lg text-amber-600">
              <span>Total</span>
              <span>৳{summary.totalPrice?.toFixed(2) || "0.00"}</span>
            </p>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            disabled={!cart.length}
            className="mt-5 w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
          >
            Proceed to Checkout <FaArrowRight />
          </button>

        </div>

      </div>
    </div>
  );
};

export default Carts;