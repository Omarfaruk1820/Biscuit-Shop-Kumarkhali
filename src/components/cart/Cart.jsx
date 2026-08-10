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

const Cart = () => {
  const { user, loading } = useContext(AuthContext);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const email = user?.email || "";

  // ============================================================
  // FETCH CART
  // ============================================================

  const fetchCart = async () => {
    const response = await axiosSecure.get("/carts");

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to fetch cart.");
    }

    return response.data;
  };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["cart", email],
    queryFn: fetchCart,
    enabled: Boolean(email) && !loading,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // ============================================================
  // CART DATA
  // ============================================================

  const cart = Array.isArray(data?.data) ? data.data : [];

  const summary = {
    totalItems: Number(data?.summary?.totalItems) || 0,
    totalQuantity: Number(data?.summary?.totalQuantity) || 0,
    subtotal: Number(data?.summary?.subtotal) || 0,
    discount: Number(data?.summary?.discount) || 0,
    shipping: Number(data?.summary?.shipping) || 0,
    tax: Number(data?.summary?.tax) || 0,
    grandTotal: Number(data?.summary?.grandTotal) || 0,
  };

  // ============================================================
  // FREE SHIPPING
  // ============================================================

  const freeShippingRemaining = useMemo(() => {
    const remaining = 1000 - summary.subtotal;

    return remaining > 0 ? remaining : 0;
  }, [summary.subtotal]);

  // ============================================================
  // REFRESH CART
  // ============================================================

  const refreshCart = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["cart", email],
    });

    await queryClient.invalidateQueries({
      queryKey: ["cart-count"],
    });

    await queryClient.invalidateQueries({
      queryKey: ["cart-summary"],
    });
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

    onError: (error) => {
      console.error("UPDATE CART ERROR:", error);

      window.alert(
        error?.response?.data?.message ||
          error?.message ||
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

    onError: (error) => {
      console.error("DELETE CART ERROR:", error);

      window.alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to remove cart item.",
      );
    },
  });

  // ============================================================
  // INCREASE QUANTITY
  // ============================================================

  const handleIncrease = (item) => {
    if (!item?._id) return;

    if (quantityMutation.isPending) return;

    const quantity = Number(item.quantity) || 1;

    if (quantity >= 99) {
      window.alert("Maximum quantity is 99.");
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
    if (!item?._id) return;

    if (quantityMutation.isPending) return;

    const quantity = Number(item.quantity) || 1;

    if (quantity <= 1) {
      return;
    }

    quantityMutation.mutate({
      cartId: item._id,
      quantity: quantity - 1,
    });
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = (cartId) => {
    if (!cartId) return;

    if (deleteMutation.isPending) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this product?",
    );

    if (!confirmed) return;

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
  // LOADING
  // ============================================================

  if (loading || isPending) {
    return (
      <section className="min-h-screen bg-base-200 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-base-300" />

            <div className="mt-3 h-5 w-48 animate-pulse rounded bg-base-300" />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-2xl bg-base-100 p-5 shadow"
                >
                  <div className="h-24 w-24 animate-pulse rounded-xl bg-base-300" />

                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-base-300" />

                    <div className="h-4 w-1/3 animate-pulse rounded bg-base-300" />

                    <div className="h-8 w-32 animate-pulse rounded bg-base-300" />
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4">
              <div className="h-96 animate-pulse rounded-2xl bg-base-300" />
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
      <section className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-base-100 p-8 text-center shadow-lg">
          <FaShoppingCart className="mx-auto text-5xl text-error" />

          <h2 className="mt-4 text-2xl font-bold">Failed to Load Cart</h2>

          <p className="mt-3 text-sm text-gray-500">
            {error?.response?.data?.message ||
              error?.message ||
              "Something went wrong while loading your cart."}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-primary mt-6"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // ============================================================
  // EMPTY CART
  // ============================================================

  if (cart.length === 0) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl bg-base-100 p-10 text-center shadow-lg">
          <FaShoppingCart className="mx-auto text-6xl text-primary" />

          <h1 className="mt-6 text-3xl font-bold">Your Cart is Empty</h1>

          <p className="mt-3 text-gray-500">
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
      </section>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <section className="min-h-screen bg-base-200 px-4 py-8 md:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Shopping Cart</h1>

            <p className="mt-2 text-gray-500">
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

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* CART ITEMS */}

          <div className="space-y-5 lg:col-span-8">
            {cart.map((item) => {
              const price = Number(item.price) || 0;
              const finalPrice = Number(item.finalPrice) || 0;
              const quantity = Number(item.quantity) || 1;
              const subtotal = Number(item.subtotal) || 0;
              const discount = Number(item.discount) || 0;

              const isUpdating = quantityMutation.isPending;

              const isDeleting = deleteMutation.isPending;

              return (
                <div
                  key={item._id}
                  className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition hover:shadow-md md:p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    {/* IMAGE */}

                    <div className="flex justify-center sm:block">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || "Product"}
                          loading="lazy"
                          decoding="async"
                          className="h-28 w-28 rounded-xl border object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-base-200 text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* PRODUCT INFO */}

                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-lg font-bold md:text-xl">
                        {item.name || "Unnamed Product"}
                      </h2>

                      {item.brand && (
                        <p className="mt-1 text-sm text-gray-500">
                          {item.brand}
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
                          <span className="text-sm text-gray-400 line-through">
                            ৳{price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* QUANTITY */}

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="join">
                        <button
                          type="button"
                          className="btn btn-sm join-item"
                          disabled={quantity <= 1 || isUpdating || isDeleting}
                          onClick={() => handleDecrease(item)}
                        >
                          <FaMinus />
                        </button>

                        <span className="btn btn-sm join-item no-animation cursor-default">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          className="btn btn-sm join-item"
                          disabled={quantity >= 99 || isUpdating || isDeleting}
                          onClick={() => handleIncrease(item)}
                        >
                          <FaPlus />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn btn-error btn-sm"
                        disabled={isDeleting || isUpdating}
                        onClick={() => handleDelete(item._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* SUBTOTAL */}

                  <div className="mt-5 flex items-center justify-between border-t border-base-300 pt-4">
                    <span className="text-sm text-gray-500">Item Subtotal</span>

                    <span className="text-lg font-bold text-primary">
                      ৳{subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY */}

          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <div className="card border border-base-300 bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-2xl">Order Summary</h2>

                  {/* SHIPPING */}

                  {summary.shipping > 0 ? (
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-sm">
                        <span>Free Shipping Progress</span>

                        <span>৳{freeShippingRemaining.toFixed(2)} left</span>
                      </div>

                      <progress
                        className="progress progress-success w-full"
                        value={Math.min(summary.subtotal, 1000)}
                        max="1000"
                      />
                    </div>
                  ) : (
                    <div className="alert alert-success mt-4">
                      🎉 You unlocked FREE Shipping.
                    </div>
                  )}

                  <div className="divider" />

                  {/* SUMMARY */}

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

                  {/* GRAND TOTAL */}

                  <div className="flex justify-between text-xl font-bold">
                    <span>Grand Total</span>

                    <span className="text-primary">
                      ৳{summary.grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* CHECKOUT */}

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={
                      quantityMutation.isPending || deleteMutation.isPending
                    }
                    className="btn btn-primary btn-lg mt-6 w-full"
                  >
                    <FaCreditCard />
                    Proceed to Checkout
                  </button>

                  {/* CONTINUE */}

                  <button
                    type="button"
                    onClick={handleContinueShopping}
                    className="btn btn-outline mt-3 w-full"
                  >
                    <FaArrowLeft />
                    Continue Shopping
                  </button>

                  <div className="divider" />

                  {/* FEATURES */}

                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <FaTruck className="mt-1 text-xl text-primary" />

                      <div>
                        <h3 className="font-semibold">Fast Delivery</h3>

                        <p className="text-sm text-gray-500">
                          Delivery within 1–3 business days.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FaShieldAlt className="mt-1 text-xl text-success" />

                      <div>
                        <h3 className="font-semibold">Secure Payment</h3>

                        <p className="text-sm text-gray-500">
                          100% secure payment protection.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FaShoppingCart className="mt-1 text-xl text-warning" />

                      <div>
                        <h3 className="font-semibold">Easy Returns</h3>

                        <p className="text-sm text-gray-500">
                          7-day easy return policy.
                        </p>
                      </div>
                    </div>
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
