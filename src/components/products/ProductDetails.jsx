import { useContext, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaShoppingCart,
  FaStar,
  FaTag,
  FaWeight,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";

const API = import.meta.env.VITE_API_URL;

const PRODUCT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const { flyToCart } = useFlyToCart();

  const imageRef = useRef(null);

  const [isAdding, setIsAdding] = useState(false);

  // ============================================================
  // VALIDATE PRODUCT ID
  // ============================================================

  const isValidProductId = PRODUCT_ID_REGEX.test(id || "");

  // ============================================================
  // FETCH PRODUCT
  // GET /products/:id
  // ============================================================

  const fetchProduct = async ({ signal }) => {
    if (!API) {
      throw new Error("API URL is not configured.");
    }

    if (!isValidProductId) {
      throw new Error("Invalid product ID.");
    }

    const response = await axios.get(`${API}/products/${id}`, {
      signal,
      timeout: 15000,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to load product.");
    }

    if (!response.data?.data) {
      throw new Error("Product information was not found.");
    }

    return response.data.data;
  };

  // ============================================================
  // PRODUCT QUERY
  // ============================================================

  const {
    data: product,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: fetchProduct,
    enabled: Boolean(API && isValidProductId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // ============================================================
  // FETCH PRODUCTS
  // Used for related products
  // GET /products
  // ============================================================

  const fetchProducts = async ({ signal }) => {
    if (!API) {
      throw new Error("API URL is not configured.");
    }

    const response = await axios.get(`${API}/products`, {
      params: {
        page: 1,
        limit: 12,
      },
      signal,
      timeout: 15000,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to load products.");
    }

    return Array.isArray(response.data?.data) ? response.data.data : [];
  };

  const { data: products = [] } = useQuery({
    queryKey: ["products", 1],
    queryFn: fetchProducts,
    enabled: Boolean(API && product),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // ============================================================
  // RELATED PRODUCTS
  // ============================================================

  const relatedProducts = useMemo(() => {
    if (!product?._id || !Array.isArray(products)) {
      return [];
    }

    const currentProductId = String(product._id);

    const currentCategory = String(product.category || "")
      .trim()
      .toLowerCase();

    if (!currentCategory) {
      return [];
    }

    return products
      .filter((item) => {
        if (!item?._id) {
          return false;
        }

        const itemId = String(item._id);

        const itemCategory = String(item.category || "")
          .trim()
          .toLowerCase();

        return itemId !== currentProductId && itemCategory === currentCategory;
      })
      .slice(0, 4);
  }, [product, products]);

  // ============================================================
  // PRODUCT VALUES
  // ============================================================

  const price = Math.max(Number(product?.price) || 0, 0);

  const discount = Math.min(Math.max(Number(product?.discount) || 0, 0), 100);

  const finalPrice = Math.max(price - (price * discount) / 100, 0);

  const rating = Math.min(Math.max(Number(product?.rating) || 0, 0), 5);

  const reviews = Math.max(Number(product?.reviews) || 0, 0);

  const stock = Math.max(Number(product?.stock) || 0, 0);

  const productName =
    typeof product?.name === "string" && product.name.trim()
      ? product.name.trim()
      : "Unnamed Product";

  const productImage =
    typeof product?.image === "string" ? product.image.trim() : "";

  const productCategory =
    typeof product?.category === "string" && product.category.trim()
      ? product.category.trim()
      : "General";

  const productBrand =
    typeof product?.brand === "string" && product.brand.trim()
      ? product.brand.trim()
      : "N/A";

  const productWeight =
    product?.weight !== undefined &&
    product?.weight !== null &&
    String(product.weight).trim()
      ? String(product.weight).trim()
      : "N/A";

  // ============================================================
  // LOGIN REDIRECT
  // ============================================================

  const redirectToLogin = () => {
    navigate("/login", {
      state: {
        from: {
          pathname: window.location.pathname,
        },
      },
    });
  };

  // ============================================================
  // ADD TO CART
  // POST /carts
  // ============================================================

  const handleAddToCart = async () => {
    if (isAdding) {
      return;
    }

    // ----------------------------------------------------------
    // Authentication
    // ----------------------------------------------------------

    if (!user) {
      addToast("Please login first.", "error");
      redirectToLogin();
      return;
    }

    // ----------------------------------------------------------
    // Product validation
    // ----------------------------------------------------------

    if (!product?._id) {
      addToast("Product information is unavailable.", "error");
      return;
    }

    if (stock <= 0) {
      addToast("This product is out of stock.", "error");
      return;
    }

    if (!API) {
      addToast("API URL is not configured.", "error");
      return;
    }

    try {
      setIsAdding(true);

      // --------------------------------------------------------
      // Add product to cart
      // --------------------------------------------------------

      const response = await axios.post(
        `${API}/carts`,
        {
          productId: String(product._id),
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
      // Success
      // --------------------------------------------------------

      addToast(`${productName} added to your cart. 🛒`, "success");

      // --------------------------------------------------------
      // Refresh cart data
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
      // Fly image to navbar cart
      // --------------------------------------------------------

      const cartIcon = document.querySelector(".cart-icon");

      if (imageRef.current && cartIcon && typeof flyToCart === "function") {
        flyToCart(imageRef.current, cartIcon);
      }
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

      // --------------------------------------------------------
      // Unauthorized
      // --------------------------------------------------------

      if (error?.response?.status === 401) {
        addToast("Your session has expired. Please login again.", "error");

        redirectToLogin();
        return;
      }

      // --------------------------------------------------------
      // Forbidden
      // --------------------------------------------------------

      if (error?.response?.status === 403) {
        addToast(
          error?.response?.data?.message ||
            "You are not allowed to add this product to your cart.",
          "error",
        );

        return;
      }

      // --------------------------------------------------------
      // Other backend errors
      // --------------------------------------------------------

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add product to cart.";

      addToast(message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  // ============================================================
  // INVALID PRODUCT ID
  // ============================================================

  if (!isValidProductId) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <FaBoxOpen className="text-4xl text-amber-500" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800">Invalid Product</h2>

          <p className="mx-auto mt-3 max-w-md text-gray-500">
            The product ID in the URL is not valid.
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-500 px-5 py-3 font-semibold text-amber-600 transition hover:bg-amber-500 hover:text-white"
          >
            <FaArrowLeft />
            Go Back
          </button>
        </div>
      </section>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-6 h-10 w-28 rounded-xl bg-gray-200" />

          <div className="grid gap-10 rounded-3xl bg-white p-6 shadow-lg md:p-10 lg:grid-cols-2">
            <div className="h-[320px] rounded-2xl bg-gray-200 md:h-[450px]" />

            <div className="space-y-5">
              <div className="h-10 w-3/4 rounded bg-gray-200" />

              <div className="h-5 w-1/3 rounded bg-gray-200" />

              <div className="h-6 w-1/4 rounded bg-gray-200" />

              <div className="h-12 w-1/2 rounded bg-gray-200" />

              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-xl bg-gray-200" />
                ))}
              </div>

              <div className="h-24 rounded bg-gray-200" />

              <div className="h-14 w-48 rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // PRODUCT ERROR
  // ============================================================

  if (isError || !product) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <FaBoxOpen className="text-4xl text-amber-500" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800">
            Product Not Found
          </h2>

          <p className="mx-auto mt-3 max-w-md text-gray-500">
            {error?.response?.data?.message ||
              error?.message ||
              "The product you are looking for does not exist."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFetching ? "Trying..." : "Try Again"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500 px-5 py-3 font-semibold text-amber-600 transition hover:bg-amber-500 hover:text-white"
            >
              <FaArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      {/* ======================================================
          BACK BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-amber-500 px-5 py-2.5 font-medium text-amber-600 transition hover:bg-amber-500 hover:text-white"
      >
        <FaArrowLeft />
        Back
      </button>

      {/* ======================================================
          PRODUCT
      ====================================================== */}

      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-2">
          {/* ==================================================
              IMAGE
          ================================================== */}

          <div className="flex items-center justify-center">
            <div className="relative w-full">
              {discount > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white shadow">
                  {discount}% OFF
                </span>
              )}

              {productImage ? (
                <img
                  ref={imageRef}
                  src={productImage}
                  alt={productName}
                  loading="eager"
                  decoding="async"
                  className="h-[320px] w-full rounded-2xl bg-gray-50 object-contain p-5 md:h-[450px]"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-[320px] w-full items-center justify-center rounded-2xl bg-gray-50 text-gray-400 md:h-[450px]">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              PRODUCT INFORMATION
          ================================================== */}

          <div className="space-y-6">
            {/* Name */}

            <div>
              <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
                {productName}
              </h1>

              <p className="mt-2 capitalize text-gray-500">{productCategory}</p>
            </div>

            {/* Rating */}

            <div className="flex items-center gap-2">
              <FaStar className="text-xl text-yellow-500" />

              <span className="font-semibold text-gray-800">
                {rating.toFixed(1)}
              </span>

              <span className="text-gray-500">({reviews} Reviews)</span>
            </div>

            {/* Price */}

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-4xl font-bold text-amber-600">
                  ৳{finalPrice.toFixed(2)}
                </h2>

                {discount > 0 && (
                  <span className="text-xl text-gray-400 line-through">
                    ৳{price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Product Information */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Brand */}

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <FaTag className="text-amber-500" />

                <div>
                  <p className="text-sm text-gray-500">Brand</p>

                  <p className="font-semibold text-gray-800">{productBrand}</p>
                </div>
              </div>

              {/* Stock */}

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <FaBoxOpen className="text-green-500" />

                <div>
                  <p className="text-sm text-gray-500">Stock</p>

                  <p
                    className={`font-semibold ${
                      stock > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stock > 0 ? `${stock} Available` : "Out of Stock"}
                  </p>
                </div>
              </div>

              {/* Weight */}

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                <FaWeight className="text-blue-500" />

                <div>
                  <p className="text-sm text-gray-500">Weight</p>

                  <p className="font-semibold text-gray-800">{productWeight}</p>
                </div>
              </div>

              {/* Category */}

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Category</p>

                <p className="font-semibold capitalize text-gray-800">
                  {productCategory}
                </p>
              </div>
            </div>

            {/* Description */}

            <div>
              <h3 className="mb-2 text-lg font-bold text-gray-800">
                Description
              </h3>

              <p className="leading-8 text-gray-600">
                {product.description ||
                  "No description available for this product."}
              </p>
            </div>

            {/* Ingredients */}

            {product.ingredients && (
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">
                  Ingredients
                </h3>

                <p className="leading-7 text-gray-600">{product.ingredients}</p>
              </div>
            )}

            {/* Expiry */}

            {product.expiry && (
              <div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">Expiry</h3>

                <p className="text-gray-600">{product.expiry}</p>
              </div>
            )}

            {/* Add To Cart */}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || stock <= 0}
              className={`inline-flex w-full items-center justify-center gap-3 rounded-xl px-8 py-4 text-lg font-bold text-white transition md:w-auto ${
                stock > 0
                  ? "bg-amber-500 hover:bg-amber-600 active:scale-95"
                  : "cursor-not-allowed bg-gray-400"
              }`}
            >
              {isAdding ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Adding...
                </>
              ) : stock <= 0 ? (
                <>
                  <FaBoxOpen />
                  Out of Stock
                </>
              ) : (
                <>
                  <FaShoppingCart />
                  Add To Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          RELATED PRODUCTS
      ====================================================== */}

      {relatedProducts.length > 0 && (
        <div className="mt-14">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Related Products
            </h2>

            <p className="mt-2 text-gray-500">
              You may also like these products.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((item) => {
              const itemPrice = Math.max(Number(item?.price) || 0, 0);

              const itemDiscount = Math.min(
                Math.max(Number(item?.discount) || 0, 0),
                100,
              );

              const itemFinalPrice = Math.max(
                itemPrice - (itemPrice * itemDiscount) / 100,
                0,
              );

              const itemName =
                typeof item?.name === "string" && item.name.trim()
                  ? item.name.trim()
                  : "Unnamed Product";

              const itemImage =
                typeof item?.image === "string" ? item.image.trim() : "";

              return (
                <Link
                  key={item._id}
                  to={`/product/${item._id}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Image */}

                  <div className="relative overflow-hidden bg-gray-50">
                    {itemDiscount > 0 && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                        -{itemDiscount}%
                      </span>
                    )}

                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={itemName}
                        loading="lazy"
                        decoding="async"
                        className="h-52 w-full object-contain p-5 transition duration-300 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center text-sm text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Content */}

                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 min-h-[48px] font-semibold text-gray-800">
                      {itemName}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-amber-600">
                        ৳{itemFinalPrice.toFixed(2)}
                      </span>

                      {itemDiscount > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          ৳{itemPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDetails;
