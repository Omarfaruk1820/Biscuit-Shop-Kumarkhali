import React, { useState, useEffect } from "react";
import { FaCartPlus, FaStar, FaHeart, FaFilter } from "react-icons/fa";
import { Link } from "react-router-dom";
import products from "../../data/productCard.json";

const ProductCard = () => {
  const categories = [
    "all",
    "biscuit",
    "cookies",
    "cake",
    "chanachur",
    "packet",
    "bread",
    "salt",
  ];

  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [toast, setToast] = useState("");

  // 🔥 Load cart from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(stored);
  }, []);

  // 🔄 Save cart
  const updateCart = (updated) => {
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  // 🛒 ADD TO CART (GLOBAL)
  const handleAddToCart = (product) => {
    let updatedCart = [...cart];
    const exist = updatedCart.find((i) => i._id === product._id);

    if (exist) {
      updatedCart = updatedCart.map((i) =>
        i._id === product._id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      updatedCart.push({ ...product, quantity: 1 });
    }

    updateCart(updatedCart);

    setToast(`${product.name} added 🛒`);
    setTimeout(() => setToast(""), 1500);
  };

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter(
          (p) =>
            (p.category || "").toLowerCase() ===
            activeCategory.toLowerCase()
        );

  return (
    <div className="p-6">

      {toast && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          {toast}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-center">
        🍪 Our Products
      </h2>

      {/* FILTER */}
      <div className="flex items-center gap-3 overflow-x-auto mb-6 pb-2">
        <FaFilter />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1 rounded-full text-sm ${
              activeCategory === cat
                ? "bg-primary text-white"
                : "bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {filteredProducts.map((product) => (
          <div key={product._id} className="bg-base-100 rounded-xl shadow hover:shadow-lg transition">

            <Link to={`/product/${product._id}`}>
              <div className="relative bg-gray-100 p-4 flex justify-center">
                <img src={product.image} className="h-32 object-contain" />
                <FaHeart className="absolute top-3 right-3 text-gray-400" />
              </div>
            </Link>

            <div className="p-4">
              <h3 className="text-sm font-semibold">{product.name}</h3>

              <div className="flex items-center text-yellow-400 text-sm">
                <FaStar /> {product.rating}
              </div>

              <div className="flex justify-between items-center mt-2">
                <p className="font-bold text-primary">৳{product.price}</p>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="btn btn-xs btn-primary"
                >
                  <FaCartPlus /> Add
                </button>
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* CART COUNT */}
      <p className="text-center mt-6 text-sm text-gray-600">
        🛒 Cart items: {cart.reduce((a, b) => a + b.quantity, 0)}
      </p>
    </div>
  );
};

export default ProductCard;