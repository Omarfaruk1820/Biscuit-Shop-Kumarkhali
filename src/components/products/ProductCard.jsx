import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaCartPlus, FaSpinner, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";

const API_URL = import.meta.env.VITE_API_URL;

const PRODUCTS_PER_PAGE = 8;

const ProductCard = () => {
  // ============================================================
  // ROUTER
  // ============================================================

  const navigate = useNavigate();

  // ============================================================
  // REACT QUERY
  // ============================================================

  const queryClient = useQueryClient();

  // ============================================================
  // AUTH
  // ============================================================

  const { user } = useContext(AuthContext);

  // ============================================================
  // TOAST
  // ============================================================

  const { addToast } = useToast();

  // ============================================================
  // FLY TO CART
  // ============================================================

  const { flyToCart } = useFlyToCart();

  // ============================================================
  // LOCAL STATE
  // ============================================================

  const [currentPage, setCurrentPage] = useState(1);
  const [addingProductId, setAddingProductId] = useState(null);

  // ============================================================
  // FETCH PRODUCTS
  // ============================================================

  const fetchProducts = async ({ queryKey, signal }) => {
    const [, page] = queryKey;

    if (!API_URL) {
      throw new Error("API URL is not configured.");
    }

    const response = await axios.get(`${API_URL}/products`, {
      params: {
        page,
        limit: PRODUCTS_PER_PAGE,
      },

      signal,

      timeout: 15000,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to load products.");
    }

    return response.data;
  };

  // ============================================================
  // PRODUCTS QUERY
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

  const pagination =
    data?.pagination && typeof data.pagination === "object"
      ? data.pagination
      : {};

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1);

  // ============================================================
  // PREFETCH NEXT PAGE
  // ============================================================

  useEffect(() => {
    if (currentPage >= totalPages) {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: ["products", currentPage + 1],

      queryFn: fetchProducts,

      staleTime: 1000 * 60 * 2,

      gcTime: 1000 * 60 * 10,
    });
  }, [currentPage, totalPages, queryClient]);

  // ============================================================
  // GO TO PAGE
  // ============================================================

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

  // ============================================================
  // LOGIN REDIRECT
  // ============================================================

  const redirectToLogin = () => {
    navigate("/login", {
      state: {
        from: {
          pathname: window.location.pathname,

          search: window.location.search,
        },
      },
    });
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart = async (product, event) => {
    event.stopPropagation();

    // ----------------------------------------------------------
    // Authentication
    // ----------------------------------------------------------

    if (!user) {
      addToast("Please login first.", "warning");

      redirectToLogin();

      return;
    }

    // ----------------------------------------------------------
    // Product validation
    // ----------------------------------------------------------

    const productId = String(product?._id || "").trim();

    if (!productId) {
      addToast("Invalid product.", "error");

      return;
    }

    const stock = Number(product?.stock);

    if (!Number.isFinite(stock) || stock <= 0) {
      addToast("This product is out of stock.", "warning");

      return;
    }

    // ----------------------------------------------------------
    // Prevent duplicate request
    // ----------------------------------------------------------

    if (addingProductId !== null) {
      return;
    }

    setAddingProductId(productId);

    try {
      // --------------------------------------------------------
      // Find animation elements BEFORE API request
      // --------------------------------------------------------

      const productCard = event.currentTarget.closest(".product-card");

      const productImage = productCard?.querySelector("img");

      const cartIcon = document.querySelector(".cart-icon");

      // --------------------------------------------------------
      // POST /carts
      //
      // IMPORTANT:
      //
      // Only send productId + quantity.
      //
      // Backend should load the product from MongoDB and
      // calculate the actual price/product information.
      // --------------------------------------------------------

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

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to add product to cart.",
        );
      }

      // --------------------------------------------------------
      // Success toast
      // --------------------------------------------------------

      const productName =
        typeof product?.name === "string" && product.name.trim()
          ? product.name.trim()
          : "Product";

      addToast(`${productName} added to your cart.`, "success");

      // --------------------------------------------------------
      // Refresh cart queries
      // --------------------------------------------------------

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

      // --------------------------------------------------------
      // Fly product image to cart
      // --------------------------------------------------------

      if (productImage && cartIcon && typeof flyToCart === "function") {
        flyToCart(productImage, cartIcon);
      }
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

      // --------------------------------------------------------
      // Unauthorized
      // --------------------------------------------------------

      if (error?.response?.status === 401) {
        addToast("Your session has expired. Please login again.", "warning");

        redirectToLogin();

        return;
      }

      // --------------------------------------------------------
      // Forbidden
      // --------------------------------------------------------

      if (error?.response?.status === 403) {
        addToast(
          error?.response?.data?.message ||
            "You are not allowed to add this product to the cart.",
          "error",
        );

        return;
      }

      // --------------------------------------------------------
      // Not found
      // --------------------------------------------------------

      if (error?.response?.status === 404) {
        addToast(
          error?.response?.data?.message ||
            "This product is no longer available.",
          "error",
        );

        return;
      }

      // --------------------------------------------------------
      // Conflict
      // --------------------------------------------------------

      if (error?.response?.status === 409) {
        addToast(
          error?.response?.data?.message ||
            "This product is currently unavailable.",
          "warning",
        );

        return;
      }

      // --------------------------------------------------------
      // Generic error
      // --------------------------------------------------------

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add product to cart.";

      addToast(message, "error");
    } finally {
      setAddingProductId(null);
    }
  };

  // ============================================================
  // LOADING UI
  // ============================================================

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

  // ============================================================
  // ERROR UI
  // ============================================================

  if (isError) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-4 text-2xl font-bold">Failed to load products</h2>

          <p className="mt-2 max-w-md text-sm text-base-content/60">
            {error?.message || "Something went wrong while loading products."}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-warning mt-6"
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

  // ============================================================
  // EMPTY UI
  // ============================================================

  if (products.length === 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-5xl">🍪</div>

          <h2 className="mt-4 text-2xl font-bold">No Products Found</h2>

          <p className="mt-2 text-base-content/60">
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
          PRODUCTS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const productId = String(product?._id || "");

          if (!productId) {
            return null;
          }

          // ----------------------------------------------------
          // Product values
          // ----------------------------------------------------

          const price = Math.max(Number(product?.price) || 0, 0);

          const discount = Math.min(
            Math.max(Number(product?.discount) || 0, 0),
            100,
          );

          const finalPrice = Math.max(
            Number((price - (price * discount) / 100).toFixed(2)),
            0,
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

          const isAdding = addingProductId === productId;

          // ----------------------------------------------------
          // Product card
          // ----------------------------------------------------

          return (
            <article
              key={productId}
              className="product-card group cursor-pointer overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              onClick={() => navigate(`/product/${productId}`)}
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

                {/* Discount */}

                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-error px-3 py-1 text-xs font-bold text-error-content shadow">
                    -{discount}%
                  </span>
                )}

                {/* Hot */}

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
                {/* Brand */}

                <span className="inline-flex rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                  {brand}
                </span>

                {/* Name */}

                <h3 className="mt-3 min-h-[48px] line-clamp-2 font-bold">
                  {productName}
                </h3>

                {/* Category */}

                <div className="mt-2">
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
                  <h4 className="text-2xl font-bold text-warning">
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
                  {/* Details */}

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      navigate(`/product/${productId}`);
                    }}
                    className="h-11 rounded-xl border border-base-300 font-semibold transition hover:bg-base-200"
                  >
                    Details
                  </button>

                  {/* Cart */}

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
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {/* Previous */}

          <button
            type="button"
            disabled={currentPage === 1 || isFetching}
            onClick={() => goToPage(currentPage - 1)}
            className="rounded-xl border border-base-300 px-4 py-2 transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40"
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
                    ? "bg-warning text-warning-content"
                    : "border border-base-300 hover:bg-base-200"
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
            className="rounded-xl border border-base-300 px-4 py-2 transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
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
