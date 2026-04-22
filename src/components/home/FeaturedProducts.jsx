import React, { useState } from "react";
import { FaCartPlus, FaCookieBite, FaStar } from "react-icons/fa";
import { useToast } from "../../context/ToastProvider";
import productsData from "../../data/productCard.json";

const ITEMS_PER_PAGE = 8;

const FeaturedProducts = () => {
  const { addToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);

  const products = productsData;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = products.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // 🛒 Add to cart
  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const exist = cart.find((item) => item._id === product._id);

    let updatedCart;

    if (exist) {
      updatedCart = cart.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }

    localStorage.setItem("cart", JSON.stringify(updatedCart));

    addToast("Added to cart 🛒", "success");
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-4">
      {/* 🔥 HEADER SECTION */}
      <div className="text-center mb-10">
        <div className="flex justify-center items-center gap-2 text-primary text-2xl font-bold">
          <FaCookieBite />
          Fresh Biscuit Collection
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold mt-2">
          Delicious Biscuits Made with Love 🍪
        </h2>

        <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
          Explore our premium handmade biscuits collection. Freshly baked,
          crispy, and perfect for every tea time moment.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {currentProducts.map((product) => (
          <div key={product._id} className="bg-base-100 shadow rounded-2xl p-4">
            <img src={product.image} className="h-28 mx-auto object-contain" />

            <h3 className="text-sm font-semibold mt-2">{product.name}</h3>

            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              <FaStar />
              {product.rating}
            </div>

            <div className="flex justify-between mt-2">
              <p className="font-bold text-primary">৳{product.price}</p>

              <button
                onClick={() => handleAddToCart(product)}
                className="btn btn-primary btn-xs"
              >
                <FaCartPlus />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-10 gap-2">
        {/* Prev */}
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="btn btn-sm"
        >
          Prev
        </button>

        {/* Pages */}
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`btn btn-sm ${
              currentPage === i + 1 ? "btn-primary" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}

        {/* Next */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="btn btn-sm"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default FeaturedProducts;
