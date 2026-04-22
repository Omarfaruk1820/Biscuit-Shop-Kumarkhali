import React, { useEffect, useState } from "react";
import { FaTrash, FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

const AddToCarts = () => {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  // 🔥 Load cart safely
  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(storedCart);
    } catch (error) {
      console.error("Cart load error:", error);
      setCart([]);
    }
  }, []);

  // 🔄 Update cart
  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // ➕ Increase quantity
  const increaseQty = (id) => {
    const updated = cart.map((item) =>
      item._id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    updateCart(updated);
  };

  // ➖ Decrease quantity
  const decreaseQty = (id) => {
    const updated = cart.map((item) =>
      item._id === id && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    updateCart(updated);
  };

  // ❌ Remove item
  const removeItem = (id) => {
    const updated = cart.filter((item) => item._id !== id);
    updateCart(updated);
  };

  // 🧹 Clear cart (bonus feature)
  const clearCart = () => {
    updateCart([]);
  };

  // 💰 Total
  const totalPrice = cart.reduce((sum, item) => {
    const final =
      item.price - (item.price * (item.discount || 0)) / 100;
    return sum + final * item.quantity;
  }, 0);

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  // 🚀 Go to checkout (safe)
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="max-w-6xl  mx-auto p-6">

      {/* TITLE */}
      <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        <FaShoppingCart /> My Cart
      </h2>

      {/* EMPTY */}
      {cart.length === 0 ? (
        <div className="text-center text-gray-500 space-y-3">
          <p>Your cart is empty 🛒</p>

          <Link
            to="/"
            className="btn btn-outline btn-primary"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* LIST */}
          <div className="space-y-4">
            {cart.map((item) => {
              const finalPrice =
                item.price -
                (item.price * (item.discount || 0)) / 100;

              return (
                <div
                  key={item._id}
                  className="flex items-center gap-4 bg-base-100 p-4 rounded-xl shadow hover:shadow-lg transition"
                >
                  {/* IMAGE */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-contain"
                  />

                  {/* INFO */}
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {item.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      ৳{finalPrice.toFixed(2)} × {item.quantity}
                    </p>

                    <p className="font-bold text-primary">
                      ৳{(finalPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* QTY */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQty(item._id)}
                      className="btn btn-sm"
                    >
                      <FaMinus />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => increaseQty(item._id)}
                      className="btn btn-sm"
                    >
                      <FaPlus />
                    </button>
                  </div>

                  {/* DELETE */}
                  <button
                    onClick={() => removeItem(item._id)}
                    className="btn btn-sm btn-error text-white"
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            })}
          </div>

          {/* SUMMARY */}
          <div className="mt-8 bg-base-100 p-6 rounded-xl shadow space-y-3">

            <h3 className="text-xl font-bold">
              Order Summary
            </h3>

            <div className="flex justify-between">
              <span>Total Items:</span>
              <span>{totalItems}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Price:</span>
              <span className="font-bold text-primary">
                ৳{totalPrice.toFixed(2)}
              </span>
            </div>

            {/* ACTIONS */}
            <Link to="/checkout"
              onClick={handleCheckout}
              className="btn btn-primary w-full"
              
            >
              Proceed to Checkout
            </Link>

            <button
              onClick={clearCart}
              className="btn btn-outline w-full"
            >
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddToCarts;