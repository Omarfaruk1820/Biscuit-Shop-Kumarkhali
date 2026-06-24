import React, { useState, useContext } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCartPlus, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";
import { AuthContext } from "../../Auth/AuthProvider";

const API = import.meta.env.VITE_API_URL;

const ProductCard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { flyToCart } = useFlyToCart();

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

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: fetchProducts,
    keepPreviousData: true,
  });

  const products = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  // ================= ADD TO CART =================
  const handleAddToCart = async (product, e) => {
    e.stopPropagation();

    const img = e.currentTarget.closest(".product-card")?.querySelector("img");

    const cartIcon = document.querySelector(".cart-icon");

    try {
      const res = await axios.post(
        `${API}/carts`,
        {
          productId: product._id,
          quantity: 1,
        },
        { withCredentials: true },
      );

      if (res.data.success) {
        // ✅ Toast with product name
        addToast(`🛒 ${product.name} added successfully`, "success");

        // 🔥 cart sync
        queryClient.invalidateQueries(["cart", user?.email]);

        // ✈️ flying animation
        if (img && cartIcon) {
          flyToCart(img, cartIcon);
        }
      }
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to add cart", "error");
    }
  };
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500">Failed to load products ❌</p>
    );
  }

  return (
    <section className="px-3 md:px-10 py-6">
      {/* HEADER */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl md:text-4xl font-bold">
          🍪 Biscuit Collection
        </h2>
        <p className="text-gray-500">Fresh, crispy & delicious biscuits</p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const price = Number(product.price) || 0;
          const discount = Number(product.discount) || 0;
          const finalPrice = price - (price * discount) / 100;

          return (
            <div
              key={product._id}
              className="product-card bg-white rounded-xl shadow hover:shadow-xl transition overflow-hidden cursor-pointer"
              onClick={() => navigate(`/product/${product._id}`)}
            >
              {/* IMAGE */}
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-40 w-full object-cover hover:scale-105 transition"
                />

                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* BODY */}
              <div className="p-3">
                <h3 className="font-semibold line-clamp-1">{product.name}</h3>

                {/* rating */}
                <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
                  <FaStar />
                  {product.rating}
                  <span className="text-gray-400">({product.reviews})</span>
                </div>

                {/* price */}
                <div className="mt-2">
                  <p className="text-amber-600 font-bold">
                    ৳{finalPrice.toFixed(2)}
                  </p>

                  {discount > 0 && (
                    <p className="text-xs line-through text-gray-400">
                      ৳{price}
                    </p>
                  )}
                </div>

                {/* BUTTON */}
                <button
                  onClick={(e) => handleAddToCart(product, e)}
                  className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <FaCartPlus />
                  Add To Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-8 gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-2 border rounded ${
              currentPage === i + 1
                ? "bg-amber-500 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* LOADING STATE */}
      {isFetching && (
        <p className="text-center text-gray-400 mt-3 text-sm">Updating...</p>
      )}
    </section>
  );
};

export default ProductCard;
