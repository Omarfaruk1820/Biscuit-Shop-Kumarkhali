import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaCartPlus,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaStar,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const PRODUCTS_PER_PAGE = 8;

const PRODUCTS_STALE_TIME = 1000 * 60 * 2;
const PRODUCTS_GC_TIME = 1000 * 60 * 10;

// ============================================================
// API
// ============================================================

const fetchProducts = async ({ queryKey, signal }) => {
  const [, page] = queryKey;

  if (!API_URL) {
    throw new Error("API URL is not configured. Please check VITE_API_URL.");
  }

  const response = await axios.get(`${API_URL}/products`, {
    params: {
      page,
      limit: PRODUCTS_PER_PAGE,
    },
    signal,
    timeout: 15000,
  });

  if (!response?.data?.success) {
    throw new Error(response?.data?.message || "Failed to load products.");
  }

  if (!Array.isArray(response?.data?.data)) {
    throw new Error("Invalid products response from server.");
  }

  return response.data;
};

// ============================================================
// HELPERS
// ============================================================

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const normalizeText = (value, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }

  const text = value.trim();

  return text || fallback;
};

const getFinalPrice = (price, discount) => {
  const safePrice = Math.max(safeNumber(price), 0);

  const safeDiscount = Math.min(Math.max(safeNumber(discount), 0), 100);

  const finalPrice = safePrice - (safePrice * safeDiscount) / 100;

  return Math.max(Number(finalPrice.toFixed(2)), 0);
};

// ============================================================
// COMPONENT
// ============================================================

const ProductCard = () => {
  // ==========================================================
  // ROUTER
  // ==========================================================

  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================================
  // REACT QUERY
  // ==========================================================

  const queryClient = useQueryClient();

  // ==========================================================
  // AUTH
  // ==========================================================

  const { user } = useContext(AuthContext);

  // ==========================================================
  // TOAST
  // ==========================================================

  const { addToast } = useToast();

  // ==========================================================
  // FLY TO CART
  // ==========================================================

  const { flyToCart } = useFlyToCart();

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  const [currentPage, setCurrentPage] = useState(1);
  const [addingProductId, setAddingProductId] = useState(null);

  // ==========================================================
  // PRODUCTS QUERY
  // ==========================================================

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["products", currentPage],

    queryFn: fetchProducts,

    staleTime: PRODUCTS_STALE_TIME,

    gcTime: PRODUCTS_GC_TIME,

    retry: 1,

    refetchOnWindowFocus: false,

    refetchOnReconnect: true,

    placeholderData: (previousData) => previousData,
  });

  // ==========================================================
  // RESPONSE DATA
  // ==========================================================

  const products = Array.isArray(data?.data) ? data.data : [];

  const pagination =
    data?.pagination && typeof data.pagination === "object"
      ? data.pagination
      : {};

  const total = Math.max(safeNumber(pagination.total, 0), 0);

  const totalPages = Math.max(Math.ceil(total / PRODUCTS_PER_PAGE), 1);

  // ==========================================================
  // PREFETCH NEXT PAGE
  // ==========================================================

  useEffect(() => {
    if (currentPage >= totalPages) {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: ["products", currentPage + 1],

      queryFn: fetchProducts,

      staleTime: PRODUCTS_STALE_TIME,

      gcTime: PRODUCTS_GC_TIME,
    });
  }, [currentPage, totalPages, queryClient]);

  // ==========================================================
  // PAGE NAVIGATION
  // ==========================================================

  const goToPage = (page) => {
    const numericPage = Number(page);

    if (!Number.isFinite(numericPage)) {
      return;
    }

    const safePage = Math.min(Math.max(Math.floor(numericPage), 1), totalPages);

    if (safePage === currentPage) {
      return;
    }

    setCurrentPage(safePage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // LOGIN REDIRECT
  // ==========================================================

  const redirectToLogin = () => {
    navigate("/login", {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
        },
      },
    });
  };

  // ==========================================================
  // PRODUCT DETAILS
  // ==========================================================

  const openProductDetails = (productId) => {
    if (!productId) {
      return;
    }

    navigate(`/product/${productId}`);
  };

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart = async (product, event) => {
    event.stopPropagation();

    // --------------------------------------------------------
    // API CONFIGURATION
    // --------------------------------------------------------

    if (!API_URL) {
      addToast("API URL is not configured.", "error");

      return;
    }

    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    if (!user) {
      addToast("Please login before adding products to your cart.", "warning");

      redirectToLogin();

      return;
    }

    // --------------------------------------------------------
    // PRODUCT ID
    // --------------------------------------------------------

    const productId = String(product?._id || "").trim();

    if (!productId) {
      addToast("This product has an invalid ID.", "error");

      return;
    }

    // --------------------------------------------------------
    // STOCK
    // --------------------------------------------------------

    const stock = Math.max(safeNumber(product?.stock), 0);

    if (stock <= 0) {
      addToast("This product is currently out of stock.", "warning");

      return;
    }

    // --------------------------------------------------------
    // PREVENT DUPLICATE REQUESTS
    // --------------------------------------------------------

    if (addingProductId !== null) {
      return;
    }

    setAddingProductId(productId);

    // --------------------------------------------------------
    // FLY TO CART ELEMENTS
    // --------------------------------------------------------

    const productCard = event.currentTarget.closest(".product-card");

    const productImage = productCard?.querySelector("img");

    const cartIcon = document.querySelector(".cart-icon");

    try {
      // ------------------------------------------------------
      // POST /carts
      // ------------------------------------------------------

      const response = await axios.post(
        `${API_URL}/carts`,
        {
          productId,
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

      // ------------------------------------------------------
      // RESPONSE VALIDATION
      // ------------------------------------------------------

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Failed to add product to cart.",
        );
      }

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      const productName = normalizeText(product?.name, "Product");

      addToast(`${productName} added to your cart.`, "success");

      // ------------------------------------------------------
      // INVALIDATE CART QUERIES
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // FLY TO CART
      // ------------------------------------------------------

      if (productImage && cartIcon && typeof flyToCart === "function") {
        flyToCart(productImage, cartIcon);
      }
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

      const status = error?.response?.status;

      const serverMessage = error?.response?.data?.message;

      // ------------------------------------------------------
      // 401
      // ------------------------------------------------------

      if (status === 401) {
        addToast("Your session has expired. Please login again.", "warning");

        redirectToLogin();

        return;
      }

      // ------------------------------------------------------
      // 403
      // ------------------------------------------------------

      if (status === 403) {
        addToast(
          serverMessage ||
            "You are not allowed to add this product to the cart.",
          "error",
        );

        return;
      }

      // ------------------------------------------------------
      // 404
      // ------------------------------------------------------

      if (status === 404) {
        addToast(
          serverMessage || "This product is no longer available.",
          "error",
        );

        return;
      }

      // ------------------------------------------------------
      // 409
      // ------------------------------------------------------

      if (status === 409) {
        addToast(
          serverMessage || "The requested quantity is not currently available.",
          "warning",
        );

        return;
      }

      // ------------------------------------------------------
      // 422
      // ------------------------------------------------------

      if (status === 422) {
        addToast(serverMessage || "Invalid cart information.", "warning");

        return;
      }

      // ------------------------------------------------------
      // 500
      // ------------------------------------------------------

      if (status >= 500) {
        addToast("Server error. Please try again later.", "error");

        return;
      }

      // ------------------------------------------------------
      // NETWORK / GENERIC
      // ------------------------------------------------------

      if (!error?.response) {
        addToast("Unable to connect to the server.", "error");

        return;
      }

      addToast(
        serverMessage || error?.message || "Failed to add product to cart.",
        "error",
      );
    } finally {
      setAddingProductId(null);
    }
  };

  // ==========================================================
  // PAGINATION BUTTONS
  // ==========================================================

  const paginationPages = useMemo(() => {
    const pages = [];

    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [totalPages]);

  // ==========================================================
  // LOADING UI
  // ==========================================================

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded bg-base-300" />

          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-base-300" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({
            length: PRODUCTS_PER_PAGE,
          }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="h-56 animate-pulse bg-base-300" />

              <div className="space-y-4 p-4">
                <div className="h-6 w-24 animate-pulse rounded bg-base-300" />

                <div className="h-5 w-full animate-pulse rounded bg-base-300" />

                <div className="h-5 w-3/4 animate-pulse rounded bg-base-300" />

                <div className="h-4 w-20 animate-pulse rounded bg-base-300" />

                <div className="h-8 w-28 animate-pulse rounded bg-base-300" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="h-11 animate-pulse rounded-xl bg-base-300" />

                  <div className="h-11 animate-pulse rounded-xl bg-base-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  //   {
  //   "version": 2,
  //   "builds": [
  //     {
  //       "src": "index.js",
  //       "use": "@vercel/node"
  //     }
  //   ],
  //   "routes": [
  //     {
  //       "src": "/(.*)",
  //       "dest": "/index.js"
  //     }
  //   ]
  // }

  // ==========================================================
  // ERROR UI
  // ==========================================================

  if (isError) {
    const statusCode = error?.response?.status;

    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong while loading products.";

    return (
      <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex max-w-lg flex-col items-center text-center">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-4 text-2xl font-bold">Failed to load products</h2>

          <p className="mt-2 text-sm text-base-content/60">{errorMessage}</p>

          {statusCode && (
            <p className="mt-2 text-xs text-base-content/40">
              Server status: {statusCode}
            </p>
          )}

          <p className="mt-3 break-all text-xs text-base-content/40">
            API: {API_URL}/products
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-6 flex h-11 items-center gap-2 rounded-xl bg-warning px-6 font-semibold text-warning-content transition hover:bg-warning/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching ? (
              <>
                <FaSpinner className="animate-spin" />
                Trying...
              </>
            ) : (
              "Try Again"
            )}
          </button>
        </div>
      </section>
    );
  }

  // ==========================================================
  // EMPTY UI
  // ==========================================================

  if (products.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="text-5xl">🍪</div>

          <h2 className="mt-4 text-2xl font-bold">No Products Found</h2>

          <p className="mt-2 text-base-content/60">
            There are currently no products available.
          </p>
        </div>
      </section>
    );
  }

  // ==========================================================
  // PRODUCT LIST
  // ==========================================================

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-extrabold">🍪 Biscuit Collection</h2>

          <p className="mt-2 text-base-content/60">
            Fresh, crispy and delicious snacks for your everyday cravings.
          </p>
        </div>

        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-base-content/60">
            <FaSpinner className="animate-spin text-warning" />
            Updating...
          </div>
        )}
      </div>

      {/* ======================================================
          PRODUCT GRID
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const productId = String(product?._id || "").trim();

          if (!productId) {
            return null;
          }

          // ----------------------------------------------------
          // PRODUCT VALUES
          // ----------------------------------------------------

          const price = Math.max(safeNumber(product?.price), 0);

          const discount = Math.min(
            Math.max(safeNumber(product?.discount), 0),
            100,
          );

          const finalPrice = getFinalPrice(price, discount);

          const stock = Math.max(safeNumber(product?.stock), 0);

          const rating = Math.min(Math.max(safeNumber(product?.rating), 0), 5);

          const reviews = Math.max(safeNumber(product?.reviews), 0);

          const imageUrl = normalizeText(product?.image, "");

          const productName = normalizeText(product?.name, "Unnamed Product");

          const brand = normalizeText(product?.brand, "No Brand");

          const category = normalizeText(product?.category, "General");

          const isAdding = addingProductId === productId;

          // ----------------------------------------------------
          // CARD
          // ----------------------------------------------------

          return (
            <article
              key={productId}
              className="product-card group cursor-pointer overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              onClick={() => openProductDetails(productId)}
            >
              {/* ==================================================
                  IMAGE
              ================================================== */}

              <div className="relative h-56 overflow-hidden bg-base-200">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={productName}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-base-content/40">
                    No Image
                  </div>
                )}

                {/* DISCOUNT */}

                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-error px-3 py-1 text-xs font-bold text-error-content shadow">
                    -{discount}%
                  </span>
                )}

                {/* HOT */}

                {discount >= 15 && (
                  <span className="absolute right-3 top-3 rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-content shadow">
                    HOT
                  </span>
                )}
              </div>

              {/* ==================================================
                  CONTENT
              ================================================== */}

              <div className="p-4">
                {/* BRAND */}

                <span className="inline-flex max-w-full rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                  <span className="truncate">{brand}</span>
                </span>

                {/* NAME */}

                <h3 className="mt-3 min-h-[48px] line-clamp-2 font-bold">
                  {productName}
                </h3>

                {/* CATEGORY */}

                <div className="mt-2">
                  <span className="inline-flex rounded-full bg-base-200 px-3 py-1 text-xs capitalize text-base-content/60">
                    {category}
                  </span>
                </div>

                {/* RATING */}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-warning">
                    <FaStar />

                    <span className="text-sm font-semibold">
                      {rating.toFixed(1)}
                    </span>
                  </div>

                  <span className="text-xs text-base-content/40">
                    ({reviews})
                  </span>
                </div>

                {/* PRICE */}

                <div className="mt-4">
                  <h4 className="text-2xl font-bold text-warning">
                    ৳{finalPrice.toFixed(2)}
                  </h4>

                  {discount > 0 && (
                    <p className="text-sm text-base-content/40 line-through">
                      ৳{price.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* STOCK */}

                <div className="mt-3">
                  {stock > 0 ? (
                    <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                      In Stock ({stock})
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-error/10 px-3 py-1 text-xs font-medium text-error">
                      Out Of Stock
                    </span>
                  )}
                </div>

                {/* ==================================================
                    BUTTONS
                ================================================== */}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {/* DETAILS */}

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      openProductDetails(productId);
                    }}
                    className="h-11 rounded-xl border border-base-300 font-semibold transition hover:bg-base-200"
                  >
                    Details
                  </button>

                  {/* CART */}

                  <button
                    type="button"
                    disabled={isAdding || stock <= 0}
                    onClick={(event) => handleAddToCart(product, event)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-95 ${
                      stock > 0
                        ? "bg-warning text-warning-content hover:bg-warning/90"
                        : "cursor-not-allowed bg-base-300 text-base-content/40"
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

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {totalPages > 1 && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {/* PREVIOUS */}

          <button
            type="button"
            disabled={currentPage === 1 || isFetching}
            onClick={() => goToPage(currentPage - 1)}
            className="flex items-center gap-2 rounded-xl border border-base-300 px-4 py-2 font-medium transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaChevronLeft />
            Previous
          </button>

          {/* PAGE NUMBERS */}

          {paginationPages.map((page) => (
            <button
              type="button"
              key={page}
              disabled={isFetching}
              onClick={() => goToPage(page)}
              className={`h-10 w-10 rounded-xl font-semibold transition ${
                currentPage === page
                  ? "bg-warning text-warning-content"
                  : "border border-base-300 hover:bg-base-200"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {page}
            </button>
          ))}

          {/* NEXT */}

          <button
            type="button"
            disabled={currentPage === totalPages || isFetching}
            onClick={() => goToPage(currentPage + 1)}
            className="flex items-center gap-2 rounded-xl border border-base-300 px-4 py-2 font-medium transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* ======================================================
          FETCHING INDICATOR
      ====================================================== */}

      {isFetching && !isLoading && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-base-300 bg-base-100 px-5 py-3 text-sm text-base-content/60 shadow-sm">
            <FaSpinner className="animate-spin text-warning" />
            Loading products...
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductCard;
