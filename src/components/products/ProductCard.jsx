import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  FaCartPlus,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaStar,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import axiosSecure from "../../hooks/axiosSecure";
import { useFlyToCart } from "../../hooks/useFlyToCart";

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

const getProductId = (product) => {
  return String(product?._id || "").trim();
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
// FETCH PRODUCTS
// ============================================================

const fetchProducts = async ({ queryKey, signal }) => {
  const [, page] = queryKey;

  if (!API_URL) {
    throw new Error("API URL is not configured.");
  }

  const safePage = Math.max(Number(page) || 1, 1);

  const response = await axiosSecure.get("/products", {
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
// PRODUCT CARD
// ============================================================

const ProductCard = () => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { user, loading: authLoading } = useContext(AuthContext);

  const { addToast } = useToast();

  const { flyToCart } = useFlyToCart();

  const [currentPage, setCurrentPage] = useState(1);

  const [addingProductId, setAddingProductId] = useState(null);

  // ==========================================================
  // PRODUCTS QUERY
  // ==========================================================

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["products", currentPage],

    queryFn: fetchProducts,

    enabled: Boolean(API_URL),

    placeholderData: keepPreviousData,

    staleTime: PRODUCTS_STALE_TIME,

    gcTime: PRODUCTS_GC_TIME,

    retry: 1,

    refetchOnWindowFocus: false,

    refetchOnReconnect: true,
  });

  // ==========================================================
  // PRODUCTS
  // ==========================================================

  const products = useMemo(() => {
    return Array.isArray(data?.products) ? data.products : [];
  }, [data?.products]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const pagination = useMemo(() => {
    return data?.pagination || {};
  }, [data?.pagination]);

  const total = Math.max(toNumber(pagination.total), 0);

  const totalPagesFromTotal =
    total > 0 ? Math.ceil(total / PRODUCTS_PER_PAGE) : 0;

  const totalPages = Math.max(
    Math.floor(toNumber(pagination.totalPages, totalPagesFromTotal)),
    1,
  );

  const paginationPages = useMemo(() => {
    return getPaginationPages(currentPage, totalPages);
  }, [currentPage, totalPages]);

  // ==========================================================
  // KEEP CURRENT PAGE VALID
  // ==========================================================

  useEffect(() => {
    if (!isLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, isLoading]);

  // ==========================================================
  // PREFETCH NEXT PAGE
  // ==========================================================

  useEffect(() => {
    if (!API_URL || isLoading || currentPage >= totalPages) {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: ["products", currentPage + 1],

      queryFn: fetchProducts,

      staleTime: PRODUCTS_STALE_TIME,

      gcTime: PRODUCTS_GC_TIME,
    });
  }, [currentPage, totalPages, isLoading, queryClient]);

  // ==========================================================
  // PAGE NAVIGATION
  // ==========================================================

  const goToPage = useCallback(
    (page) => {
      const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);

      if (safePage === currentPage) {
        return;
      }

      setCurrentPage(safePage);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    [currentPage, totalPages],
  );

  // ==========================================================
  // PRODUCT DETAILS
  // ==========================================================

  const openProductDetails = useCallback(
    (productId) => {
      const id = String(productId || "").trim();

      if (!id) {
        return;
      }

      navigate(`/product/${id}`);
    },
    [navigate],
  );

  // ==========================================================
  // REDIRECT TO LOGIN
  // ==========================================================

  const redirectToLogin = useCallback(() => {
    navigate("/login", {
      state: {
        from: {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        },
      },
    });
  }, [navigate]);

  // ==========================================================
  // INVALIDATE CART QUERIES
  // ==========================================================

  const invalidateCartQueries = useCallback(async () => {
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
  }, [queryClient]);

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart = useCallback(
    async (product, event) => {
      event?.stopPropagation();

      // ------------------------------------------------------
      // API CONFIGURATION
      // ------------------------------------------------------

      if (!API_URL) {
        addToast("API URL is not configured.", "error");

        return;
      }

      // ------------------------------------------------------
      // AUTH LOADING
      // ------------------------------------------------------

      if (authLoading) {
        return;
      }

      // ------------------------------------------------------
      // AUTHENTICATION
      // ------------------------------------------------------

      if (!user) {
        addToast(
          "Please login before adding products to your cart.",
          "warning",
        );

        redirectToLogin();

        return;
      }

      // ------------------------------------------------------
      // PRODUCT ID
      // ------------------------------------------------------

      const productId = getProductId(product);

      if (!productId) {
        addToast("This product has an invalid ID.", "error");

        return;
      }

      // ------------------------------------------------------
      // STOCK
      // ------------------------------------------------------

      const stock = getStock(product?.stock);

      if (stock <= 0) {
        addToast("This product is currently out of stock.", "warning");

        return;
      }

      // ------------------------------------------------------
      // PREVENT DUPLICATE REQUESTS
      // ------------------------------------------------------

      if (addingProductId !== null) {
        return;
      }

      setAddingProductId(productId);

      // ------------------------------------------------------
      // FLY TO CART ELEMENTS
      // ------------------------------------------------------

      const productCard = event?.currentTarget?.closest?.(".product-card");

      const productImage = productCard?.querySelector("img");

      const cartIcon = document.querySelector(".cart-icon");

      try {
        // ----------------------------------------------------
        // ADD / UPDATE CART
        //
        // axiosSecure automatically attaches:
        // Authorization: Bearer <Firebase ID Token>
        // ----------------------------------------------------

        const response = await axiosSecure.post(
          "/carts",
          {
            productId,
            quantity: 1,
          },
          {
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

        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        const productName = getText(product?.name, "Product");

        addToast(`${productName} added to your cart.`, "success");

        // ----------------------------------------------------
        // REFRESH CART CACHE
        // ----------------------------------------------------

        await invalidateCartQueries();

        // ----------------------------------------------------
        // FLY TO CART ANIMATION
        // ----------------------------------------------------

        if (productImage && cartIcon && typeof flyToCart === "function") {
          try {
            flyToCart(productImage, cartIcon);
          } catch (animationError) {
            console.warn("Fly-to-cart animation failed:", animationError);
          }
        }
      } catch (error) {
        console.error(
          "ADD TO CART ERROR:",
          error?.response?.data || error?.message || error,
        );

        const status = error?.response?.status;

        const serverMessage = error?.response?.data?.message;

        // ----------------------------------------------------
        // UNAUTHORIZED
        // ----------------------------------------------------

        if (status === 401) {
          addToast("Your session has expired. Please login again.", "warning");

          redirectToLogin();

          return;
        }

        // ----------------------------------------------------
        // FORBIDDEN
        // ----------------------------------------------------

        if (status === 403) {
          addToast(
            serverMessage || "You are not allowed to add this product.",
            "error",
          );

          return;
        }

        // ----------------------------------------------------
        // NOT FOUND
        // ----------------------------------------------------

        if (status === 404) {
          addToast(
            serverMessage || "This product is no longer available.",
            "error",
          );

          return;
        }

        // ----------------------------------------------------
        // CONFLICT / STOCK
        // ----------------------------------------------------

        if (status === 409) {
          addToast(
            serverMessage || "The requested quantity is not available.",
            "warning",
          );

          return;
        }

        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (status === 400 || status === 422) {
          addToast(serverMessage || "Invalid cart information.", "warning");

          return;
        }

        // ----------------------------------------------------
        // SERVER ERROR
        // ----------------------------------------------------

        if (typeof status === "number" && status >= 500) {
          addToast("Server error. Please try again later.", "error");

          return;
        }

        // ----------------------------------------------------
        // TIMEOUT
        // ----------------------------------------------------

        if (error?.code === "ECONNABORTED") {
          addToast("The request timed out. Please try again.", "error");

          return;
        }

        // ----------------------------------------------------
        // NETWORK
        // ----------------------------------------------------

        if (!error?.response) {
          addToast("Unable to connect to the server.", "error");

          return;
        }

        // ----------------------------------------------------
        // FALLBACK
        // ----------------------------------------------------

        addToast(
          serverMessage || error?.message || "Failed to add product to cart.",
          "error",
        );
      } finally {
        setAddingProductId(null);
      }
    },
    [
      API_URL,
      authLoading,
      user,
      addingProductId,
      addToast,
      redirectToLogin,
      invalidateCartQueries,
      flyToCart,
    ],
  );

  // ==========================================================
  // INITIAL LOADING
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

  // ==========================================================
  // API CONFIGURATION ERROR
  // ==========================================================

  if (!API_URL) {
    return (
      <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl text-center">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-4 text-2xl font-bold">API Configuration Error</h2>

          <p className="mt-2 text-sm leading-6 text-base-content/60">
            VITE_API_URL is not configured.
          </p>
        </div>
      </section>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (isError) {
    const status = error?.response?.status;

    let message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong while loading products.";

    if (status === 404) {
      message = "Products API route was not found.";
    }

    if (error?.code === "ECONNABORTED") {
      message = "The server request timed out. Please try again.";
    }

    return (
      <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl text-center">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-4 text-2xl font-bold">Failed to load products</h2>

          <p className="mt-2 text-sm leading-6 text-base-content/60">
            {message}
          </p>

          {status && (
            <p className="mt-2 text-xs text-base-content/40">
              Server status: {status}
            </p>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mx-auto mt-6 flex h-11 items-center gap-2 rounded-xl bg-warning px-6 font-semibold text-warning-content transition hover:bg-warning/90 disabled:cursor-not-allowed disabled:opacity-60"
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
  // EMPTY
  // ==========================================================

  if (products.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
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
  // MAIN UI
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

          const image = getText(product?.image);

          const name = getText(product?.name, "Unnamed Product");

          const brand = getText(product?.brand, "No Brand");

          const category = getText(product?.category, "General");

          const isAdding = addingProductId === productId;

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
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-base-content/40">
                    No Image
                  </div>
                )}

                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-error px-3 py-1 text-xs font-bold text-error-content shadow">
                    -{discount}%
                  </span>
                )}

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
                  {name}
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

                {/* ACTIONS */}

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

                  {/* ADD TO CART */}

                  <button
                    type="button"
                    disabled={isAdding || stock <= 0 || authLoading}
                    onClick={(event) => handleAddToCart(product, event)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-95 ${
                      stock > 0
                        ? "bg-warning text-warning-content hover:bg-warning/90"
                        : "cursor-not-allowed bg-base-300 text-base-content/40"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
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

      {isFetching && (
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
