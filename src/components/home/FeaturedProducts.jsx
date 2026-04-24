import React, { useState } from "react";
import axios from "axios";
import {
  FaCartPlus,
  FaCookieBite,
  FaStar,
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../../context/ToastProvider";

const ITEMS_PER_PAGE = 8;

const FeaturedProducts = () => {
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  // ================= FETCH (React Query) =================
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axios.get(
        "http://localhost:5000/products"
      );

      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // ================= PAGINATION =================
  const totalPages = Math.ceil(
    products.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentProducts = products.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // ================= ADD TO CART =================
  const handleAddToCart = (product) => {
    const cart =
      JSON.parse(localStorage.getItem("cart")) || [];

    const exist = cart.find(
      (item) => item._id === product._id
    );

    let updatedCart;

    if (exist) {
      updatedCart = cart.map((item) =>
        item._id === product._id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        { ...product, quantity: 1 },
      ];
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    addToast("Added to cart 🛒", "success");
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading biscuits 🍪...
      </div>
    );
  }

  // ================= ERROR =================
  if (isError) {
    return (
      <div className="text-center py-20 text-red-500 font-semibold">
        Failed to load products
      </div>
    );
  }

  return (
    <section className="py-10 md:py-14 max-w-7xl mx-auto px-3 sm:px-4">

      {/* HEADER */}
      <div className="text-center mb-8 md:mb-12">
        <div className="flex justify-center items-center gap-2 text-amber-600 text-xl md:text-2xl font-bold">
          <FaCookieBite />
          Fresh Biscuit Collection
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mt-2">
          Delicious Biscuits Made with Love 🍪
        </h2>

        <p className="text-gray-500 mt-2 text-sm md:text-base max-w-xl mx-auto">
          Explore our premium handmade biscuits collection.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">

        {currentProducts.map((product) => {
          const price = Number(product.price) || 0;
          const discount = Number(product.discount) || 0;
          const finalPrice =
            price - (price * discount) / 100;

          return (
            <div
              key={product._id}
              className="bg-white dark:bg-gray-900 shadow rounded-xl p-3 sm:p-4 hover:shadow-lg transition duration-300"
            >
              {/* IMAGE */}
              <img
                src={product.image}
                alt={product.name}
                className="h-24 sm:h-28 md:h-32 w-full object-contain"
              />

              {/* NAME */}
              <h3 className="text-xs sm:text-sm font-semibold mt-2 line-clamp-1">
                {product.name}
              </h3>

              {/* RATING */}
              <div className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
                <FaStar />
                <span>{product.rating || 0}</span>
              </div>

              {/* PRICE */}
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p className="font-bold text-amber-600 text-sm">
                    ৳{finalPrice.toFixed(2)}
                  </p>

                  {discount > 0 && (
                    <p className="text-xs text-gray-400 line-through">
                      ৳{price}
                    </p>
                  )}
                </div>

                {/* BUTTON */}
                <button
                  onClick={() =>
                    handleAddToCart(product)
                  }
                  className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg"
                >
                  <FaCartPlus />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center mt-8 gap-2">

          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((p) => p - 1)
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() =>
                setCurrentPage(i + 1)
              }
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1
                  ? "bg-amber-500 text-white"
                  : ""
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((p) => p + 1)
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>

        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;