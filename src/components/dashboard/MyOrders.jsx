import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";

const API = import.meta.env.VITE_API_URL;

const STATUS_OPTIONS = [
  "all",
  "pending",
  "processing",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

const MyOrders = () => {
  const { user, loading } = useContext(AuthContext);

  const queryClient = useQueryClient();

  const [status, setStatus] = useState("all");

  // =====================================
  // Get Orders
  // =====================================

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-orders", user?.email, status],

    enabled: !!user?.email && !loading,

    queryFn: async () => {
      const url =
        status === "all"
          ? `${API}/orders/my`
          : `${API}/orders/my?status=${status}`;

      const res = await axios.get(url, {
        withCredentials: true,
      });

      return res.data;
    },
  });

  const orders = data?.data || [];

  // =====================================
  // Cancel Order
  // =====================================

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.patch(
        `${API}/orders/cancel/${id}`,
        {},
        {
          withCredentials: true,
        },
      );

      return res.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-orders"],
      });
    },
  });

  const handleCancel = (id) => {
    const ok = window.confirm("Are you sure you want to cancel this order?");

    if (!ok) return;

    cancelMutation.mutate(id);
  };

  // =====================================
  // Summary
  // =====================================

  const summary = useMemo(() => {
    return {
      totalOrders: orders.length,

      totalSpent: orders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      ),

      pendingOrders: orders.filter((order) => order.status === "pending")
        .length,

      deliveredOrders: orders.filter((order) => order.status === "delivered")
        .length,
    };
  }, [orders]);

  // =====================================
  // Loading
  // =====================================

  if (loading || isLoading) {
    return (
      <section className="max-w-7xl mx-auto py-10 px-4">
        <div className="space-y-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="border rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>

              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>

              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // =====================================
  // Error
  // =====================================

  if (isError) {
    return (
      <section className="max-w-3xl mx-auto py-20 px-5">
        <div className="bg-base-100 border rounded-2xl shadow text-center p-10">
          <FaExclamationTriangle className="mx-auto text-6xl text-error mb-5" />

          <h2 className="text-3xl font-bold mb-3">Failed to Load Orders</h2>

          <p className="text-gray-500 mb-8">
            {error?.response?.data?.message ||
              error?.message ||
              "Something went wrong."}
          </p>

          <button onClick={refetch} className="btn btn-primary">
            Retry
          </button>
        </div>
      </section>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ====================================================== */}
      {/* Dashboard Header */}
      {/* ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <h1 className="text-4xl font-bold">My Orders</h1>

          <p className="text-gray-500 mt-2">
            View, track and manage all your orders.
          </p>
        </div>

        <Link to="/products" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>

      {/* ====================================================== */}
      {/* Statistics Cards */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="card bg-base-100 border shadow-sm">
          <div className="card-body">
            <p className="text-gray-500">Total Orders</p>

            <h2 className="text-3xl font-bold">{summary.totalOrders}</h2>
          </div>
        </div>

        <div className="card bg-base-100 border shadow-sm">
          <div className="card-body">
            <p className="text-gray-500">Total Spent</p>

            <h2 className="text-3xl font-bold text-primary">
              ৳{summary.totalSpent.toFixed(2)}
            </h2>
          </div>
        </div>

        <div className="card bg-base-100 border shadow-sm">
          <div className="card-body">
            <p className="text-gray-500">Pending</p>

            <h2 className="text-3xl font-bold text-warning">
              {summary.pendingOrders}
            </h2>
          </div>
        </div>

        <div className="card bg-base-100 border shadow-sm">
          <div className="card-body">
            <p className="text-gray-500">Delivered</p>

            <h2 className="text-3xl font-bold text-success">
              {summary.deliveredOrders}
            </h2>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* Status Filter */}
      {/* ====================================================== */}

      <div className="bg-base-100 border rounded-xl p-5 mb-8">
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`btn btn-sm ${
                status === item ? "btn-primary" : "btn-outline"
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ====================================================== */}
      {/* Empty State */}
      {/* ====================================================== */}

      {orders.length === 0 ? (
        <div className="bg-base-100 border rounded-2xl py-20 px-6 text-center">
          <FaBoxOpen className="mx-auto text-7xl text-gray-300 mb-6" />

          <h2 className="text-3xl font-bold mb-3">No Orders Found</h2>

          <p className="text-gray-500 mb-8">
            You haven't placed any orders yet.
          </p>

          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {orders.map((order) => (
            <div
              key={order._id}
              className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl mb-8"
            >
              {/* ===================================== */}
              {/* Order Header */}
              {/* ===================================== */}

              <div className="card-body border-b border-base-300">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Order #{String(order._id).slice(-8).toUpperCase()}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Order Status */}

                  <div>
                    <span
                      className={`badge badge-lg capitalize ${
                        order.status === "pending"
                          ? "badge-warning"
                          : order.status === "processing"
                            ? "badge-info"
                            : order.status === "paid"
                              ? "badge-primary"
                              : order.status === "shipped"
                                ? "badge-secondary"
                                : order.status === "delivered"
                                  ? "badge-success"
                                  : "badge-error"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* ===================================== */}
              {/* Customer Information */}
              {/* ===================================== */}

              <div className="px-6 py-5 border-b border-base-300">
                <h3 className="font-bold text-lg mb-4">Customer Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Name</p>

                    <p className="font-semibold">{order.customer?.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase">Phone</p>

                    <p className="font-semibold">{order.customer?.phone}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase">Payment</p>

                    <p className="font-semibold capitalize">
                      {order.customer?.paymentMethod}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase">Address</p>

                    <p className="font-semibold">{order.customer?.address}</p>
                  </div>
                </div>
              </div>

              {/* ===================================== */}
              {/* Product List */}
              {/* ===================================== */}

              <div className="p-6">
                <h3 className="font-bold text-lg mb-5">Ordered Products</h3>

                <div className="space-y-5">
                  {order.items?.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-col md:flex-row gap-5 border rounded-xl p-4"
                    >
                      {/* Product Image */}

                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 rounded-lg object-cover border"
                      />

                      {/* Product Information */}

                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{item.name}</h4>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Price</p>

                            <p className="font-semibold">
                              ৳{Number(item.price).toFixed(2)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Discount</p>

                            <p className="font-semibold">{item.discount}%</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>

                            <p className="font-semibold">{item.quantity}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Subtotal</p>

                            <p className="font-bold text-primary">
                              ৳{Number(item.subtotal).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* ===================================== */}
                {/* Order Total + Actions */}
                {/* ===================================== */}

                <div className="mt-6 border-t border-base-300 pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    {/* Order Total */}

                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>

                      <h2 className="text-3xl font-bold text-primary mt-1">
                        ৳{Number(order.total || 0).toFixed(2)}
                      </h2>
                    </div>

                    {/* Action Buttons */}

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Invoice */}

                      <Link
                        to={`/dashboard/invoice/${order._id}`}
                        className="btn btn-success"
                      >
                        Invoice
                      </Link>

                      {/* Cancel */}

                      {order.status === "pending" && (
                        <button
                          onClick={() => handleCancel(order._id)}
                          className="btn btn-error"
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default MyOrders;
