import { useContext, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaArrowLeft,
  FaBoxOpen,
  FaCartPlus,
  FaRedo,
  FaShieldAlt,
  FaStar,
  FaTag,
  FaTruck,
  FaUndoAlt,
  FaWeightHanging,
  FaCheckCircle,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

// ============================================================
// CONFIG
// ============================================================

const API_URL = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const REQUEST_TIMEOUT = 15000;

const PRODUCT_STALE_TIME = 1000 * 60 * 5;
const PRODUCT_GC_TIME = 1000 * 60 * 10;

const RELATED_PRODUCTS_LIMIT = 12;

// MongoDB ObjectId
const PRODUCT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

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

  return value.trim() || fallback;
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

const normalizeImageUrl = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\[\]\(\)]/g, "").trim();
};

// ============================================================
// API
// ============================================================

// ------------------------------------------------------------
// GET /products/:id
// Server response:
//
// {
//   success: true,
//   data: product
// }
// ------------------------------------------------------------

const fetchProduct = async ({ queryKey, signal }) => {
  const [, productId] = queryKey;

  if (!API_URL) {
    throw new Error("API URL is not configured.");
  }

  if (!PRODUCT_ID_REGEX.test(productId || "")) {
    throw new Error("Invalid product ID.");
  }

  const response = await axios.get(`${API_URL}/products/${productId}`, {
    signal,
    timeout: REQUEST_TIMEOUT,
    headers: {
      Accept: "application/json",
    },
  });

  const result = response?.data;

  if (!result?.success) {
    throw new Error(result?.message || "Failed to load product.");
  }

  if (!result?.data) {
    throw new Error("Product information was not found.");
  }

  return result.data;
};

// ------------------------------------------------------------
// GET /products
// Used for related products.
// ------------------------------------------------------------

const fetchProducts = async ({ signal }) => {
  if (!API_URL) {
    throw new Error("API URL is not configured.");
  }

  const response = await axios.get(`${API_URL}/products`, {
    params: {
      page: 1,
      limit: RELATED_PRODUCTS_LIMIT,
    },
    signal,
    timeout: REQUEST_TIMEOUT,
    headers: {
      Accept: "application/json",
    },
  });

  const result = response?.data;

  if (!result?.success) {
    throw new Error(result?.message || "Failed to load related products.");
  }

  return Array.isArray(result?.data) ? result.data : [];
};

// ============================================================
// COMPONENT
// ============================================================

const FeaturedProdetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { user } = useContext(AuthContext);

  const { addToast } = useToast();

  const [isAdding, setIsAdding] = useState(false);

  // ==========================================================
  // PRODUCT ID
  // ==========================================================

  const productId = String(id || "").trim();

  const isValidProductId = PRODUCT_ID_REGEX.test(productId);

  // ==========================================================
  // PRODUCT QUERY
  // ==========================================================

  const {
    data: product,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product", productId],

    queryFn: fetchProduct,

    enabled: Boolean(API_URL) && isValidProductId,

    staleTime: PRODUCT_STALE_TIME,

    gcTime: PRODUCT_GC_TIME,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  // ==========================================================
  // RELATED PRODUCTS QUERY
  // ==========================================================

  const { data: products = [], isLoading: relatedProductsLoading } = useQuery({
    queryKey: ["products", "related"],

    queryFn: fetchProducts,

    enabled: Boolean(API_URL) && Boolean(product),

    staleTime: PRODUCT_STALE_TIME,

    gcTime: PRODUCT_GC_TIME,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  // ==========================================================
  // PRODUCT VALUES
  // ==========================================================

  const price = getPrice(product?.price);

  const discount = getDiscount(product?.discount);

  const finalPrice = getFinalPrice(price, discount);

  const saveAmount = Math.max(Number((price - finalPrice).toFixed(2)), 0);

  const rating = getRating(product?.rating);

  const reviews = getReviews(product?.reviews);

  const stock = getStock(product?.stock);

  const productName = getText(product?.name, "Unnamed Product");

  const productBrand = getText(product?.brand, "No Brand");

  const productCategory = getText(product?.category, "General");

  const productWeight = getText(
    product?.weight !== undefined && product?.weight !== null
      ? String(product.weight)
      : "",
    "N/A",
  );

  const productImage = normalizeImageUrl(product?.image);

  const description = getText(
    product?.description,
    "No description available for this product.",
  );

  const ingredients = getText(product?.ingredients);

  const expiry = getText(product?.expiry);

  // ==========================================================
  // RELATED PRODUCTS
  // ==========================================================

  const relatedProducts = useMemo(() => {
    if (!product?._id || !Array.isArray(products)) {
      return [];
    }

    const currentProductId = String(product._id);

    const currentCategory = getText(product.category).toLowerCase().trim();

    if (!currentCategory) {
      return [];
    }

    return products
      .filter((item) => {
        if (!item?._id) {
          return false;
        }

        const itemId = String(item._id);

        const itemCategory = getText(item.category).toLowerCase().trim();

        return itemId !== currentProductId && itemCategory === currentCategory;
      })
      .slice(0, 4);
  }, [product, products]);

  // ==========================================================
  // LOGIN REDIRECT
  // ==========================================================

  const redirectToLogin = () => {
    navigate("/login", {
      state: {
        from: {
          pathname: `/product/${productId}`,
        },
      },
    });
  };

  // ==========================================================
  // ADD TO CART
  // POST /carts
  // ==========================================================

  const handleAddToCart = async () => {
    if (isAdding) {
      return;
    }

    // --------------------------------------------------------
    // API CHECK
    // --------------------------------------------------------

    if (!API_URL) {
      addToast("API URL is not configured.", "error");

      return;
    }

    // --------------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------------

    if (!user) {
      addToast("Please login before adding products to your cart.", "warning");

      redirectToLogin();

      return;
    }

    // --------------------------------------------------------
    // PRODUCT CHECK
    // --------------------------------------------------------

    if (!product?._id) {
      addToast("Product information is unavailable.", "error");

      return;
    }

    // --------------------------------------------------------
    // STOCK CHECK
    // --------------------------------------------------------

    if (stock <= 0) {
      addToast("This product is currently out of stock.", "warning");

      return;
    }

    try {
      setIsAdding(true);

      const response = await axios.post(
        `${API_URL}/carts`,
        {
          productId: String(product._id),
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

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      addToast(`${productName} added to your cart.`, "success");

      // ------------------------------------------------------
      // INVALIDATE ALL CART QUERIES
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
    } catch (error) {
      console.error("FEATURED PRODUCT ADD TO CART ERROR:", error);

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
      // NETWORK / TIMEOUT
      // ------------------------------------------------------

      if (
        error?.code === "ECONNABORTED" ||
        error?.code === "ERR_NETWORK" ||
        !error?.response
      ) {
        addToast("Unable to connect to the server. Please try again.", "error");

        return;
      }

      // ------------------------------------------------------
      // GENERIC
      // ------------------------------------------------------

      addToast(message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  // ==========================================================
  // INVALID PRODUCT ID
  // ==========================================================

  if (!isValidProductId) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
            <FaBoxOpen className="text-4xl text-warning" />
          </div>

          <h2 className="mt-6 text-3xl font-bold">Invalid Product</h2>

          <p className="mt-3 text-base-content/60">
            The product ID in the URL is not valid.
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-warning px-6 py-3 font-semibold text-warning-content transition hover:bg-warning/90"
          >
            <FaArrowLeft />
            Go Back
          </button>
        </div>
      </section>
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 h-11 w-28 animate-pulse rounded-xl bg-base-300" />

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image skeleton */}

          <div className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-4 shadow-lg">
            <div className="flex h-[350px] items-center justify-center rounded-2xl bg-base-300 sm:h-[480px] lg:h-[560px]">
              <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg text-warning" />

                <span className="text-sm font-medium text-base-content/50">
                  Loading product...
                </span>
              </div>
            </div>
          </div>

          {/* Content skeleton */}

          <div className="space-y-6">
            <div className="h-8 w-28 animate-pulse rounded-full bg-base-300" />

            <div className="h-12 w-full animate-pulse rounded-xl bg-base-300" />

            <div className="h-6 w-40 animate-pulse rounded bg-base-300" />

            <div className="h-36 animate-pulse rounded-2xl bg-base-300" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl bg-base-300"
                />
              ))}
            </div>

            <div className="space-y-3">
              <div className="h-7 w-48 animate-pulse rounded bg-base-300" />

              <div className="h-5 w-full animate-pulse rounded bg-base-300" />

              <div className="h-5 w-5/6 animate-pulse rounded bg-base-300" />

              <div className="h-5 w-4/6 animate-pulse rounded bg-base-300" />
            </div>

            <div className="h-14 w-full animate-pulse rounded-xl bg-base-300" />
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (isError || !product) {
    const status = error?.response?.status;

    let errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "The product could not be loaded.";

    if (status === 400) {
      errorMessage = "The product ID is invalid.";
    }

    if (status === 404) {
      errorMessage = "This product does not exist or has been removed.";
    }

    if (status >= 500) {
      errorMessage =
        "The server is currently unavailable. Please try again later.";
    }

    if (error?.code === "ECONNABORTED") {
      errorMessage = "The server request timed out. Please try again.";
    }

    if (error?.code === "ERR_NETWORK" || !error?.response) {
      errorMessage =
        "Unable to connect to the server. Please check your connection.";
    }

    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
            <FaBoxOpen className="text-4xl text-error" />
          </div>

          <h2 className="mt-6 text-3xl font-bold">Product Not Found</h2>

          <p className="mt-3 leading-7 text-base-content/60">{errorMessage}</p>

          {status && (
            <p className="mt-2 text-xs text-base-content/40">
              Server status: {status}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl bg-warning px-6 py-3 font-semibold text-warning-content transition hover:bg-warning/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaRedo className={isFetching ? "animate-spin" : ""} />

              {isFetching ? "Trying..." : "Try Again"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-base-300 px-6 py-3 font-semibold transition hover:bg-base-200"
            >
              <FaArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      {/* ======================================================
          BACK BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-base-300 px-5 py-2.5 font-semibold transition hover:bg-base-200"
      >
        <FaArrowLeft />
        Back
      </button>

      {/* ======================================================
          BREADCRUMB
      ====================================================== */}

      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex flex-wrap items-center gap-2 text-sm text-base-content/50"
      >
        <Link to="/" className="transition hover:text-warning">
          Home
        </Link>

        <span>/</span>

        <span className="capitalize">{productCategory}</span>

        <span>/</span>

        <span className="font-semibold text-base-content/70">
          {productName}
        </span>
      </nav>

      {/* ======================================================
          PRODUCT
      ====================================================== */}

      <div className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-lg">
        <div className="grid gap-10 p-5 sm:p-6 md:p-10 lg:grid-cols-2">
          {/* ==================================================
              IMAGE
          ================================================== */}

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-2xl bg-base-200">
              {/* Discount */}

              {discount > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-error px-4 py-2 text-sm font-bold text-error-content shadow-lg">
                  {discount}% OFF
                </span>
              )}

              {/* Image */}

              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  loading="eager"
                  decoding="async"
                  className="h-[350px] w-full object-contain p-6 transition duration-500 hover:scale-105 sm:h-[480px] lg:h-[560px]"
                  onError={(event) => {
                    event.currentTarget.onerror = null;

                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-[350px] items-center justify-center text-base-content/40 sm:h-[480px] lg:h-[560px]">
                  <div className="text-center">
                    <FaBoxOpen className="mx-auto text-6xl" />

                    <p className="mt-3 font-medium">No Image Available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              DETAILS
          ================================================== */}

          <div className="flex flex-col">
            {/* Brand + Category */}

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-warning/10 px-4 py-2 text-sm font-semibold text-warning">
                {productBrand}
              </span>

              <span className="rounded-full bg-base-200 px-4 py-2 text-sm font-medium capitalize text-base-content/60">
                {productCategory}
              </span>
            </div>

            {/* Name */}

            <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              {productName}
            </h1>

            {/* Rating */}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-warning">
                <FaStar />

                <span className="font-bold">{rating.toFixed(1)}</span>
              </div>

              <span className="text-sm text-base-content/50">
                ({reviews} Reviews)
              </span>
            </div>

            {/* Price */}

            <div className="mt-7 rounded-2xl border border-warning/20 bg-warning/5 p-6">
              <div className="flex flex-wrap items-end gap-3">
                <h2 className="text-4xl font-extrabold text-warning sm:text-5xl">
                  ৳{finalPrice.toFixed(2)}
                </h2>

                {discount > 0 && (
                  <span className="pb-1 text-xl text-base-content/40 line-through">
                    ৳{price.toFixed(2)}
                  </span>
                )}
              </div>

              {discount > 0 && (
                <p className="mt-2 font-semibold text-success">
                  You save ৳{saveAmount.toFixed(2)}
                </p>
              )}
            </div>

            {/* Stock */}

            <div className="mt-6">
              {stock > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 font-semibold text-success">
                  <FaCheckCircle />
                  In Stock ({stock})
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-error/10 px-4 py-2 font-semibold text-error">
                  <FaBoxOpen />
                  Out of Stock
                </span>
              )}
            </div>

            {/* Product Information */}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Brand */}

              <div className="rounded-2xl bg-base-200 p-5">
                <FaTag className="mb-3 text-2xl text-warning" />

                <p className="text-sm text-base-content/50">Brand</p>

                <p className="mt-1 font-bold">{productBrand}</p>
              </div>

              {/* Category */}

              <div className="rounded-2xl bg-base-200 p-5">
                <FaBoxOpen className="mb-3 text-2xl text-warning" />

                <p className="text-sm text-base-content/50">Category</p>

                <p className="mt-1 font-bold capitalize">{productCategory}</p>
              </div>

              {/* Weight */}

              <div className="rounded-2xl bg-base-200 p-5">
                <FaWeightHanging className="mb-3 text-2xl text-warning" />

                <p className="text-sm text-base-content/50">Weight</p>

                <p className="mt-1 font-bold">{productWeight}</p>
              </div>
            </div>

            {/* Description */}

            <div className="mt-8">
              <h2 className="text-2xl font-bold">Product Description</h2>

              <p className="mt-3 leading-8 text-base-content/60">
                {description}
              </p>
            </div>

            {/* Ingredients */}

            {ingredients && (
              <div className="mt-7 rounded-2xl border border-base-300 bg-base-200/50 p-6">
                <h3 className="text-xl font-bold">Ingredients</h3>

                <p className="mt-3 leading-7 text-base-content/60">
                  {ingredients}
                </p>
              </div>
            )}

            {/* Expiry */}

            {expiry && (
              <div className="mt-5 rounded-2xl border border-base-300 bg-base-200/50 p-6">
                <h3 className="text-xl font-bold">Expiry</h3>

                <p className="mt-3 text-base-content/60">{expiry}</p>
              </div>
            )}

            {/* Service Information */}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-base-300 p-5">
                <FaTruck className="mb-3 text-2xl text-warning" />

                <h3 className="font-bold">Delivery</h3>

                <p className="mt-2 text-sm leading-6 text-base-content/50">
                  Delivery options are available during checkout.
                </p>
              </div>

              <div className="rounded-2xl border border-base-300 p-5">
                <FaShieldAlt className="mb-3 text-2xl text-success" />

                <h3 className="font-bold">Secure Checkout</h3>

                <p className="mt-2 text-sm leading-6 text-base-content/50">
                  Complete your order securely through checkout.
                </p>
              </div>

              <div className="rounded-2xl border border-base-300 p-5">
                <FaUndoAlt className="mb-3 text-2xl text-info" />

                <h3 className="font-bold">Order Support</h3>

                <p className="mt-2 text-sm leading-6 text-base-content/50">
                  Contact support if you need help with your order.
                </p>
              </div>
            </div>

            {/* Add To Cart */}

            <div className="mt-9">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding || stock <= 0}
                className={`inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl px-8 text-lg font-bold transition active:scale-[0.98] ${
                  stock > 0
                    ? "bg-warning text-warning-content hover:bg-warning/90"
                    : "cursor-not-allowed bg-base-300 text-base-content/40"
                } ${isAdding ? "cursor-wait opacity-80" : ""}`}
              >
                {isAdding ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Adding to Cart...
                  </>
                ) : stock <= 0 ? (
                  <>
                    <FaBoxOpen />
                    Out of Stock
                  </>
                ) : (
                  <>
                    <FaCartPlus />
                    Add To Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          WHY SHOP WITH US
      ====================================================== */}

      <div className="mt-14 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Why Shop With Us?
          </h2>

          <p className="mt-2 text-base-content/60">
            A simple and reliable shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl bg-base-200 p-4">
            <FaCheckCircle className="shrink-0 text-xl text-success" />

            <span className="font-semibold">Quality Products</span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-base-200 p-4">
            <FaTruck className="shrink-0 text-xl text-warning" />

            <span className="font-semibold">Reliable Delivery</span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-base-200 p-4">
            <FaShieldAlt className="shrink-0 text-xl text-info" />

            <span className="font-semibold">Secure Checkout</span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-base-200 p-4">
            <FaUndoAlt className="shrink-0 text-xl text-secondary" />

            <span className="font-semibold">Order Support</span>
          </div>
        </div>
      </div>

      {/* ======================================================
          RELATED PRODUCTS
      ====================================================== */}

      {relatedProductsLoading && (
        <div className="mt-14">
          <div className="mb-8">
            <div className="h-9 w-64 animate-pulse rounded bg-base-300" />

            <div className="mt-3 h-5 w-80 animate-pulse rounded bg-base-300" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
              >
                <div className="flex h-56 items-center justify-center bg-base-300">
                  <span className="loading loading-spinner loading-md text-warning" />
                </div>

                <div className="space-y-3 p-4">
                  <div className="h-5 w-full animate-pulse rounded bg-base-300" />

                  <div className="h-5 w-3/4 animate-pulse rounded bg-base-300" />

                  <div className="h-6 w-28 animate-pulse rounded bg-base-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!relatedProductsLoading && relatedProducts.length > 0 && (
        <div className="mt-14">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold">Related Products</h2>

            <p className="mt-2 text-base-content/60">
              You may also like these products.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((item) => {
              const itemId = String(item?._id || "");

              if (!itemId) {
                return null;
              }

              const itemPrice = getPrice(item?.price);

              const itemDiscount = getDiscount(item?.discount);

              const itemFinalPrice = getFinalPrice(itemPrice, itemDiscount);

              const itemName = getText(item?.name, "Unnamed Product");

              const itemBrand = getText(item?.brand, "No Brand");

              const itemCategory = getText(item?.category, "General");

              const itemImage = normalizeImageUrl(item?.image);

              const itemRating = getRating(item?.rating);

              const itemStock = getStock(item?.stock);

              return (
                <Link
                  key={itemId}
                  to={`/product/${itemId}`}
                  className="group overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Image */}

                  <div className="relative h-56 overflow-hidden bg-base-200">
                    {itemDiscount > 0 && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-error px-3 py-1 text-xs font-bold text-error-content shadow">
                        -{itemDiscount}%
                      </span>
                    )}

                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={itemName}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.onerror = null;

                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-base-content/40">
                        <div className="text-center">
                          <FaBoxOpen className="mx-auto text-4xl" />

                          <p className="mt-2 text-sm">No Image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}

                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                        {itemBrand}
                      </span>

                      <span className="rounded-full bg-base-200 px-2.5 py-1 text-xs capitalize text-base-content/50">
                        {itemCategory}
                      </span>
                    </div>

                    <h3 className="mt-3 min-h-[48px] line-clamp-2 font-bold">
                      {itemName}
                    </h3>

                    {/* Rating */}

                    <div className="mt-3 flex items-center gap-1 text-warning">
                      <FaStar />

                      <span className="text-sm font-semibold">
                        {itemRating.toFixed(1)}
                      </span>

                      <span className="ml-1 text-xs text-base-content/40">
                        ({getReviews(item?.reviews)})
                      </span>
                    </div>

                    {/* Price */}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold text-warning">
                        ৳{itemFinalPrice.toFixed(2)}
                      </span>

                      {itemDiscount > 0 && (
                        <span className="text-sm text-base-content/40 line-through">
                          ৳{itemPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock */}

                    <div className="mt-3">
                      <span
                        className={`text-xs font-semibold ${
                          itemStock > 0 ? "text-success" : "text-error"
                        }`}
                      >
                        {itemStock > 0
                          ? `${itemStock} Available`
                          : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================
          RELATED PRODUCTS EMPTY
      ====================================================== */}

      {!relatedProductsLoading && relatedProducts.length === 0 && (
        <div className="mt-14 rounded-2xl border border-base-300 bg-base-100 p-8 text-center">
          <FaBoxOpen className="mx-auto text-4xl text-base-content/30" />

          <h3 className="mt-4 text-xl font-bold">No Related Products</h3>

          <p className="mt-2 text-base-content/50">
            There are no other products in this category right now.
          </p>
        </div>
      )}
    </section>
  );
};

export default FeaturedProdetails;
