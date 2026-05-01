import React, { useState } from "react";
import axios from "axios";
import { FaCartPlus, FaCookieBite, FaStar } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const FeaturedProducts = () => {
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  // ================= FETCH =================
  const fetchProducts = async () => {
    const res = await axios.get(`${API}/products`, {
      params: {
        page: currentPage,
        limit: 8,
      },
    });
    return res.data;
  };

  // ================= QUERY =================
  const {
    data,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: fetchProducts,
    keepPreviousData: true,
  });

  const products = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  // ================= ADD TO CART =================
  const handleAddToCart = async (product) => {
    try {
      const payload = {
        productId: product._id,
        name: product.name,
        price: product.price,
        discount: product.discount || 0,
        image: product.image,
        quantity: 1,
      };

      const res = await axios.post(`${API}/carts`, payload, {
        withCredentials: true,
      });

      if (res.data?.success) {
        addToast("Added to cart 🛒", "success");
      } else {
        addToast(res.data?.message || "Failed ❌", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server error ❌", "error");
    }
  };

  // ================= SKELETON =================
  if (isLoading) {
    return (
      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-52 bg-gray-200 animate-pulse rounded-xl"
            ></div>
          ))}
        </div>
      </section>
    );
  }

  // ================= ERROR =================
  if (isError) {
    return (
      <div className="text-center py-20 text-red-500">
        Failed to load products ❌
      </div>
    );
  }

  return (
    <section className="py-12 max-w-7xl mx-auto px-4">

      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="flex justify-center items-center gap-2 text-amber-600 text-xl md:text-2xl font-bold">
          <FaCookieBite />
          Fresh Biscuit Collection
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold mt-2">
          Delicious Biscuits 🍪
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          Handpicked premium biscuits just for you
        </p>
      </div>

      {/* PRODUCTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">

        {products.map((product) => {
          const price = Number(product.price) || 0;
          const discount = Number(product.discount) || 0;
          const finalPrice = price - (price * discount) / 100;

          return (
            <div
              key={product._id}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition duration-300 p-3 md:p-4 flex flex-col"
            >

              {/* IMAGE */}
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={product.image || "https://via.placeholder.com/150"}
                  alt={product.name}
                  className="h-32 sm:h-36 md:h-40 w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />

                {/* DISCOUNT BADGE */}
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* INFO */}
              <div className="flex-1 flex flex-col mt-3">

                {/* NAME */}
                <h3 className="text-sm md:text-base font-semibold line-clamp-1">
                  {product.name}
                </h3>

                {/* RATING */}
                <div className="flex items-center gap-1 text-yellow-500 text-xs mt-1">
                  <FaStar />
                  {product.rating || 0}
                </div>

                {/* PRICE */}
                <div className="mt-2">
                  <p className="text-amber-600 font-bold text-sm md:text-base">
                    ৳{finalPrice.toFixed(2)}
                  </p>

                  {discount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="line-through">৳{price}</span>
                      <span className="text-green-600 font-semibold">
                        SAVE {discount}%
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* BUTTON */}
              <button
                onClick={() => handleAddToCart(product)}
                className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition"
              >
                <FaCartPlus />
                Add to Cart
              </button>

            </div>
          );
        })}

      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-10 gap-2 flex-wrap">

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-4 py-2 border rounded ${
              currentPage === i + 1
                ? "bg-amber-500 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

      {/* FETCHING INDICATOR */}
      {isFetching && (
        <p className="text-center text-sm text-gray-400 mt-3">
          Updating...
        </p>
      )}

    </section>
  );
};

export default FeaturedProducts;