import React, { useContext } from "react";
import axios from "axios";
import {
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Auth/AuthProvider";

// ================= FETCH =================
const fetchCart = async (email) => {
  if (!email) return [];

  const res = await axios.get(
    `http://localhost:5000/cart?email=${email}`
  );

  return res.data?.data || [];
};

const Cart = () => {
  const { user, loading: authLoading } =
    useContext(AuthContext);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const email = user?.email?.toLowerCase().trim();

  // ================= GET CART =================
  const { data: cart = [], isLoading } = useQuery({
    queryKey: ["cart", email],
    queryFn: () => fetchCart(email),
    enabled: !!email,
  });

  // ================= DELETE ITEM =================
  const deleteItem = useMutation({
    mutationFn: (id) =>
      axios.delete(`http://localhost:5000/cart/${id}`),

    onSuccess: () => {
      queryClient.invalidateQueries(["cart", email]);
    },
  });

  // ================= PRICE =================
  const getPrice = (item) => {
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    return price - (price * discount) / 100;
  };

  const totalItems = cart.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const totalPrice = cart.reduce((sum, item) => {
    return sum + getPrice(item) * item.quantity;
  }, 0);

  // ================= STATES =================
  if (authLoading) {
    return <div className="text-center py-20">Checking user...</div>;
  }

  if (!email) {
    return (
      <div className="text-center py-20 text-gray-500">
        Please login first
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-20">Loading cart...</div>;
  }

  // ================= UI =================
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      <h2 className="text-2xl font-bold text-center mb-6">
        🛒 Your Cart ({totalItems})
      </h2>

      {cart.length === 0 ? (
        <p className="text-center text-gray-500">
          Your cart is empty
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">

          {/* ITEMS */}
          <div className="md:col-span-2 space-y-4">

            {cart.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-center bg-white p-4 rounded shadow"
              >

                <div>
                  <h3>{item.name}</h3>
                  <p>৳{getPrice(item).toFixed(2)}</p>
                  <p>Qty: {item.quantity}</p>
                </div>

                <button
                  onClick={() =>
                    deleteItem.mutate(item._id)
                  }
                  className="text-red-500"
                >
                  <FaTrash />
                </button>

              </div>
            ))}

          </div>

          {/* SUMMARY */}
          <div className="bg-white p-5 rounded shadow">

            <h3 className="font-bold mb-4">
              Order Summary
            </h3>

            <p>Total Items: {totalItems}</p>
            <p>Total: ৳{totalPrice.toFixed(2)}</p>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full mt-4 bg-amber-500 text-white py-2 rounded"
            >
              Checkout
            </button>

          </div>

        </div>
      )}
    </div>
  );
};

export default Cart;