import { useContext, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  FaCartPlus,
  FaChevronLeft,
  FaChevronRight,
  FaFire,
  FaSpinner,
  FaStar,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

// ============================================================
// CONFIG
// ============================================================

const API_URL = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const PRODUCTS_PER_PAGE = 8;
const REQUEST_TIMEOUT = 15000;

const PRODUCTS_STALE_TIME = 1000 * 60 * 2;
const PRODUCTS_GC_TIME = 1000 * 60 * 10;

// ============================================================
// HELPERS
// ============================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const getText = (value, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }

  const text = value.trim();

  return text || fallback;
};

const getPrice = (value) => {
  return Math.max(toNumber(value), 0);
};

const getDiscount = (value) => {
  return Math.min(Math.max(toNumber(value), 0), 100);
};

const getStock = (value) => {
  return Math.max(Math.floor(toNumber(value)), 0);
};

const getRating = (value) => {
  return Math.min(Math.max(toNumber(value), 0), 5);
};

const getReviews = (value) => {
  return Math.max(Math.floor(toNumber(value)), 0);
};

const getFinalPrice = (price, discount) => {
  const finalPrice = price - (price * discount) / 100;

  return Math.max(Number(finalPrice.toFixed(2)), 0);
};

const getProductId = (product) => {
  return String(product?._id || "").trim();
};

const getPaginationPages = (currentPage, totalPages) => {
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let start = Math.max(currentPage - 2, 1);

  let end = Math.min(start + maxVisiblePages - 1, totalPages);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(end - maxVisiblePages + 1, 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

// ============================================================
// API
// ============================================================

const fetchProducts = async ({ queryKey, signal }) => {
  const [, page] = queryKey;

  if (!API_URL) {
    throw new Error("API URL is not configured.");
  }

  const safePage = Math.max(Number(page) || 1, 1);

  const response = await axios.get(`${API_URL}/products`, {
    params: {
      page: safePage,
      limit: PRODUCTS_PER_PAGE,
    },
    signal,
    timeout: REQUEST_TIMEOUT,
    headers: {
      Accept: "application/json",
    },
  });

  const result = response?.data;

  if (!result?.success) {
    throw new Error(result?.message || "Failed to load products.");
  }

  if (!Array.isArray(result?.data)) {
    throw new Error("Invalid products response.");
  }

  return {
    products: result.data,
    pagination: result.pagination || {},
  };
};

// ============================================================
// COMPONENT
// ============================================================

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user } = useContext(AuthContext);
  const { addToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [addingProductId, setAddingProductId] = useState(null);

  // ==========================================================
  // PRODUCTS QUERY
  // ==========================================================

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: fetchProducts,
    enabled: Boolean(API_URL),
    staleTime: PRODUCTS_STALE_TIME,
    gcTime: PRODUCTS_GC_TIME,
    placeholderData: keepPreviousData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // ==========================================================
  // RESPONSE DATA
  // ==========================================================

  const products = Array.isArray(data?.products) ? data.products : [];

  const pagination = data?.pagination || {};

  const total = Math.max(toNumber(pagination.total), 0);

  const calculatedTotalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  const totalPages = Math.max(
    toNumber(pagination.totalPages, calculatedTotalPages),
    1,
  );

  const paginationPages = useMemo(
    () => getPaginationPages(currentPage, totalPages),
    [currentPage, totalPages],
  );

  // ==========================================================
  // KEEP PAGE VALID
  // ==========================================================

  const safeCurrentPage = Math.min(currentPage, totalPages);

  // ==========================================================
  // LOGIN REDIRECT
  // ==========================================================

  const redirectToLogin = () => {
    navigate("/login", {
      state: {
        from: {
          pathname: "/",
        },
      },
    });
  };

  // ==========================================================
  // PRODUCT DETAILS
  // ==========================================================

  const openProductDetails = (productId) => {
    const id = String(productId || "").trim();

    if (!id) {
      return;
    }

    navigate(`/product/${id}`);
  };

  // ==========================================================
  // PAGE NAVIGATION
  // ==========================================================

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);

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
  // ADD TO CART
  // ==========================================================

  const handleAddToCart = async (product, event) => {
    event?.stopPropagation();

    if (!API_URL) {
      addToast("API URL is not configured.", "error");

      return;
    }

    if (!user) {
      addToast("Please login before adding products to your cart.", "warning");

      redirectToLogin();

      return;
    }

    const productId = getProductId(product);

    if (!productId) {
      addToast("This product has an invalid ID.", "error");

      return;
    }

    const stock = getStock(product?.stock);

    if (stock <= 0) {
      addToast("This product is currently out of stock.", "warning");

      return;
    }

    if (addingProductId !== null) {
      return;
    }

    try {
      setAddingProductId(productId);

      const response = await axios.post(
        `${API_URL}/carts`,
        {
          productId,
          quantity: 1,
        },
        {
          withCredentials: true,
          timeout: REQUEST_TIMEOUT,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      const result = response?.data;

      if (!result?.success) {
        throw new Error(result?.message || "Failed to add product to cart.");
      }

      const productName = getText(product?.name, "Product");

      addToast(`${productName} added to your cart.`, "success");

      // Refresh every cart-related query used
      // throughout the application.
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
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

      if (axios.isCancel(error)) {
        return;
      }

      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to add product to cart.";

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
          message || "You are not allowed to add this product.",
          "error",
        );

        return;
      }

      // ------------------------------------------------------
      // 404
      // ------------------------------------------------------

      if (status === 404) {
        addToast(message || "This product is no longer available.", "error");

        return;
      }

      // ------------------------------------------------------
      // 409
      // ------------------------------------------------------

      if (status === 409) {
        addToast(
          message || "The requested quantity is not available.",
          "warning",
        );

        return;
      }

      // ------------------------------------------------------
      // 422
      // ------------------------------------------------------

      if (status === 422) {
        addToast(message || "Invalid cart information.", "warning");

        return;
      }

      // ------------------------------------------------------
      // SERVER ERROR
      // ------------------------------------------------------

      if (typeof status === "number" && status >= 500) {
        addToast("Server error. Please try again later.", "error");

        return;
      }

      // ------------------------------------------------------
      // NETWORK ERROR
      // ------------------------------------------------------

      if (!error?.response) {
        addToast("Unable to connect to the server.", "error");

        return;
      }

      addToast(message, "error");
    } finally {
      setAddingProductId(null);
    }
  };

  // ==========================================================
  // API CONFIG ERROR
  // ==========================================================

  if (!API_URL) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-16">
        <div className="max-w-xl text-center">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-5 text-3xl font-bold">API Configuration Error</h2>

          <p className="mt-3 text-base-content/60">
            The product API URL has not been configured.
          </p>

          <div className="mt-5 rounded-xl bg-base-200 px-4 py-3">
            <p className="break-all text-xs text-base-content/50">
              VITE_API_URL is missing.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // INITIAL LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header skeleton */}

        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-9 w-72 animate-pulse rounded-lg bg-base-300" />

            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-base-300" />
          </div>

          <div className="flex items-center gap-2 text-sm text-base-content/50">
            <FaSpinner className="animate-spin" />
            Loading featured products...
          </div>
        </div>

        {/* Product skeletons */}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({
            length: PRODUCTS_PER_PAGE,
          }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="h-60 animate-pulse bg-base-300" />

              <div className="space-y-4 p-5">
                <div className="h-6 w-24 animate-pulse rounded bg-base-300" />

                <div className="h-5 w-full animate-pulse rounded bg-base-300" />

                <div className="h-5 w-3/4 animate-pulse rounded bg-base-300" />

                <div className="h-5 w-20 animate-pulse rounded bg-base-300" />

                <div className="h-8 w-32 animate-pulse rounded bg-base-300" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="h-11 animate-pulse rounded-xl bg-base-300" />

                  <div className="h-11 animate-pulse rounded-xl bg-base-300" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading spinner */}

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-base-300 bg-base-100 px-5 py-3 text-sm shadow-sm">
            <FaSpinner className="animate-spin text-warning" />

            <span>Fetching products from server...</span>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (isError) {
    const status = error?.response?.status;

    let errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong while loading products.";

    if (status === 404) {
      errorMessage = "Products API route was not found.";
    }

    if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
      errorMessage = "The server request timed out. Please try again.";
    }

    if (typeof status === "number" && status >= 500) {
      errorMessage =
        "The server is currently unavailable. Please try again later.";
    }

    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl text-center">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-5 text-3xl font-bold">
            Failed to Load Featured Products
          </h2>

          <p className="mt-3 leading-7 text-base-content/60">{errorMessage}</p>

          {status && (
            <p className="mt-2 text-xs text-base-content/40">
              Server status: {status}
            </p>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-warning px-6 font-semibold text-warning-content transition hover:bg-warning/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching && <FaSpinner className="animate-spin" />}

            {isFetching ? "Trying..." : "Try Again"}
          </button>
        </div>
      </section>
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (products.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-5xl">🍪</div>

          <h2 className="mt-5 text-3xl font-bold">No Featured Products</h2>

          <p className="mt-3 text-base-content/60">
            There are currently no products available.
          </p>
        </div>
      </section>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              🍪 Featured Products
            </h2>

            <span className="hidden rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning sm:inline-flex">
              Fresh Picks
            </span>
          </div>

          <p className="mt-3 text-base-content/60">
            Fresh snacks, biscuits, cookies and delicious grocery products.
          </p>
        </div>

        {isFetching && (
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
          const productId = getProductId(product);

          if (!productId) {
            return null;
          }

          const price = getPrice(product?.price);

          const discount = getDiscount(product?.discount);

          const finalPrice = getFinalPrice(price, discount);

          const stock = getStock(product?.stock);

          const rating = getRating(product?.rating);

          const reviews = getReviews(product?.reviews);

          const name = getText(product?.name, "Unnamed Product");

          const brand = getText(product?.brand, "No Brand");

          const category = getText(product?.category, "General");

          const image = getText(product?.image);

          const isAdding = addingProductId === productId;

          return (
            <article
              key={productId}
              className="group overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* ==================================================
                  IMAGE
              ================================================== */}

              <Link to={`/product/${productId}`} className="block">
                <div className="relative h-60 overflow-hidden bg-base-200">
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-110"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-base-content/40">
                      No Image
                    </div>
                  )}

                  {/* Discount */}

                  {discount > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-error px-3 py-1 text-xs font-bold text-error-content shadow">
                      -{discount}%
                    </span>
                  )}

                  {/* Hot */}

                  {discount >= 15 && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-content shadow">
                      <FaFire />
                      Hot
                    </span>
                  )}
                </div>
              </Link>

              {/* ==================================================
                  CONTENT
              ================================================== */}

              <div className="p-4">
                {/* Brand */}

                <span className="inline-flex max-w-full rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                  <span className="truncate">{brand}</span>
                </span>

                {/* Name */}

                <Link to={`/product/${productId}`} className="block">
                  <h3 className="mt-3 min-h-[48px] line-clamp-2 font-bold transition hover:text-warning">
                    {name}
                  </h3>
                </Link>

                {/* Category */}

                <div className="mt-3">
                  <span className="inline-flex rounded-full bg-base-200 px-3 py-1 text-xs capitalize text-base-content/60">
                    {category}
                  </span>
                </div>

                {/* Rating */}

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

                {/* Price */}

                <div className="mt-4">
                  <h4 className="text-2xl font-extrabold text-warning">
                    ৳{finalPrice.toFixed(2)}
                  </h4>

                  {discount > 0 && (
                    <p className="text-sm text-base-content/40 line-through">
                      ৳{price.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Stock */}

                <div className="mt-3">
                  {stock > 0 ? (
                    <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                      In Stock ({stock})
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-error/10 px-3 py-1 text-xs font-semibold text-error">
                      Out Of Stock
                    </span>
                  )}
                </div>

                {/* Buttons */}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    to={`/product/${productId}`}
                    className="flex h-11 items-center justify-center rounded-xl border border-base-300 font-semibold transition hover:bg-base-200"
                  >
                    Details
                  </Link>

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
                    ) : stock > 0 ? (
                      <>
                        <FaCartPlus />
                        Cart
                      </>
                    ) : (
                      "Unavailable"
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
          {/* Previous */}

          <button
            type="button"
            disabled={safeCurrentPage === 1 || isFetching}
            onClick={() => goToPage(safeCurrentPage - 1)}
            className="flex items-center gap-2 rounded-xl border border-base-300 px-4 py-2 font-medium transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaChevronLeft />
            Previous
          </button>

          {/* Page Numbers */}

          {paginationPages.map((page) => (
            <button
              type="button"
              key={page}
              disabled={isFetching}
              onClick={() => goToPage(page)}
              className={`h-10 w-10 rounded-xl font-semibold transition ${
                safeCurrentPage === page
                  ? "bg-warning text-warning-content"
                  : "border border-base-300 hover:bg-base-200"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {page}
            </button>
          ))}

          {/* Next */}

          <button
            type="button"
            disabled={safeCurrentPage === totalPages || isFetching}
            onClick={() => goToPage(safeCurrentPage + 1)}
            className="flex items-center gap-2 rounded-xl border border-base-300 px-4 py-2 font-medium transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* ======================================================
          FETCHING SPINNER
      ====================================================== */}

      {isFetching && !isLoading && (
        <div className="mt-7 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-base-300 bg-base-100 px-5 py-3 text-sm text-base-content/60 shadow-sm">
            <FaSpinner className="animate-spin text-warning" />
            Loading products...
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;
