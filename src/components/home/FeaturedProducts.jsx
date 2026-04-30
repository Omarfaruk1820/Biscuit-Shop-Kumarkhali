import React, { useState } from "react";
import axios from "axios";
import { FaCartPlus, FaCookieBite, FaStar } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const FeaturedProducts = () => {
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  // ================= FETCH PRODUCTS =================
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
  const { data, isLoading, isError } = useQuery({
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
        addToast(res.data?.message || "Failed to add", "error");
      }
    } catch (error) {
      console.log(error);
      addToast("Server error ❌", "error");
    }
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading products... ⚡
      </div>
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
        <div className="flex justify-center items-center gap-2 text-amber-600 text-2xl font-bold">
          <FaCookieBite />
          Fresh Biscuit Collection
        </div>

        <h2 className="text-3xl font-extrabold mt-2">
          Delicious Biscuits 🍪
        </h2>
      </div>

      {/* PRODUCTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">

        {products.map((product) => {
          const price = Number(product.price) || 0;
          const discount = Number(product.discount) || 0;

          const finalPrice = price - (price * discount) / 100;

          return (
            <div
              key={product._id}
              className="bg-white shadow-md hover:shadow-xl transition rounded-xl p-4"
            >

              {/* IMAGE */}
              <img
                src={product.image || "https://via.placeholder.com/150"}
                alt={product.name}
                className="h-32 w-full object-contain"
              />

              {/* NAME */}
              <h3 className="text-sm font-semibold mt-3 line-clamp-1">
                {product.name}
              </h3>

              {/* RATING */}
              <div className="flex items-center gap-1 text-yellow-500 text-xs">
                <FaStar />
                {product.rating || 0}
              </div>

              {/* PRICE SECTION (UPDATED) */}
              <div className="mt-2">

                {/* FINAL PRICE */}
                <p className="text-amber-600 font-bold">
                  ৳{finalPrice.toFixed(2)}
                </p>

                {/* ORIGINAL + DISCOUNT */}
                {discount > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="line-through">
                      ৳{price}
                    </span>

                    <span className="text-green-600 font-semibold">
                      -{discount}% OFF
                    </span>
                  </div>
                )}

              </div>

              {/* CART BUTTON */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded"
                >
                  <FaCartPlus />
                </button>
              </div>

            </div>
          );
        })}

      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-8 gap-2 flex-wrap">

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded transition ${
              currentPage === i + 1
                ? "bg-amber-500 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

      </div>

    </section>
  );
};

export default FeaturedProducts;