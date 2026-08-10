import { useContext, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaShoppingCart,
  FaStar,
  FaTag,
  FaWeight,
} from "react-icons/fa";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";

const API = import.meta.env.VITE_API_URL;

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

  const isValidId = /^[0-9a-fA-F]{24}$/.test(id || "");

  // ============================================================
  // FETCH SINGLE PRODUCT
  // ============================================================

  const fetchProduct = async ({ signal }) => {
    const response = await axios.get(`${API}/products/${id}`, {
      signal,
      timeout: 15000,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to fetch product.");
    }

    return response.data.data;
  };

  // ============================================================
  // PRODUCT QUERY
  // ============================================================

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: fetchProduct,
    enabled: Boolean(API && isValidId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // ============================================================
  // FETCH PRODUCTS FOR RELATED PRODUCTS
  // ============================================================

  const fetchProducts = async ({ signal }) => {
    const response = await axios.get(`${API}/products`, {
      params: {
        page: 1,
        limit: 8,
      },
      signal,
      timeout: 15000,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to fetch products.");
    }

    return response.data.data || [];
  };

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products", 1],
    queryFn: fetchProducts,
    enabled: Boolean(API),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // ============================================================
  // RELATED PRODUCTS
  // ============================================================

  const relatedProducts = useMemo(() => {
    if (!product?._id || !Array.isArray(allProducts)) {
      return [];
    }

    const productCategory = String(product.category || "")
      .trim()
      .toLowerCase();

    return allProducts
      .filter((item) => {
        if (!item?._id) return false;

        const itemCategory = String(item.category || "")
          .trim()
          .toLowerCase();

        return (
          itemCategory === productCategory &&
          String(item._id) !== String(product._id)
        );
      })
      .slice(0, 4);
  }, [allProducts, product]);

  // ============================================================
  // PRODUCT VALUES
  // ============================================================

  const price = Math.max(Number(product?.price) || 0, 0);

  const discount = Math.min(Math.max(Number(product?.discount) || 0, 0), 100);

  const finalPrice = Math.max(price - (price * discount) / 100, 0);

  const rating = Math.min(Math.max(Number(product?.rating) || 0, 0), 5);

  const reviews = Math.max(Number(product?.reviews) || 0, 0);

  const stock = Math.max(Number(product?.stock) || 0, 0);

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart = async () => {
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

    if (!product?._id) {
      addToast("Product not found.", "error");
      return;
    }

    if (stock <= 0) {
      addToast("This product is out of stock.", "error");
      return;
    }

    if (isAdding) {
      return;
    }

    try {
      setIsAdding(true);

      const response = await axios.post(
        `${API}/carts`,
        {
          productId: product._id,
          quantity: 1,
        },
        {
          withCredentials: true,
          timeout: 15000,
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to add product to cart.",
        );
      }

      addToast(`${product.name} added to your cart. 🛒`, "success");

      // Refresh all common cart queries.
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
      ]);

      // Fly product image to navbar cart.
      const cartIcon = document.querySelector(".cart-icon");

      if (imageRef.current && cartIcon) {
        flyToCart(imageRef.current, cartIcon);
      }
    } catch (error) {
      console.error("ADD TO CART ERROR:", error);

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
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
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
                <div className="h-20 rounded-xl bg-gray-200" />
                <div className="h-20 rounded-xl bg-gray-200" />
                <div className="h-20 rounded-xl bg-gray-200" />
                <div className="h-20 rounded-xl bg-gray-200" />
              </div>

              <div className="space-y-3">
                <div className="h-5 w-32 rounded bg-gray-200" />
                <div className="h-20 w-full rounded bg-gray-200" />
              </div>

              <div className="h-14 w-48 rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR / INVALID PRODUCT
  // ============================================================

  if (!isValidId || isError || !product) {
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
              "The product you are looking for doesn't exist."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {isValidId && isError && (
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600"
              >
                Try Again
              </button>
            )}

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
  // MAIN PRODUCT DETAILS
  // ============================================================

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-amber-500 px-5 py-2.5 font-medium text-amber-600 transition-all duration-300 hover:bg-amber-500 hover:text-white"
      >
        <FaArrowLeft />
        Back
      </button>

      {/* Product Section */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-2">
          {/* Product Image */}
          <div className="flex items-center justify-center">
            <div className="relative w-full">
              {discount > 0 && (
                <div className="absolute left-4 top-4 z-10 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white shadow">
                  {discount}% OFF
                </div>
              )}

              {product.image ? (
                <img
                  ref={imageRef}
                  src={product.image}
                  alt={product.name || "Product"}
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

          {/* Product Details */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
                {product.name || "Unnamed Product"}
              </h1>

              <p className="mt-2 capitalize text-gray-500">
                {product.category || "General"}
              </p>
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

                  <p className="font-semibold text-gray-800">
                    {product.brand || "N/A"}
                  </p>
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

                  <p className="font-semibold text-gray-800">
                    {product.weight || "N/A"}
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Category</p>

                <p className="font-semibold capitalize text-gray-800">
                  {product.category || "General"}
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
              className={`inline-flex w-full items-center justify-center gap-3 rounded-xl px-8 py-4 text-lg font-bold text-white transition-all duration-300 md:w-auto ${
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

      {/* Related Products */}
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

              return (
                <Link
                  key={item._id}
                  to={`/product/${item._id}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden bg-gray-50">
                    {itemDiscount > 0 && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                        -{itemDiscount}%
                      </span>
                    )}

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name || "Product"}
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

                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 min-h-[48px] font-semibold text-gray-800">
                      {item.name || "Unnamed Product"}
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
