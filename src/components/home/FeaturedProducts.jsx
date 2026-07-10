import React, { useContext, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaCartPlus,
  FaStar,
  FaFire,
  FaArrowLeft,
  FaSpinner,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const FeaturedProducts = () => {
  /* ===============================
      HOOKS
  =============================== */

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { user } = useContext(AuthContext);

  const { addToast } = useToast();

  /* ===============================
      STATE
  =============================== */

  const [currentPage, setCurrentPage] = useState(1);

  // Loading state for individual product
  const [addingId, setAddingId] = useState(null);

  const LIMIT = 8;

  /* ===============================
      FETCH PRODUCTS
  =============================== */

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

  /* ===============================
      REACT QUERY
  =============================== */

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
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

  /* ===============================
      ADD TO CART
  =============================== */

  const handleAddToCart = async (product) => {
    if (!user) {
      addToast("Please login first", "error");
      navigate("/login");
      return;
    }

    try {
      setAddingId(product._id);

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
      }
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to add product",
        "error",
      );
    } finally {
      setAddingId(null);
    }
  };

  /* ===============================
      LOADING
  =============================== */

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="h-10 w-72 rounded bg-gray-200 animate-pulse"></div>

            <div className="h-5 w-56 rounded bg-gray-200 animate-pulse mt-4"></div>
          </div>

          <div className="h-12 w-28 rounded-xl bg-gray-200 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: LIMIT }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border bg-white overflow-hidden shadow-sm"
            >
              <div className="h-60 bg-gray-200 animate-pulse"></div>

              <div className="p-5 space-y-4">
                <div className="h-5 rounded bg-gray-200 animate-pulse"></div>

                <div className="h-4 w-28 rounded bg-gray-200 animate-pulse"></div>

                <div className="h-8 w-36 rounded bg-gray-200 animate-pulse"></div>

                <div className="h-12 rounded-xl bg-gray-200 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ===============================
      ERROR
  =============================== */

  if (isError) {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-red-500">
          Failed to load products
        </h2>

        <p className="text-gray-500 mt-2">
          Something went wrong while loading the products.
        </p>

        <button
          onClick={() => refetch()}
          className="mt-6 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl transition"
        >
          Try Again
        </button>
      </section>
    );
  }

  /* ===============================
      MAIN UI STARTS IN PART 2
  =============================== */

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {/* ===========================
      HEADER
  =========================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-12">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-800 flex items-center gap-3">
            🍪 Featured Products
          </h2>

          <p className="text-gray-500 mt-3">
            Fresh snacks, biscuits, cookies and delicious grocery products.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 hover:bg-gray-100 transition"
        >
          <FaArrowLeft />
          Back
        </button>
      </div>

      {/* ===========================
      PRODUCTS
  =========================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
              className="group bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 duration-300"
            >
              {/* IMAGE */}

              <Link to={`/product/${product._id}`}>
                <div className="relative h-64 overflow-hidden bg-gray-50">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/400x400?text=No+Image";
                    }}
                    className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Discount */}

                  {discount > 0 && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      🔥 {discount}% OFF
                    </span>
                  )}

                  {/* Hot */}

                  {discount >= 15 && (
                    <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <FaFire />
                      Hot
                    </span>
                  )}
                </div>
              </Link>

              {/* BODY */}

              <div className="p-5">
                {/* Brand */}

                <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {product.brand || "No Brand"}
                </span>

                {/* Product Name */}

                <Link to={`/product/${product._id}`}>
                  <h3 className="mt-4 text-lg font-bold text-gray-800 line-clamp-2 hover:text-amber-500 transition">
                    {product.name}
                  </h3>
                </Link>

                {/* Category */}

                <div className="mt-3">
                  <span className="inline-flex bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full capitalize">
                    {product.category}
                  </span>
                </div>

                {/* Rating */}

                <div className="flex items-center justify-between mt-5">
                  <div className="flex items-center gap-1">
                    <FaStar className="text-yellow-500" />

                    <span className="font-semibold">
                      {Number(product.rating || 0).toFixed(1)}
                    </span>
                  </div>

                  <span className="text-sm text-gray-400">
                    ({product.reviews || 0})
                  </span>
                </div>

                {/* Price */}

                <div className="mt-5">
                  <h4 className="text-2xl font-extrabold text-amber-600">
                    ৳{finalPrice.toFixed(2)}
                  </h4>

                  {discount > 0 && (
                    <p className="text-gray-400 line-through">
                      ৳{price.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Stock */}

                <div className="mt-4">
                  {product.stock > 0 ? (
                    <span className="inline-flex bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                      In Stock ({product.stock})
                    </span>
                  ) : (
                    <span className="inline-flex bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
                      Out Of Stock
                    </span>
                  )}
                </div>

                {/* Buttons */}

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Link
                    to={`/product/${product._id}`}
                    className="h-11 rounded-xl border flex items-center justify-center font-semibold hover:bg-gray-100 transition"
                  >
                    Details
                  </Link>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0 || addingId === product._id}
                    className={`h-11 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition active:scale-95

                ${
                  product.stock > 0
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-gray-400 cursor-not-allowed"
                }
                `}
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
      {/* ===========================
      EMPTY STATE
  =========================== */}

      {products.length === 0 && (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold text-gray-700">
            No Products Found
          </h3>

          <p className="text-gray-500 mt-3">
            There are no featured products available right now.
          </p>
        </div>
      )}

      {/* ===========================
      PAGINATION
  =========================== */}

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-3 mt-14">
          {/* Previous */}

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-5 py-3 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          {/* Page Numbers */}

          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-11 h-11 rounded-xl font-semibold transition

            ${
              currentPage === page
                ? "bg-amber-500 text-white shadow-lg"
                : "bg-white border hover:bg-gray-100"
            }
            `}
              >
                {page}
              </button>
            );
          })}

          {/* Next */}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="px-5 py-3 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}

      {/* ===========================
      FETCHING INDICATOR
  =========================== */}

      {isFetching && !isLoading && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-3 rounded-full bg-white shadow-md border px-5 py-3">
            <FaSpinner className="animate-spin text-amber-500" />

            <span className="text-gray-600">Updating products...</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;
