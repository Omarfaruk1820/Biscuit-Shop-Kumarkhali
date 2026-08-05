import { useContext, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

  const email = user?.email;

  /* =====================================================
      FETCH CART
  ===================================================== */

  const fetchCart = async () => {
    const { data } = await axiosSecure.get("/carts");

    return data;
  };

  /* =====================================================
      GET CART
  ===================================================== */

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["cart", email],

    queryFn: fetchCart,

    enabled: !!email && !loading,

    staleTime: 1000 * 60,

    retry: 1,
  });

  /* =====================================================
      CART DATA
  ===================================================== */

  const cart = data?.data ?? [];

  const summary = data?.summary ?? {
    totalItems: 0,
    totalQuantity: 0,
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    grandTotal: 0,
  };
  /* =====================================================
      DELETE CART ITEM
  ===================================================== */

  const deleteMutation = useMutation({
    mutationFn: async (cartId) => {
      const { data } = axiosSecure.delete(`/carts/${cartId}`);

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart", email],
      });
    },

    onError: (error) => {
      console.error("DELETE CART ERROR:", error);

      alert(error?.response?.data?.message || "Failed to remove cart item.");
    },
  });

  /* =====================================================
      UPDATE CART QUANTITY
  ===================================================== */

  const quantityMutation = useMutation({
    mutationFn: async ({ cartId, quantity }) => {
      const { data } = await axiosSecure.patch(`/carts/${cartId}`, {
        quantity,
      });

      return data;
    },

    /* ------------------------------------------
        Optimistic Update
    ------------------------------------------ */

    onMutate: async ({ cartId, quantity }) => {
      await queryClient.cancelQueries({
        queryKey: ["cart", email],
      });

      const previousCart = queryClient.getQueryData(["cart", email]);

      queryClient.setQueryData(["cart", email], (old) => {
        if (!old) return old;

        const updatedCart = old.data.map((item) => {
          if (item._id !== cartId) return item;

          return {
            ...item,
            quantity,
            subtotal: Number((item.finalPrice * quantity).toFixed(2)),
          };
        });

        return {
          ...old,
          data: updatedCart,
        };
      });

      return {
        previousCart,
      };
    },

    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart", email], context.previousCart);
      }

      alert(error?.response?.data?.message || "Failed to update quantity.");
    },

    /* ------------------------------------------
        Refresh Cart
    ------------------------------------------ */

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart", email],
      });
    },
  });
  /* =====================================================
      INCREASE QUANTITY
  ===================================================== */

  const handleIncrease = (item) => {
    if (quantityMutation.isPending) return;

    if (item.quantity >= 99) return;

    quantityMutation.mutate({
      cartId: item._id,
      quantity: item.quantity + 1,
    });
  };

  /* =====================================================
      DECREASE QUANTITY
  ===================================================== */

  const handleDecrease = (item) => {
    if (quantityMutation.isPending) return;

    if (item.quantity <= 1) return;

    quantityMutation.mutate({
      cartId: item._id,
      quantity: item.quantity - 1,
    });
  };

  /* =====================================================
      DELETE CART ITEM
  ===================================================== */

  const handleDelete = (cartId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this product?",
    );

    if (!confirmed) return;

    deleteMutation.mutate(cartId);
  };

  /* =====================================================
      CHECKOUT
  ===================================================== */

  const handleCheckout = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    navigate("/checkout");
  };

  /* =====================================================
      CONTINUE SHOPPING
  ===================================================== */

  const handleContinueShopping = () => {
    navigate("/products");
  };

  const freeShippingRemaining = useMemo(() => {
    const remaining = 1000 - Number(summary.subtotal);

    return remaining > 0 ? remaining.toFixed(2) : 0;
  }, [summary.subtotal]);

  /* =====================================================
      LOADING UI
  ===================================================== */

  /* =====================================================
   LOADING UI
===================================================== */
  if (loading || isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 rounded-xl bg-base-200 animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  /* =====================================================
      ERROR UI
  ===================================================== */

  /* =====================================================
   ERROR UI
===================================================== */
  if (isError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-error">Failed to load cart</h2>

        <p className="mt-4 text-gray-500">
          {error?.response?.data?.message ||
            error?.message ||
            "Something went wrong."}
        </p>

        <button onClick={() => refetch()} className="btn btn-primary mt-6">
          Try Again
        </button>
      </div>
    );
  }

  /* =====================================================
   EMPTY CART
===================================================== */
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold">Your Cart is Empty</h2>

        <p className="mt-4 text-gray-500">
          Looks like you haven't added any products yet.
        </p>

        <button
          onClick={handleContinueShopping}
          className="btn btn-primary mt-8"
        >
          <FaArrowLeft />
          Continue Shopping
        </button>
      </div>
    );
  }
  /* =====================================================
      MAIN UI
  ===================================================== */

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Shopping Cart</h1>

          <p className="text-gray-500 mt-2">
            {summary.totalItems} Item(s) • {summary.totalQuantity} Quantity
          </p>
        </div>

        <button onClick={handleContinueShopping} className="btn btn-outline">
          <FaArrowLeft />
          Continue Shopping
        </button>
      </div>

      {/* ==========================================
        Main Grid
    ========================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ===========================
          Mobile Cart
      =========================== */}

        <div className="lg:hidden space-y-5">
          {/* এখানে Mobile Cart JSX থাকবে */}
          {/* =====================================================
            DESKTOP CART TABLE
        ===================================================== */}

          <div className="hidden lg:block lg:col-span-8">
            <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow">
              <table className="table">
                <thead className="bg-base-200">
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Price</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Subtotal</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {cart.map((item) => (
                    <tr key={item._id}>
                      {/* Product */}

                      <td>
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover border"
                          />

                          <div>
                            <h3 className="font-semibold text-lg">
                              {item.name}
                            </h3>

                            {item.brand && (
                              <p className="text-sm text-gray-500">
                                {item.brand}
                              </p>
                            )}

                            {item.discount > 0 && (
                              <div className="badge badge-success mt-2">
                                {item.discount}% OFF
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price */}

                      <td className="text-center">
                        <div className="font-bold text-primary">
                          ৳{item.finalPrice}
                        </div>

                        {item.discount > 0 && (
                          <div className="text-sm line-through text-gray-400">
                            ৳{item.price}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}

                      <td>
                        <div className="flex justify-center">
                          <div className="join">
                            <button
                              className="join-item btn btn-sm"
                              disabled={
                                item.quantity <= 1 || quantityMutation.isPending
                              }
                              onClick={() => handleDecrease(item)}
                            >
                              <FaMinus />
                            </button>

                            <button className="join-item btn btn-sm btn-disabled">
                              {item.quantity}
                            </button>

                            <button
                              className="join-item btn btn-sm"
                              disabled={
                                item.quantity >= 99 ||
                                quantityMutation.isPending
                              }
                              onClick={() => handleIncrease(item)}
                            >
                              <FaPlus />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Subtotal */}

                      <td className="text-center">
                        <span className="font-bold text-lg text-primary">
                          ৳{item.subtotal}
                        </span>
                      </td>

                      {/* Remove */}

                      <td>
                        <div className="flex justify-center">
                          <button
                            className="btn btn-error btn-sm"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(item._id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===========================
          Desktop Cart Table
      =========================== */}

        <div className="hidden lg:block lg:col-span-8">
          {/* এখানে Desktop Table JSX থাকবে */}
          {/* =====================================================
            DESKTOP CART TABLE
        ===================================================== */}

          <div className="hidden lg:block lg:col-span-8">
            <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow">
              <table className="table">
                <thead className="bg-base-200">
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Price</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Subtotal</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {cart.map((item) => (
                    <tr key={item._id}>
                      {/* Product */}

                      <td>
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover border"
                          />

                          <div>
                            <h3 className="font-semibold text-lg">
                              {item.name}
                            </h3>

                            {item.brand && (
                              <p className="text-sm text-gray-500">
                                {item.brand}
                              </p>
                            )}

                            {item.discount > 0 && (
                              <div className="badge badge-success mt-2">
                                {item.discount}% OFF
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price */}

                      <td className="text-center">
                        <div className="font-bold text-primary">
                          ৳{item.finalPrice}
                        </div>

                        {item.discount > 0 && (
                          <div className="text-sm line-through text-gray-400">
                            ৳{item.price}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}

                      <td>
                        <div className="flex justify-center">
                          <div className="join">
                            <button
                              className="join-item btn btn-sm"
                              disabled={
                                item.quantity <= 1 || quantityMutation.isPending
                              }
                              onClick={() => handleDecrease(item)}
                            >
                              <FaMinus />
                            </button>

                            <button className="join-item btn btn-sm btn-disabled">
                              {item.quantity}
                            </button>

                            <button
                              className="join-item btn btn-sm"
                              disabled={
                                item.quantity >= 99 ||
                                quantityMutation.isPending
                              }
                              onClick={() => handleIncrease(item)}
                            >
                              <FaPlus />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Subtotal */}

                      <td className="text-center">
                        <span className="font-bold text-lg text-primary">
                          ৳{item.subtotal}
                        </span>
                      </td>

                      {/* Remove */}

                      <td>
                        <div className="flex justify-center">
                          <button
                            className="btn btn-error btn-sm"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(item._id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===========================
          Order Summary
      =========================== */}

        <div className="lg:col-span-4">
          <div className="sticky top-24">
            {/* এখানে পুরো Order Summary JSX থাকবে */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <div className="card bg-base-100 border border-base-300 shadow">
                  <div className="card-body">
                    <h2 className="card-title text-2xl">Order Summary</h2>

                    {/* Free Shipping */}

                    {summary.shipping > 0 ? (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Free Shipping Progress</span>

                          <span>৳{freeShippingRemaining} left</span>
                        </div>

                        <progress
                          className="progress progress-success w-full"
                          value={summary.subtotal}
                          max={1000}
                        ></progress>
                      </div>
                    ) : (
                      <div className="alert alert-success mt-4">
                        🎉 Congratulations! You unlocked FREE Shipping.
                      </div>
                    )}

                    <div className="divider"></div>

                    {/* Summary */}

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
                        <span>৳{summary.subtotal}</span>
                      </div>

                      <div className="flex justify-between text-success">
                        <span>Discount</span>
                        <span>- ৳{summary.discount}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Shipping</span>

                        <span>
                          {summary.shipping === 0
                            ? "FREE"
                            : `৳${summary.shipping}`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>৳{summary.tax}</span>
                      </div>
                    </div>

                    <div className="divider"></div>

                    {/* Grand Total */}

                    <div className="flex justify-between text-xl font-bold">
                      <span>Grand Total</span>

                      <span className="text-primary">
                        ৳{summary.grandTotal}
                      </span>
                    </div>

                    {/* Checkout */}

                    <button
                      onClick={handleCheckout}
                      className="btn btn-primary btn-lg w-full mt-6"
                    >
                      <FaCreditCard />
                      Proceed to Checkout
                    </button>

                    {/* Continue Shopping */}

                    <button
                      onClick={handleContinueShopping}
                      className="btn btn-outline w-full mt-3"
                    >
                      <FaArrowLeft />
                      Continue Shopping
                    </button>

                    {/* Features */}

                    <div className="divider"></div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FaTruck className="text-primary text-xl" />

                        <div>
                          <h3 className="font-semibold">Fast Delivery</h3>

                          <p className="text-sm text-gray-500">
                            Delivery within 1–3 business days.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <FaShieldAlt className="text-success text-xl" />

                        <div>
                          <h3 className="font-semibold">Secure Payment</h3>

                          <p className="text-sm text-gray-500">
                            100% secure payment protection.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <FaShoppingCart className="text-warning text-xl" />

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
      </div>
    </div>
  );
};

export default Cart;
