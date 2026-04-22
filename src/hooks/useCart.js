import { useContext } from "react";
import { CartContext } from "../context/CartProvider.jsx";

const useCart = () => {
  const { cart, setCart } = useContext(CartContext);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const addToCart = (product) => {
    const exist = cart.find((item) => item._id === product._id);

    let updatedCart;

    if (exist) {
      updatedCart = cart.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }

    saveCart(updatedCart);
  };

  const removeFromCart = (id) => {
    saveCart(cart.filter((item) => item._id !== id));
  };

  const updateQuantity = (id, qty) => {
    saveCart(
      cart.map((item) =>
        item._id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => saveCart([]);

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalItems,
  };
};

export default useCart;