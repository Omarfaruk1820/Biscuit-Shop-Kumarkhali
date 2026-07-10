import React, { useContext, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCartPlus, FaStar, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";

const API = import.meta.env.VITE_API_URL;

const ProductCard = () => {
  /* ==========================================
      HOOKS
  ========================================== */

  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const { addToast } = useToast();

  const queryClient = useQueryClient();

  const { flyToCart } = useFlyToCart();

  /* ==========================================
      STATE
  ========================================== */

  const [currentPage, setCurrentPage] = useState(1);

  // Loading only for clicked product
  const [addingId, setAddingId] = useState(null);

  const LIMIT = 8;

  /* ==========================================
      FETCH PRODUCTS
  ========================================== */

  const fetchProducts = async ({ queryKey }) => {
    const [, page] = queryKey;

    const { data } = await axios.get(`${API}/products`, {
      params: {
        page,
        limit: LIMIT,
      },
    });

    return data;
  };

  /* ==========================================
      REACT QUERY
  ========================================== */

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["products", currentPage],

    queryFn: fetchProducts,

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 5,

    retry: 1,

    keepPreviousData: true,

    refetchOnWindowFocus: false,
  });

  const products = data?.data || [];

  const totalPages = data?.pagination?.totalPages || 1;

  /* ==========================================
      ADD TO CART
  ========================================== */

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();

    if (!user) {
      addToast("Please login first.", "error");
      navigate("/login");
      return;
    }

    try {
      setAddingId(product._id);

      const image = e.currentTarget
        .closest(".product-card")
        ?.querySelector("img");

      const cartIcon = document.querySelector(".cart-icon");

      const { data } = await axios.post(
        `${API}/carts`,
        {
          productId: product._id,
          quantity: 1,
        },
        {
          withCredentials: true,
        },
      );

      if (data.success) {
        addToast(
          `🛒 ${product.name} added to your cart successfully.`,
          "success",
        );

        await queryClient.invalidateQueries({
          queryKey: ["cart", user.email],
        });

        if (image && cartIcon) {
          flyToCart(image, cartIcon);
        }
      }
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to add product.",
        "error",
      );
    } finally {
      setAddingId(null);
    }
  };

  /* ==========================================
      LOADING
  ========================================== */

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <div className="h-10 w-72 rounded bg-gray-200 animate-pulse"></div>

          <div className="h-5 w-60 rounded bg-gray-200 animate-pulse mt-3"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: LIMIT }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl overflow-hidden border bg-white"
            >
              <div className="h-52 bg-gray-200 animate-pulse"></div>

              <div className="p-4 space-y-4">
                <div className="h-5 rounded bg-gray-200 animate-pulse"></div>

                <div className="h-4 w-24 rounded bg-gray-200 animate-pulse"></div>

                <div className="h-7 w-32 rounded bg-gray-200 animate-pulse"></div>

                <div className="h-11 rounded-xl bg-gray-200 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ==========================================
      ERROR
  ========================================== */

  if (isError) {
    return (
      <section className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-500">
          Failed to load products
        </h2>

        <p className="text-gray-500 mt-2">
          Something went wrong while fetching products.
        </p>

        <button
          onClick={() => refetch()}
          className="mt-6 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition"
        >
          Try Again
        </button>
      </section>
    );
  }

  /* ==========================================
      MAIN UI STARTS IN PART 2
  ========================================== */

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      {/* ================= HEADER ================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
        <div>
          <h2 className="text-4xl font-bold text-gray-800">
            🍪 Biscuit Collection
          </h2>

          <p className="mt-2 text-gray-500">
            Fresh, crispy and delicious snacks for your everyday cravings.
          </p>
        </div>
      </div>

      {/* ================= PRODUCT GRID ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const price = Number(product.price || 0);

          const discount = Number(product.discount || 0);

          const finalPrice = price - (price * discount) / 100;

          const imageUrl = String(product.image || "")
            .replace(/[\[\]\(\)]/g, "")
            .trim();

          return (
            <div
              key={product._id}
              className="product-card group rounded-2xl overflow-hidden bg-white border shadow-sm hover:shadow-2xl hover:-translate-y-2 duration-300 cursor-pointer"
              onClick={() => navigate(`/product/${product._id}`)}
            >
              {/* Image */}

              <div className="relative overflow-hidden bg-gray-50 h-56">
                <img
                  src={imageUrl}
                  alt={product.name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/400x400?text=No+Image";
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {discount > 0 && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    -{discount}%
                  </span>
                )}

                {discount >= 15 && (
                  <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    HOT
                  </span>
                )}
              </div>

              {/* Body */}

              <div className="p-4">
                {/* Brand */}

                <span className="inline-flex text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                  {product.brand || "No Brand"}
                </span>

                {/* Name */}

                <h3 className="mt-3 font-bold text-gray-800 line-clamp-2 min-h-[48px]">
                  {product.name}
                </h3>

                {/* Category */}

                <div className="mt-2">
                  <span className="inline-flex bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full capitalize">
                    {product.category}
                  </span>
                </div>

                {/* Rating */}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <FaStar />

                    <span className="text-sm font-semibold text-gray-700">
                      {Number(product.rating || 0).toFixed(1)}
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">
                    ({product.reviews || 0})
                  </span>
                </div>

                {/* Price */}

                <div className="mt-4">
                  <h4 className="text-2xl font-bold text-amber-600">
                    ৳{finalPrice.toFixed(2)}
                  </h4>

                  {discount > 0 && (
                    <p className="text-sm text-gray-400 line-through">
                      ৳{price.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Stock */}

                <div className="mt-3">
                  {product.stock > 0 ? (
                    <span className="inline-flex bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                      In Stock ({product.stock})
                    </span>
                  ) : (
                    <span className="inline-flex bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full font-medium">
                      Out Of Stock
                    </span>
                  )}
                </div>

                {/* Buttons */}

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${product._id}`);
                    }}
                    className="h-11 rounded-xl border font-semibold hover:bg-gray-100 transition"
                  >
                    Details
                  </button>

                  <button
                    disabled={addingId === product._id || product.stock === 0}
                    onClick={(e) => handleAddToCart(product, e)}
                    className={`h-11 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95

                ${
                  product.stock > 0
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                  >
                    {addingId === product._id ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaCartPlus />
                        Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= PAGINATION ================= */}

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-4 py-2 rounded-xl border hover:bg-gray-100 disabled:opacity-40"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl font-semibold transition

            ${
              currentPage === page
                ? "bg-amber-500 text-white"
                : "border hover:bg-gray-100"
            }`}
              >
                {page}
              </button>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="px-4 py-2 rounded-xl border hover:bg-gray-100 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* ================= FETCHING ================= */}

      {isFetching && !isLoading && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-3 px-5 py-3 rounded-full border bg-white shadow">
            <FaSpinner className="animate-spin text-amber-500" />

            <span className="text-sm text-gray-600">Updating products...</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductCard;
