import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCartPlus, FaSpinner, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";

const API = import.meta.env.VITE_API_URL;

const LIMIT = 8;

const ProductCard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const { flyToCart } = useFlyToCart();

  const [currentPage, setCurrentPage] = useState(1);
  const [addingId, setAddingId] = useState(null);

  // ============================================================
  // FETCH PRODUCTS
  // ============================================================

  const fetchProducts = async ({ queryKey, signal }) => {
    const [, page] = queryKey;

    if (!API) {
      throw new Error("API URL is not configured.");
    }

    const response = await axios.get(`${API}/products`, {
      params: {
        page,
        limit: LIMIT,
      },
      signal,
      timeout: 15000,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to fetch products.");
    }

    return response.data;
  };

  // ============================================================
  // REACT QUERY
  // ============================================================

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });

  // ============================================================
  // RESPONSE DATA
  // ============================================================

  const products = Array.isArray(data?.data) ? data.data : [];

  const pagination = data?.pagination || {};

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1);

  // ============================================================
  // PREFETCH NEXT PAGE
  // ============================================================

  useEffect(() => {
    if (currentPage >= totalPages) {
      return;
    }

    const nextPage = currentPage + 1;

    queryClient.prefetchQuery({
      queryKey: ["products", nextPage],
      queryFn: fetchProducts,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
    });
  }, [currentPage, totalPages, queryClient]);

  // ============================================================
  // PAGE NAVIGATION
  // ============================================================

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);

    setCurrentPage(safePage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart = async (product, event) => {
    event.stopPropagation();

    // ------------------------------------------
    // Authentication
    // ------------------------------------------

    if (!user) {
      addToast("Please login first.", "error");

      navigate("/login", {
        state: {
          from: {
            pathname: window.location.pathname,
          },
        },
      });

      return;
    }

    // ------------------------------------------
    // Product validation
    // ------------------------------------------

    if (!product?._id) {
      addToast("Invalid product.", "error");
      return;
    }

    const stock = Number(product.stock);

    if (!Number.isFinite(stock) || stock <= 0) {
      addToast("This product is out of stock.", "error");
      return;
    }

    // ------------------------------------------
    // Prevent duplicate click
    // ------------------------------------------

    if (addingId) {
      return;
    }

    try {
      setAddingId(String(product._id));

      // ------------------------------------------
      // Fly-to-cart elements
      // ------------------------------------------

      const productCard = event.currentTarget.closest(".product-card");

      const image = productCard?.querySelector("img");

      const cartIcon = document.querySelector(".cart-icon");

      // ------------------------------------------
      // Add cart API
      // POST /carts
      // ------------------------------------------

      const response = await axios.post(
        `${API}/carts`,
        {
          productId: product._id,
          quantity: 1,
        },
        {
          withCredentials: true,
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to add product to cart.",
        );
      }

      // ------------------------------------------
      // Success
      // ------------------------------------------

      addToast(
        `🛒 ${product.name || "Product"} added to your cart.`,
        "success",
      );

      // ------------------------------------------
      // Refresh cart related queries
      // ------------------------------------------

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["cart"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["cart-count"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["cart-summary"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["validated-cart"],
        }),
      ]);

      // ------------------------------------------
      // Fly to cart animation
      // ------------------------------------------

      if (image && cartIcon && typeof flyToCart === "function") {
        flyToCart(image, cartIcon);
      }
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

      // ------------------------------------------
      // Backend error
      // ------------------------------------------

      if (error?.response?.status === 401) {
        addToast("Please login first.", "error");

        navigate("/login", {
          state: {
            from: {
              pathname: window.location.pathname,
            },
          },
        });

        return;
      }

      if (error?.response?.status === 403) {
        addToast(
          error?.response?.data?.message ||
            "You are not allowed to add items to cart.",
          "error",
        );

        return;
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add product to cart.";

      addToast(message, "error");
    } finally {
      setAddingId(null);
    }
  };

  // ============================================================
  // LOADING UI
  // ============================================================

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />

          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: LIMIT }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="h-56 animate-pulse bg-gray-200" />

              <div className="space-y-4 p-4">
                <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />

                <div className="h-5 w-full animate-pulse rounded bg-gray-200" />

                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />

                <div className="h-8 w-28 animate-pulse rounded bg-gray-200" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="h-11 animate-pulse rounded-xl bg-gray-200" />

                  <div className="h-11 animate-pulse rounded-xl bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR UI
  // ============================================================

  if (isError) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Failed to load products
          </h2>

          <p className="mt-2 max-w-md text-sm text-gray-500">
            {error?.message || "Something went wrong while fetching products."}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-6 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching ? "Trying..." : "Try Again"}
          </button>
        </div>
      </section>
    );
  }

  // ============================================================
  // EMPTY UI
  // ============================================================

  if (!products.length) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-5xl">🍪</div>

          <h2 className="mt-4 text-2xl font-bold text-gray-800">
            No Products Found
          </h2>

          <p className="mt-2 text-gray-500">
            There are currently no products available.
          </p>
        </div>
      </section>
    );
  }

  // ============================================================
  // PRODUCT LIST
  // ============================================================

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">
            🍪 Biscuit Collection
          </h2>

          <p className="mt-2 text-gray-500">
            Fresh, crispy and delicious snacks for your everyday cravings.
          </p>
        </div>

        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FaSpinner className="animate-spin text-amber-500" />
            Updating...
          </div>
        )}
      </div>

      {/* Products */}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const productId = String(product?._id || "");

          const price = Math.max(Number(product?.price) || 0, 0);

          const discount = Math.min(
            Math.max(Number(product?.discount) || 0, 0),
            100,
          );

          const finalPrice = Number(
            (price - (price * discount) / 100).toFixed(2),
          );

          const stock = Math.max(Number(product?.stock) || 0, 0);

          const rating = Math.min(Math.max(Number(product?.rating) || 0, 0), 5);

          const reviews = Math.max(Number(product?.reviews) || 0, 0);

          const imageUrl =
            typeof product?.image === "string" ? product.image.trim() : "";

          const productName =
            typeof product?.name === "string" && product.name.trim()
              ? product.name.trim()
              : "Unnamed Product";

          const brand =
            typeof product?.brand === "string" && product.brand.trim()
              ? product.brand.trim()
              : "No Brand";

          const category =
            typeof product?.category === "string" && product.category.trim()
              ? product.category.trim()
              : "General";

          const isAdding = addingId === productId;

          return (
            <article
              key={productId}
              className="product-card group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              onClick={() => navigate(`/product/${productId}`)}
            >
              {/* Image */}

              <div className="relative h-56 overflow-hidden bg-gray-50">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={productName}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(event) => {
                      event.currentTarget.onerror = null;

                      event.currentTarget.src =
                        "https://via.placeholder.com/400x400?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    No Image
                  </div>
                )}

                {/* Discount */}

                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
                    -{discount}%
                  </span>
                )}

                {/* Hot */}

                {discount >= 15 && (
                  <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                    HOT
                  </span>
                )}
              </div>

              {/* Content */}

              <div className="p-4">
                {/* Brand */}

                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  {brand}
                </span>

                {/* Name */}

                <h3 className="mt-3 min-h-[48px] line-clamp-2 font-bold text-gray-800">
                  {productName}
                </h3>

                {/* Category */}

                <div className="mt-2">
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-600">
                    {category}
                  </span>
                </div>

                {/* Rating */}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <FaStar />

                    <span className="text-sm font-semibold text-gray-700">
                      {rating.toFixed(1)}
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">({reviews})</span>
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
                  {stock > 0 ? (
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      In Stock ({stock})
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                      Out Of Stock
                    </span>
                  )}
                </div>

                {/* Buttons */}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {/* Details */}

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      navigate(`/product/${productId}`);
                    }}
                    className="h-11 rounded-xl border font-semibold transition hover:bg-gray-100"
                  >
                    Details
                  </button>

                  {/* Cart */}

                  <button
                    type="button"
                    disabled={isAdding || stock <= 0}
                    onClick={(event) => handleAddToCart(product, event)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl font-semibold text-white transition active:scale-95 ${
                      stock > 0
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "cursor-not-allowed bg-gray-400"
                    }`}
                  >
                    {isAdding ? (
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
            </article>
          );
        })}
      </div>

      {/* Pagination */}

      {totalPages > 1 && (
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {/* Previous */}

          <button
            type="button"
            disabled={currentPage === 1 || isFetching}
            onClick={() => goToPage(currentPage - 1)}
            className="rounded-xl border px-4 py-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {/* Page Numbers */}

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                type="button"
                key={page}
                disabled={isFetching}
                onClick={() => goToPage(page)}
                className={`h-10 w-10 rounded-xl font-semibold transition ${
                  currentPage === page
                    ? "bg-amber-500 text-white"
                    : "border hover:bg-gray-100"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {page}
              </button>
            ),
          )}

          {/* Next */}

          <button
            type="button"
            disabled={currentPage === totalPages || isFetching}
            onClick={() => goToPage(currentPage + 1)}
            className="rounded-xl border px-4 py-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Fetching indicator */}

      {isFetching && !isLoading && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border bg-white px-5 py-3 text-sm text-gray-600 shadow">
            <FaSpinner className="animate-spin text-amber-500" />
            Loading products...
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductCard;
