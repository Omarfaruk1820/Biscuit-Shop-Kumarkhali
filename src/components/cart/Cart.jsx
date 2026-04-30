import React, { useContext } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaTrash, FaArrowRight } from "react-icons/fa";
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

const Carts = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: !!user,
    staleTime: 0,
  });

  const cart = data?.data || [];
  const summary = data?.summary || {};

  // ================= DELETE ITEM =================
  const deleteItem = useMutation({
    mutationFn: (id) =>
      axios.delete(`${API}/carts/${id}`, {
        withCredentials: true,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const getFinalPrice = (item) => {
    const price = Number(item.price);
    const discount = Number(item.discount || 0);
    return price - (price * discount) / 100;
  };

  if (!user) {
    return (
      <p className="text-center py-20 text-gray-600">
        Please login first
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="text-center py-20 text-amber-600">
        Loading cart...
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      <h2 className="text-3xl font-bold text-center mb-6">
        🛒 My Cart
      </h2>

      {/* SUMMARY */}
      <div className="bg-gray-100 p-5 rounded-xl mb-6 text-center shadow">

        <p>Total Products: {summary.totalItems}</p>
        <p>Total Quantity: {summary.totalQuantity}</p>

        <p className="text-amber-600 font-bold text-xl">
          Total Price: ৳{summary.totalPrice?.toFixed(2)}
        </p>

        <button
          onClick={() => navigate("/checkout")}
          disabled={!cart.length}
          className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          Proceed to Checkout <FaArrowRight />
        </button>
      </div>

      {/* CART ITEMS */}
      {cart.length === 0 ? (
        <p className="text-center text-gray-500">
          Cart is empty 🛒
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">

          {cart.map((item) => {
            const price = getFinalPrice(item);

            return (
              <div
                key={item._id}
                className="bg-white shadow rounded-xl overflow-hidden"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-40 w-full object-cover"
                />

                <div className="p-4">
                  <h3 className="font-bold">{item.name}</h3>

                  <p>Price: ৳{price.toFixed(2)}</p>
                  <p>Qty: {item.quantity}</p>

                  <p className="font-bold text-amber-600">
                    Total: ৳{(price * item.quantity).toFixed(2)}
                  </p>

                  <button
                    onClick={() => deleteItem.mutate(item._id)}
                    className="w-full mt-3 bg-red-500 text-white py-2 rounded flex items-center justify-center gap-2"
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
};

export default Carts;