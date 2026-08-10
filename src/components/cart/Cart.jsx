import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaArrowLeft,
  FaMinus,
  FaPlus,
  FaTrash,
  FaShoppingCart,
  FaTruck,
  FaShieldAlt,
  FaCreditCard,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import axiosSecure from "../../hooks/axiosSecure";

const FREE_SHIPPING_THRESHOLD = 1000;
const MAX_QUANTITY = 99;

const Cart = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ============================================================
  // USER EMAIL
  // ============================================================

  const email = user?.email?.trim().toLowerCase() || "";

  // ============================================================
  // FETCH CART
  // ============================================================

  const fetchCart = async () => {
    const response = await axiosSecure.get("/carts");

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to load cart.");
    }

    return response.data;
  };

  // ============================================================
  // CART QUERY
  // ============================================================

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["cart", email],

    queryFn: fetchCart,

    enabled: Boolean(user && email) && !authLoading,

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    retry: 1,

    refetchOnWindowFocus: false,

    refetchOnReconnect: true,

    placeholderData: (previousData) => previousData,
  });

  // ============================================================
  // CART DATA
  // ============================================================

  const cart = Array.isArray(data?.data) ? data.data : [];

  // ============================================================
  // SERVER SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const serverSummary = data?.summary || {};

    return {
      totalItems: Number(serverSummary.totalItems) || 0,

      totalQuantity: Number(serverSummary.totalQuantity) || 0,

      subtotal: Number(serverSummary.subtotal) || 0,

      discount:
        Number(serverSummary.discount ?? serverSummary.totalDiscount ?? 0) || 0,

      shipping: Number(serverSummary.shipping) || 0,

      tax: Number(serverSummary.tax) || 0,

      grandTotal: Number(serverSummary.grandTotal) || 0,
    };
  }, [data]);

  // ============================================================
  // SHIPPING
  // ============================================================

  const freeShippingRemaining = useMemo(() => {
    const remaining = FREE_SHIPPING_THRESHOLD - summary.subtotal;

    return remaining > 0 ? remaining : 0;
  }, [summary.subtotal]);

  const shippingProgress = Math.min(
    Math.max(summary.subtotal, 0),
    FREE_SHIPPING_THRESHOLD,
  );

  // ============================================================
  // REFRESH CART
  // ============================================================

  const refreshCart = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["cart", email],
      }),

      queryClient.invalidateQueries({
        queryKey: ["cart-count"],
      }),

      queryClient.invalidateQueries({
        queryKey: ["cart-summary"],
      }),
    ]);
  };

  // ============================================================
  // UPDATE QUANTITY
  // ============================================================

  const quantityMutation = useMutation({
    mutationFn: async ({ cartId, quantity }) => {
      const response = await axiosSecure.patch(`/carts/${cartId}`, {
        quantity,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to update quantity.");
      }

      return response.data;
    },

    onSuccess: async () => {
      await refreshCart();
    },

    onError: (mutationError) => {
      console.error("UPDATE CART ERROR:", mutationError);

      window.alert(
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to update quantity.",
      );
    },
  });

  // ============================================================
  // DELETE CART ITEM
  // ============================================================

  const deleteMutation = useMutation({
    mutationFn: async (cartId) => {
      const response = await axiosSecure.delete(`/carts/${cartId}`);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to remove cart item.",
        );
      }

      return response.data;
    },

    onSuccess: async () => {
      await refreshCart();
    },

    onError: (mutationError) => {
      console.error("DELETE CART ERROR:", mutationError);

      window.alert(
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to remove cart item.",
      );
    },
  });

  // ============================================================
  // MUTATION STATE
  // ============================================================

  const isUpdating = quantityMutation.isPending || deleteMutation.isPending;

  // ============================================================
  // INCREASE QUANTITY
  // ============================================================

  const handleIncrease = (item) => {
    if (!item?._id || isUpdating) {
      return;
    }

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return;
    }

    if (quantity >= MAX_QUANTITY) {
      window.alert(`Maximum quantity is ${MAX_QUANTITY}.`);
      return;
    }

    quantityMutation.mutate({
      cartId: item._id,
      quantity: quantity + 1,
    });
  };

  // ============================================================
  // DECREASE QUANTITY
  // ============================================================

  const handleDecrease = (item) => {
    if (!item?._id || isUpdating) {
      return;
    }

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 1) {
      return;
    }

    quantityMutation.mutate({
      cartId: item._id,
      quantity: quantity - 1,
    });
  };

  // ============================================================
  // DELETE ITEM
  // ============================================================

  const handleDelete = (cartId) => {
    if (!cartId || isUpdating) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this product?",
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(cartId);
  };

  // ============================================================
  // CHECKOUT
  // ============================================================

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", {
        state: {
          from: "/cart",
        },
      });

      return;
    }

    if (cart.length === 0) {
      window.alert("Your cart is empty.");
      return;
    }

    navigate("/checkout");
  };

  // ============================================================
  // CONTINUE SHOPPING
  // ============================================================

  const handleContinueShopping = () => {
    navigate("/products");
  };

  // ============================================================
  // INITIAL LOADING
  //
  // Skeleton appears only during the first load.
  // Once data exists, refetching will NOT remove the cart UI.
  // ============================================================

  const initialLoading = authLoading || (isPending && !data);

  if (initialLoading) {
    return (
      <section className="min-h-screen bg-base-200 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* HEADER SKELETON */}

          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="h-10 w-56 animate-pulse rounded-lg bg-base-300" />

              <div className="mt-3 h-5 w-48 animate-pulse rounded bg-base-300" />
            </div>

            <div className="h-12 w-48 animate-pulse rounded-lg bg-base-300" />
          </div>

          {/* CONTENT SKELETON */}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* ITEM SKELETONS */}

            <div className="space-y-5 lg:col-span-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="h-28 w-28 shrink-0 animate-pulse rounded-xl bg-base-300" />

                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-2/3 animate-pulse rounded bg-base-300" />

                      <div className="h-4 w-1/3 animate-pulse rounded bg-base-300" />

                      <div className="h-5 w-24 animate-pulse rounded bg-base-300" />
                    </div>

                    <div className="h-9 w-28 animate-pulse rounded bg-base-300" />
                  </div>
                </div>
              ))}
            </div>

            {/* SUMMARY SKELETON */}

            <div className="lg:col-span-4">
              <div className="h-[520px] animate-pulse rounded-2xl bg-base-300" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (isError) {
    return (
      <section className="min-h-screen bg-base-200 px-4 py-12 md:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl border border-error/20 bg-base-100 p-8 text-center shadow-sm">
            <FaShoppingCart className="mx-auto text-5xl text-error" />

            <h1 className="mt-5 text-3xl font-bold">Failed to Load Cart</h1>

            <p className="mt-3 text-base-content/60">
              {error?.response?.data?.message ||
                error?.message ||
                "Something went wrong while loading your cart."}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn btn-primary mt-6"
            >
              {isFetching && (
                <span className="loading loading-spinner loading-sm" />
              )}

              {isFetching ? "Loading..." : "Try Again"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // EMPTY CART
  // ============================================================

  if (data && cart.length === 0) {
    return (
      <section className="min-h-screen bg-base-200 px-4 py-12 md:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
            <FaShoppingCart className="mx-auto text-6xl text-base-content/30" />

            <h1 className="mt-6 text-3xl font-bold">Your Cart is Empty</h1>

            <p className="mt-3 text-base-content/60">
              Looks like you haven't added any products yet.
            </p>

            <button
              type="button"
              onClick={handleContinueShopping}
              className="btn btn-primary mt-8"
            >
              <FaArrowLeft />
              Continue Shopping
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
    <section className="min-h-screen bg-base-200 px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Shopping Cart</h1>

            <p className="mt-2 text-base-content/60">
              {summary.totalItems} Item(s) • {summary.totalQuantity} Quantity
            </p>
          </div>

          <button
            type="button"
            onClick={handleContinueShopping}
            className="btn btn-outline"
          >
            <FaArrowLeft />
            Continue Shopping
          </button>
        </div>

        {/* ======================================================
            BACKGROUND REFRESH
        ====================================================== */}

        {isFetching && !isPending && (
          <div className="mb-5 flex items-center gap-2 text-sm text-base-content/60">
            <span className="loading loading-spinner loading-xs" />
            Updating cart...
          </div>
        )}

        {/* ======================================================
            MAIN GRID
        ====================================================== */}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ====================================================
              CART ITEMS
          ==================================================== */}

          <div className="space-y-5 lg:col-span-8">
            {cart.map((item) => {
              const price = Number(item?.price) || 0;

              const finalPrice = Number(item?.finalPrice) || 0;

              const quantity = Number(item?.quantity) || 1;

              const subtotal = Number(item?.subtotal) || 0;

              const discount = Number(item?.discount) || 0;

              const isThisItemUpdating = quantityMutation.isPending;

              const isThisItemDeleting = deleteMutation.isPending;

              return (
                <div
                  key={String(item._id)}
                  className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition hover:shadow-md md:p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    {/* ==================================================
                        PRODUCT IMAGE
                    ================================================== */}

                    <div className="flex shrink-0 justify-center sm:block">
                      {item?.image ? (
                        <img
                          src={item.image}
                          alt={item?.name || "Product"}
                          loading="lazy"
                          decoding="async"
                          className="h-28 w-28 rounded-xl border border-base-300 object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;

                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-base-200 text-xs text-base-content/40">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* ==================================================
                        PRODUCT INFORMATION
                    ================================================== */}

                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-lg font-bold md:text-xl">
                        {item?.name || "Unnamed Product"}
                      </h2>

                      {item?.brand && (
                        <p className="mt-1 text-sm text-base-content/60">
                          {item.brand}
                        </p>
                      )}

                      {item?.category && (
                        <p className="mt-1 text-xs capitalize text-base-content/50">
                          {item.category}
                        </p>
                      )}

                      {item?.weight && (
                        <p className="mt-1 text-xs text-base-content/50">
                          Weight: {item.weight}
                        </p>
                      )}

                      {discount > 0 && (
                        <span className="badge badge-success mt-2">
                          {discount}% OFF
                        </span>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-primary">
                          ৳{finalPrice.toFixed(2)}
                        </span>

                        {discount > 0 && (
                          <span className="text-sm text-base-content/40 line-through">
                            ৳{price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ==================================================
                        QUANTITY + DELETE
                    ================================================== */}

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="join">
                        {/* DECREASE */}

                        <button
                          type="button"
                          className="btn btn-sm join-item"
                          disabled={quantity <= 1 || isUpdating}
                          onClick={() => handleDecrease(item)}
                          aria-label={`Decrease ${item?.name || "product"} quantity`}
                        >
                          <FaMinus />
                        </button>

                        {/* CURRENT QUANTITY */}

                        <span className="btn btn-sm join-item no-animation cursor-default">
                          {quantity}
                        </span>

                        {/* INCREASE */}

                        <button
                          type="button"
                          className="btn btn-sm join-item"
                          disabled={quantity >= MAX_QUANTITY || isUpdating}
                          onClick={() => handleIncrease(item)}
                          aria-label={`Increase ${item?.name || "product"} quantity`}
                        >
                          <FaPlus />
                        </button>
                      </div>

                      {/* DELETE */}

                      <button
                        type="button"
                        className="btn btn-error btn-sm"
                        disabled={isUpdating}
                        onClick={() => handleDelete(item?._id)}
                        aria-label={`Remove ${item?.name || "product"}`}
                      >
                        {isThisItemDeleting ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ==================================================
                      ITEM SUBTOTAL
                  ================================================== */}

                  <div className="mt-5 flex items-center justify-between border-t border-base-300 pt-4">
                    <span className="text-sm text-base-content/60">
                      Item Subtotal
                    </span>

                    <span className="text-lg font-bold text-primary">
                      ৳{subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ====================================================
              ORDER SUMMARY
          ==================================================== */}

          <div className="lg:col-span-4">
            <div className="sticky top-6 rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
              {/* TITLE */}

              <div className="flex items-center gap-3">
                <FaShoppingCart className="text-xl text-primary" />

                <h2 className="text-2xl font-bold">Order Summary</h2>
              </div>

              {/* ==================================================
                  FREE SHIPPING
              ================================================== */}

              {summary.shipping > 0 ? (
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Free Shipping Progress</span>

                    <span>৳{freeShippingRemaining.toFixed(2)} left</span>
                  </div>

                  <progress
                    className="progress progress-success w-full"
                    value={shippingProgress}
                    max={FREE_SHIPPING_THRESHOLD}
                  />
                </div>
              ) : (
                <div className="alert alert-success mt-5">
                  🎉 You unlocked FREE Shipping.
                </div>
              )}

              <div className="divider" />

              {/* ==================================================
                  SUMMARY DETAILS
              ================================================== */}

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Items</span>

                  <span>{summary.totalItems}</span>
                </div>

                <div className="flex justify-between">
                  <span>Total Quantity</span>

                  <span>{summary.totalQuantity}</span>
                </div>

                <div className="flex justify-between">
                  <span>Subtotal</span>

                  <span>৳{summary.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-success">
                  <span>Discount</span>

                  <span>- ৳{summary.discount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>

                  <span>
                    {summary.shipping === 0
                      ? "FREE"
                      : `৳${summary.shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>

                  <span>৳{summary.tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="divider" />

              {/* ==================================================
                  GRAND TOTAL
              ================================================== */}

              <div className="flex justify-between text-xl font-bold">
                <span>Grand Total</span>

                <span className="text-primary">
                  ৳{summary.grandTotal.toFixed(2)}
                </span>
              </div>

              {/* ==================================================
                  CHECKOUT
              ================================================== */}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isUpdating}
                className="btn btn-primary btn-lg mt-6 w-full"
              >
                {isUpdating ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FaCreditCard />
                )}

                {isUpdating ? "Updating..." : "Proceed to Checkout"}
              </button>

              {/* ==================================================
                  CONTINUE SHOPPING
              ================================================== */}

              <button
                type="button"
                onClick={handleContinueShopping}
                className="btn btn-outline mt-3 w-full"
              >
                <FaArrowLeft />
                Continue Shopping
              </button>

              <div className="divider" />

              {/* ==================================================
                  FEATURES
              ================================================== */}

              <div className="space-y-5">
                {/* DELIVERY */}

                <div className="flex items-start gap-3">
                  <FaTruck className="mt-1 text-xl text-primary" />

                  <div>
                    <h3 className="font-semibold">Fast Delivery</h3>

                    <p className="text-sm text-base-content/60">
                      Delivery within 1–3 business days.
                    </p>
                  </div>
                </div>

                {/* PAYMENT */}

                <div className="flex items-start gap-3">
                  <FaShieldAlt className="mt-1 text-xl text-success" />

                  <div>
                    <h3 className="font-semibold">Secure Payment</h3>

                    <p className="text-sm text-base-content/60">
                      100% secure payment protection.
                    </p>
                  </div>
                </div>

                {/* RETURNS */}

                <div className="flex items-start gap-3">
                  <FaShoppingCart className="mt-1 text-xl text-warning" />

                  <div>
                    <h3 className="font-semibold">Easy Returns</h3>

                    <p className="text-sm text-base-content/60">
                      7-day easy return policy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cart;
