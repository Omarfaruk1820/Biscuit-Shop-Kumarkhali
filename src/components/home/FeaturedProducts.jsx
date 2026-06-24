import React, { useContext, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCartPlus, FaStar, FaFire, FaArrowLeft } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const FeaturedProducts = () => {
  // ==========================
  // HOOKS
  // ==========================
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const { addToast } = useToast();

  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);

  // ==========================
  // FETCH PRODUCTS
  // ==========================
  const fetchProducts = async ({ queryKey }) => {
    const [, page] = queryKey;

    const res = await axios.get(`${API}/products`, {
      params: {
        page,
        limit: 8,
      },
    });

    return res.data;
  };

  // ==========================
  // REACT QUERY
  // ==========================
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: fetchProducts,

    placeholderData: (previousData) => previousData,

    staleTime: 1000 * 60,

    refetchOnWindowFocus: true,
  });

  const products = data?.data || [];

  const totalPages = data?.pagination?.totalPages || 1;

  // ==========================
  // ADD TO CART
  // ==========================
  const handleAddToCart = async (product) => {
    if (!user) {
      addToast("Please login first", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/carts`,
        {
          productId: product._id,
          quantity: 1,
        },
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        addToast(`🛒 ${product.name} added successfully`, "success");

        // Refresh cart
        queryClient.invalidateQueries({
          queryKey: ["cart", user?.email],
        });

        queryClient.refetchQueries({
          queryKey: ["cart", user?.email],
        });

        // Refresh products
        refetch();
      }
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to add product",
        "error",
      );
    }
  };

  // ==========================
  // LOADING STATE
  // ==========================
  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white border rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="h-48 bg-gray-200 animate-pulse"></div>

              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>

                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>

                <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>

                <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ==========================
  // ERROR STATE
  // ==========================
  if (isError) {
    return (
      <section className="py-20 text-center">
        <h2 className="text-red-500 text-xl font-bold">
          Failed to load products
        </h2>

        <button
          onClick={() => refetch()}
          className="mt-5 px-6 py-3 bg-amber-500 text-white rounded-xl"
        >
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      {/* ==========================
          HEADER
      =========================== */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            🍪 Featured Biscuit Products
          </h2>

          <p className="text-gray-500 mt-2">
            Fresh cookies, cakes and sweet treats for your family
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
        >
          <FaArrowLeft />
          Back
        </button>
      </div>

      {/* ==========================
          PRODUCT GRID
      =========================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.map((p) => {
          const price = Number(p.price || 0);

          const discount = Number(p.discount || 0);

          const finalPrice = price - (price * discount) / 100;

          // fix image URL from DB
          const imageUrl = p.image?.replace(/\[|\]|\(|\)/g, "").trim();

          return (
            <div
              key={p._id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden border"
            >
              {/* ==========================
                  PRODUCT IMAGE
              =========================== */}
              <Link to={`/product/${p._id}`}>
                <div className="relative h-48 md:h-56 bg-gray-50 flex justify-center items-center">
                  <img
                    src={imageUrl}
                    alt={p.name}
                    className="h-full object-contain p-3 hover:scale-105 transition"
                  />

                  {/* Discount Badge */}
                  {discount > 0 && (
                    <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      -{discount}%
                    </span>
                  )}

                  {/* Hot Badge */}
                  {discount >= 15 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <FaFire />
                      Hot
                    </span>
                  )}
                </div>
              </Link>

              {/* ==========================
                  PRODUCT INFO
              =========================== */}
              <div className="p-4">
                {/* Product Name */}
                <h3 className="font-semibold text-sm md:text-base line-clamp-2 text-gray-800">
                  {p.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  <FaStar className="text-yellow-500" />

                  <span className="text-sm text-gray-700">
                    {p.rating || 4.5}
                  </span>

                  <span className="text-xs text-gray-400">
                    ({p.reviews || 0})
                  </span>
                </div>

                {/* ==========================
                    PRICE SECTION
                =========================== */}
                <div className="mt-3">
                  <h4 className="text-xl font-bold text-amber-600">
                    ৳{finalPrice.toFixed(2)}
                  </h4>

                  {discount > 0 && (
                    <p className="text-sm line-through text-gray-400">
                      ৳{price}
                    </p>
                  )}
                </div>

                {/* Stock */}
                <div className="mt-2">
                  {p.stock > 0 ? (
                    <p className="text-xs text-green-600">
                      In Stock ({p.stock})
                    </p>
                  ) : (
                    <p className="text-xs text-red-500">Out of Stock</p>
                  )}
                </div>

                {/* ==========================
                    ADD TO CART BUTTON
                =========================== */}
                <button
                  disabled={p.stock === 0}
                  onClick={() => handleAddToCart(p)}
                  className={`w-full mt-4 py-3 rounded-xl text-white flex items-center justify-center gap-2 transition duration-300

                  ${
                    p.stock > 0
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-gray-400 cursor-not-allowed"
                  }
                  `}
                >
                  <FaCartPlus />

                  {p.stock > 0 ? "Add To Cart" : "Out Of Stock"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* ==========================
          PAGINATION
      =========================== */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-12">
        {/* Prev Button */}
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-40"
        >
          Prev
        </button>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index + 1)}
            className={`w-10 h-10 rounded-xl border font-medium transition

            ${
              currentPage === index + 1
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white hover:bg-gray-100"
            }
            `}
          >
            {index + 1}
          </button>
        ))}

        {/* Next Button */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {/* ==========================
          AUTO REFRESH INDICATOR
      =========================== */}
      {isFetching && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-400 animate-pulse">
            Updating products...
          </p>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;
