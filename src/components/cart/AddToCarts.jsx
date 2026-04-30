import React, { useContext } from "react";
import axios from "axios";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  FaTrash,
  FaPlus,
  FaMinus,
  FaShoppingCart,
} from "react-icons/fa";
import { AuthContext } from "../../Auth/AuthProvider";

const API = import.meta.env.VITE_API_URL;

// ================= FETCH CART =================
const fetchCart = async () => {
  const res = await axios.get(`${API}/cart`, {
    withCredentials: true,
  });

  return res.data?.data || [];
};

const Carts = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  // ================= GET CART =================
  const { data: cart = [], isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: !!user,
  });

  // ================= UPDATE QUANTITY =================
  const updateQty = useMutation({
    mutationFn: ({ id, quantity }) =>
      axios.put(
        `${API}/cart/${id}`,
        { quantity },
        { withCredentials: true }
      ),

    onSuccess: () => {
      queryClient.invalidateQueries(["cart"]);
    },
  });

  // ================= DELETE ITEM =================
  const deleteItem = useMutation({
    mutationFn: (id) =>
      axios.delete(`${API}/cart/${id}`, {
        withCredentials: true,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries(["cart"]);
    },
  });

  // ================= PRICE CALCULATION =================
  const getPrice = (item) => {
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    return price - (price * discount) / 100;
  };

  // ================= TOTALS =================
  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (sum, item) =>
      sum + getPrice(item) * item.quantity,
    0
  );

  // ================= LOADING =================
  if (isLoading) {
    return (
      <p className="text-center py-20">
        Loading cart...
      </p>
    );
  }

  // ================= LOGIN CHECK =================
  if (!user) {
    return (
      <p className="text-center py-20">
        Please login first
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* TITLE */}
      <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
        <FaShoppingCart /> My Cart
      </h2>

      {/* EMPTY CART */}
      {cart.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          Your cart is empty 🛒
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">

          {/* LEFT SIDE - CART ITEMS */}
          <div className="md:col-span-2 space-y-4">

            {cart.map((item) => {
              const price = getPrice(item);

              return (
                <div
                  key={item._id}
                  className="flex items-center gap-4 bg-white shadow-md p-4 rounded-xl hover:shadow-lg transition"
                >

                  {/* IMAGE */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />

                  {/* INFO */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {item.name}
                    </h3>

                    <p className="text-gray-500 text-sm">
                      ৳{price.toFixed(2)} × {item.quantity}
                    </p>

                    <p className="font-bold text-amber-600">
                      ৳{(price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* QTY CONTROLS */}
                  <div className="flex items-center gap-2">

                    <button
                      onClick={() =>
                        item.quantity > 1 &&
                        updateQty.mutate({
                          id: item._id,
                          quantity:
                            item.quantity - 1,
                        })
                      }
                      className="bg-gray-200 px-2 py-1 rounded"
                    >
                      <FaMinus />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateQty.mutate({
                          id: item._id,
                          quantity:
                            item.quantity + 1,
                        })
                      }
                      className="bg-gray-200 px-2 py-1 rounded"
                    >
                      <FaPlus />
                    </button>
                  </div>

                  {/* DELETE */}
                  <button
                    onClick={() =>
                      deleteItem.mutate(item._id)
                    }
                    className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            })}
          </div>

          {/* RIGHT SIDE - SUMMARY */}
          <div className="bg-white shadow-lg p-6 rounded-xl h-fit sticky top-10">

            <h3 className="text-xl font-bold mb-4">
              Order Summary
            </h3>

            <div className="space-y-2 text-gray-600">
              <p>Total Items: {totalItems}</p>

              <p className="text-lg font-bold text-amber-600">
                Total: ৳{totalPrice.toFixed(2)}
              </p>
            </div>

            <button className="w-full mt-5 bg-amber-500 text-white py-2 rounded hover:bg-amber-600 transition">
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carts;