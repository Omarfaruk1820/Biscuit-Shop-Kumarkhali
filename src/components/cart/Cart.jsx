import { useContext, useMemo } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

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

const API = import.meta.env.VITE_API_URL;
import { useNavigate } from "react-router";

const Cart = () => {
  const { user, loading } = useContext(AuthContext);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const email = user?.email;

  /* =====================================================
          GET CART DATA
===================================================== */

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["cart", email],

    enabled: !!email && !loading,

    queryFn: async () => {
      const res = await axios.get(`${API}/carts`, {
        withCredentials: true,
      });

      return res.data;
    },
  });

  /* =====================================================
          CART DATA
===================================================== */

  const cart = data?.data || [];

  const summary = data?.summary || {
    totalItems: 0,
    totalQuantity: 0,
    totalPrice: 0,
  };

  /* =====================================================
          DELETE CART ITEM
===================================================== */

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API}/carts/${id}`, {
        withCredentials: true,
      });

      return id;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart", email],
      });
    },
  });

  /* =====================================================
          UPDATE QUANTITY
===================================================== */

  const quantityMutation = useMutation({
    mutationFn: async ({ id, quantity }) => {
      await axios.patch(
        `${API}/carts/${id}`,
        { quantity },
        {
          withCredentials: true,
        },
      );

      return { id, quantity };
    },

    // Optimistic Update
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({
        queryKey: ["cart", email],
      });

      const previousData = queryClient.getQueryData(["cart", email]);

      queryClient.setQueryData(["cart", email], (old) => {
        if (!old) return old;

        const updatedCart = old.data.map((item) => {
          if (item._id !== id) return item;

          return {
            ...item,
            quantity,
            subtotal: Number((item.finalPrice * quantity).toFixed(2)),
          };
        });

        const newSummary = updatedCart.reduce(
          (acc, item) => {
            acc.totalItems += 1;
            acc.totalQuantity += Number(item.quantity);

            acc.totalPrice += Number(item.subtotal);

            return acc;
          },
          {
            totalItems: 0,
            totalQuantity: 0,
            totalPrice: 0,
          },
        );

        newSummary.totalPrice = Number(newSummary.totalPrice.toFixed(2));

        return {
          ...old,
          data: updatedCart,
          summary: newSummary,
        };
      });

      return {
        previousData,
      };
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(["cart", email], context.previousData);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart", email],
      });
    },
  });

  /* =====================================================
          HANDLERS
===================================================== */

  const handleIncrease = (item) => {
    if (item.quantity >= 99) return;

    quantityMutation.mutate({
      id: item._id,
      quantity: item.quantity + 1,
    });
  };

  const handleDecrease = (item) => {
    if (item.quantity <= 1) return;

    quantityMutation.mutate({
      id: item._id,
      quantity: item.quantity - 1,
    });
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Remove this product from cart?");

    if (!confirmDelete) return;

    deleteMutation.mutate(id);
  };

  /* =====================================================
          SHIPPING CALCULATION
===================================================== */

  const shipping = useMemo(() => {
    return summary.totalPrice >= 1000 ? 0 : 60;
  }, [summary.totalPrice]);

  const tax = 0;

  const grandTotal = useMemo(() => {
    return Number((summary.totalPrice + shipping + tax).toFixed(2));
  }, [summary.totalPrice, shipping]);

  const freeShippingRemaining = useMemo(() => {
    if (summary.totalPrice >= 1000) return 0;

    return Number((1000 - summary.totalPrice).toFixed(2));
  }, [summary.totalPrice]);

  /* =====================================================
          LOADING UI
===================================================== */

  if (loading || isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-56 bg-base-300 rounded"></div>

          {[1, 2, 3].map((item) => (
            <div key={item} className="h-36 rounded-xl bg-base-200"></div>
          ))}
        </div>
      </div>
    );
  }

  /* =====================================================
          ERROR UI
===================================================== */

  if (isError) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <h2 className="text-2xl font-bold text-error">Failed to load cart</h2>

        <p className="mt-3 text-gray-500">{error?.message}</p>

        <button onClick={refetch} className="btn btn-primary mt-6">
          Try Again
        </button>
      </div>
    );
  }

  /* =====================================================
          EMPTY CART
===================================================== */

  if (!cart.length) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <FaShoppingCart className="mx-auto text-primary mb-6" size={80} />

        <h2 className="text-3xl font-bold">Your Cart is Empty</h2>

        <p className="mt-3 text-gray-500">
          Looks like you haven't added anything yet.
        </p>

        <Link to="/products" className="btn btn-primary mt-8">
          Continue Shopping
        </Link>
      </div>
    );
  }

  /* =====================================================
          PART 2 STARTS HERE
===================================================== */

  return (
    <>
      {/* Desktop Cart UI */}
      {/* ==========================================
        MOBILE & TABLET CART
========================================== */}
      <div className="lg:hidden space-y-5">
        {cart.map((item) => (
          <div
            key={item._id}
            className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden"
          >
            {/* Image */}

            <img
              src={item.image}
              alt={item.name}
              className="w-full h-52 object-cover"
            />

            {/* Content */}

            <div className="p-5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="font-bold text-xl">{item.name}</h2>

                  <p className="text-sm text-gray-500 mt-1">Product ID</p>

                  <p className="text-xs break-all">{item.productId}</p>
                </div>

                {item.discount > 0 && (
                  <div className="badge badge-success">
                    {item.discount}% OFF
                  </div>
                )}
              </div>

              {/* Price */}

              <div className="mt-5 flex items-center gap-3">
                <span className="text-xl font-bold text-primary">
                  ৳{item.finalPrice}
                </span>

                {item.discount > 0 && (
                  <span className="text-sm line-through text-gray-400">
                    ৳{item.price}
                  </span>
                )}
              </div>

              {/* Quantity */}

              <div className="mt-6 flex justify-between items-center">
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    disabled={item.quantity <= 1 || quantityMutation.isPending}
                    onClick={() => handleDecrease(item)}
                  >
                    <FaMinus />
                  </button>

                  <button className="join-item btn btn-sm btn-disabled">
                    {item.quantity}
                  </button>

                  <button
                    className="join-item btn btn-sm"
                    disabled={item.quantity >= 99 || quantityMutation.isPending}
                    onClick={() => handleIncrease(item)}
                  >
                    <FaPlus />
                  </button>
                </div>

                <button
                  className="btn btn-error btn-sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => handleDelete(item._id)}
                >
                  <FaTrash className="mr-1" />
                  Remove
                </button>
              </div>

              {/* Divider */}

              <div className="divider my-5"></div>

              {/* Subtotal */}

              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal</span>

                <span className="text-xl font-bold text-primary">
                  ৳{item.subtotal}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Mobile Cart UI */}
      {/* Order Summary */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Shopping Cart</h1>

            <p className="text-gray-500 mt-2">
              {summary.totalItems} Items • {summary.totalQuantity} Quantity
            </p>
          </div>

          <Link to="/products" className="btn btn-outline">
            <FaArrowLeft />
            Continue Shopping
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* ============================
              CART TABLE
      ============================= */}

          <div className="hidden lg:block lg:col-span-8">
            <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow">
              <table className="table">
                <thead className="bg-base-200">
                  <tr>
                    <th>Product</th>

                    <th className="text-center">Price</th>

                    <th className="text-center">Quantity</th>

                    <th className="text-center">Total</th>

                    <th className="text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {cart.map((item) => (
                    <tr key={item._id}>
                      {/* PRODUCT */}

                      <td>
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 rounded-xl object-cover border"
                          />

                          <div>
                            <h3 className="font-bold text-lg">{item.name}</h3>

                            <p className="text-sm text-gray-500 mt-1">
                              Product ID
                            </p>

                            <p className="text-xs break-all">
                              {item.productId}
                            </p>

                            {item.discount > 0 && (
                              <div className="badge badge-success mt-2">
                                {item.discount}% OFF
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* PRICE */}

                      <td className="text-center">
                        {item.discount > 0 ? (
                          <div>
                            <p className="font-bold text-primary">
                              ৳{item.finalPrice}
                            </p>

                            <p className="text-sm line-through text-gray-400">
                              ৳{item.price}
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold">৳{item.price}</p>
                        )}
                      </td>

                      {/* QUANTITY */}

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

                      {/* SUBTOTAL */}

                      <td className="text-center">
                        <span className="font-bold text-lg">
                          ৳{item.subtotal}
                        </span>
                      </td>

                      {/* REMOVE */}

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

          {/* ============================
           RIGHT SIDEBAR
      ============================= */}
          {/* ==========================================
            ORDER SUMMARY
========================================== */}

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Coupon */}

              <div className="card bg-base-100 border border-base-300 shadow">
                <div className="card-body">
                  <h2 className="card-title">Coupon Code</h2>

                  <div className="join">
                    <input
                      type="text"
                      placeholder="Enter coupon"
                      className="input input-bordered join-item flex-1"
                    />

                    <button className="btn btn-primary join-item">Apply</button>
                  </div>
                </div>
              </div>

              {/* Summary */}

              <div className="card bg-base-100 border border-base-300 shadow">
                <div className="card-body">
                  <h2 className="card-title text-2xl">Order Summary</h2>

                  {/* Progress */}

                  {summary.totalPrice < 1000 ? (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Free Shipping Progress</span>

                        <span>৳{freeShippingRemaining} left</span>
                      </div>

                      <progress
                        className="progress progress-success w-full"
                        value={summary.totalPrice}
                        max="1000"
                      ></progress>
                    </div>
                  ) : (
                    <div className="alert alert-success mt-4">
                      🎉 Congratulations! You unlocked FREE Shipping.
                    </div>
                  )}

                  <div className="divider"></div>

                  {/* Summary Row */}

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Items</span>

                      <span>{summary.totalItems}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Quantity</span>

                      <span>{summary.totalQuantity}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Subtotal</span>

                      <span>৳{summary.totalPrice}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Shipping</span>

                      <span>{shipping === 0 ? "FREE" : `৳${shipping}`}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Tax</span>

                      <span>৳{tax}</span>
                    </div>
                  </div>

                  <div className="divider"></div>

                  {/* Grand Total */}

                  <div className="flex justify-between text-xl font-bold">
                    <span>Grand Total</span>

                    <span className="text-primary">৳{grandTotal}</span>
                  </div>

                  {/* Checkout */}

                  {/* <button className="btn btn-primary btn-lg w-full mt-6">
                    <FaCreditCard />
                    Proceed to Checkout
                  </button> */}
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }

                      navigate("/checkout");
                    }}
                    className="btn btn-primary btn-lg w-full mt-6"
                  >
                    <FaCreditCard />
                    Proceed to Checkout
                  </button>

                  <button className="btn btn-outline w-full">
                    <FaArrowLeft />
                    Continue Shopping
                  </button>
                </div>
              </div>

              {/* Features */}

              <div className="card bg-base-100 border border-base-300 shadow">
                <div className="card-body space-y-4">
                  <div className="flex items-center gap-4">
                    <FaTruck className="text-primary" size={22} />

                    <div>
                      <h3 className="font-semibold">Fast Delivery</h3>

                      <p className="text-sm text-gray-500">1-3 Business Days</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <FaShieldAlt className="text-success" size={22} />

                    <div>
                      <h3 className="font-semibold">Secure Payment</h3>

                      <p className="text-sm text-gray-500">
                        SSL Encrypted Checkout
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <FaShoppingCart className="text-warning" size={22} />

                    <div>
                      <h3 className="font-semibold">Easy Returns</h3>

                      <p className="text-sm text-gray-500">
                        7-Day Return Policy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
    </>
  );
};

export default Cart;
