import React, { createContext, useEffect, useState } from "react";
import { useToast } from "./ToastProvider";

export const CartContext = createContext();

const CartProvider = ({ children }) => {
  const { addToast } = useToast();

  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  // 🔄 Sync with localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ➕ Add to cart
  const addToCart = (product) => {
    setLoading(true);

    setCart((prev) => {
      const exist = prev.find((item) => item._id === product._id);

      let updated;

      if (exist) {
        updated = prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updated = [...prev, { ...product, quantity: 1 }];
      }

      return updated;
    });

    addToast("Added to cart 🛒", "success");
    setLoading(false);
  };

  // ❌ Remove item
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
    addToast("Item removed ❌", "warning");
  };

  // 🔄 Update quantity
  const updateQuantity = (id, qty) => {
    if (qty < 1) return;

    setCart((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  // 🧹 Clear cart
  const clearCart = () => {
    setCart([]);
    addToast("Cart cleared 🧹", "info");
  };

  // 💰 Total price
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 📦 Total items
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 🧠 Context value
  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;