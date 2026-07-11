import { useContext, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaBoxOpen,
  FaFileInvoice,
  FaTimesCircle,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

import { Link } from "react-router";


import { AuthContext } from "../../Auth/AuthProvider";

const API = import.meta.env.VITE_API_URL;

const STATUS_OPTIONS = [
  "all",
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",

  paid: "bg-blue-100 text-blue-700 border border-blue-300",

  processing: "bg-indigo-100 text-indigo-700 border border-indigo-300",

  shipped: "bg-purple-100 text-purple-700 border border-purple-300",

  delivered: "bg-green-100 text-green-700 border border-green-300",

  cancelled: "bg-red-100 text-red-700 border border-red-300",
};

const MyOrders = () => {
  const { user, loading } = useContext(AuthContext);

  const queryClient = useQueryClient();

  const [status, setStatus] = useState("all");

  /**
   * ----------------------------------------
   * Get My Orders
   * ----------------------------------------
   */

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-orders", user?.email, status],

    enabled: !!user?.email && !loading,

    queryFn: async () => {
      const res = await axios.get(`${API}/orders/my?status=${status}`, {
        withCredentials: true,
      });

      return res.data;
    },
  });

  const orders = data?.data || [];

  /**
   * ----------------------------------------
   * Cancel Order
   * ----------------------------------------
   */

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

  /**
   * ----------------------------------------
   * Invoice
   * ----------------------------------------
   */

  const handleInvoice = async (id) => {
    try {
      const res = await axios.get(`${API}/orders/invoice/${id}`, {
        withCredentials: true,
      });

      console.log("Invoice :", res.data);

      alert("Invoice fetched successfully.");
    } catch (err) {
      console.error(err);

      alert("Failed to load invoice.");
    }
  };

  /**
   * ----------------------------------------
   * Cancel
   * ----------------------------------------
   */

  const handleCancel = (id) => {
    const ok = window.confirm("Are you sure you want to cancel this order?");

    if (!ok) return;

    cancelMutation.mutate(id);
  };

  /**
   * ----------------------------------------
   * Summary
   * ----------------------------------------
   */

  const summary = useMemo(() => {
    return {
      totalOrders: orders.length,

      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

  /**
   * ----------------------------------------
   * Loading
   * ----------------------------------------
   */

  if (isLoading || loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="space-y-6">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border bg-white p-6 animate-pulse"
            >
              <div className="h-6 w-52 rounded bg-gray-200 mb-4"></div>

              <div className="h-4 w-full rounded bg-gray-200 mb-2"></div>

              <div className="h-4 w-3/4 rounded bg-gray-200 mb-2"></div>

              <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /**
   * ----------------------------------------
   * Error
   * ----------------------------------------
   */

  if (isError) {
    return (
      <section className="flex justify-center items-center min-h-[60vh] px-5">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border p-8 text-center">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />

          <h2 className="text-2xl font-bold mb-2">Failed to Load Orders</h2>

          <p className="text-gray-500 mb-6">
            {error?.message || "Something went wrong."}
          </p>

          <button onClick={refetch} className="btn btn-primary">
            Retry
          </button>
        </div>
      </section>
    );
  }

  // ============================
  // Part 2 Starts Here...
  // ============================

  return (
    <div>
      {/* Part 2 */}

      <>
        {/* ==========================================================
      Page Header
  ========================================================== */}

        <section className="bg-gradient-to-r from-primary/10 via-base-100 to-primary/5 rounded-3xl border border-base-300 p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold">My Orders</h1>

              <p className="text-base-content/70 mt-2">
                Track your purchases, download invoices and manage your orders.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/products" className="btn btn-outline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>

        {/* ==========================================================
      Summary Cards
  ========================================================== */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {/* Total Orders */}

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Total Orders</p>

                <h2 className="text-3xl font-bold mt-2">
                  {summary.totalOrders}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <FaBoxOpen className="text-primary text-2xl" />
              </div>
            </div>
          </div>

          {/* Total Spent */}

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Total Spent</p>

                <h2 className="text-3xl font-bold mt-2">
                  ${summary.totalSpent.toFixed(2)}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-success text-2xl font-bold">$</span>
              </div>
            </div>
          </div>

          {/* Pending */}

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Pending</p>

                <h2 className="text-3xl font-bold mt-2">
                  {orders.filter((item) => item.status === "pending").length}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center">
                <FaSpinner className="text-warning text-2xl" />
              </div>
            </div>
          </div>

          {/* Delivered */}

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Delivered</p>

                <h2 className="text-3xl font-bold">
                  {orders.filter((item) => item.status === "delivered").length}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                ✓
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
      Filter Tabs
  ========================================================== */}

        <section className="bg-base-100 rounded-2xl border border-base-300 p-5 mb-8">
          <div className="flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={`btn btn-sm md:btn-md transition-all ${
                  status === item ? "btn-primary" : "btn-outline"
                }`}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* ==========================================================
      Empty State
  ========================================================== */}

        {orders.length === 0 ? (
          <section className="bg-base-100 rounded-3xl border border-base-300 py-20 px-8 text-center">
            <FaBoxOpen className="mx-auto text-7xl text-base-300 mb-6" />

            <h2 className="text-3xl font-bold mb-3">No Orders Found</h2>

            <p className="text-base-content/60 mb-8">
              You haven't placed any orders yet.
            </p>

            <Link to="/shop" className="btn btn-primary">
              Start Shopping
            </Link>
          </section>
        ) : (
          <>
            {/* ==============================
          Part 3 Starts Here
      ============================== */}
            <section className="space-y-8">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-base-100 border border-base-300 rounded-3xl shadow-sm overflow-hidden"
                >
                  {/* =======================================================
          Order Header
      ======================================================= */}

                  <div className="bg-base-200 px-6 py-5">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                      {/* Left */}

                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <FaBoxOpen className="text-primary" />
                          Order #
                          <span className="font-mono text-primary">
                            {order._id.slice(-8).toUpperCase()}
                          </span>
                        </h2>

                        <p className="text-sm text-base-content/60 mt-2">
                          Ordered on{" "}
                          <span className="font-semibold">
                            {moment(order.createdAt).format(
                              "DD MMM YYYY • hh:mm A",
                            )}
                          </span>
                        </p>
                      </div>

                      {/* Status */}

                      <span
                        className={`badge badge-lg px-5 py-4 capitalize font-semibold ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* =======================================================
          Customer Information
      ======================================================= */}

                  <div className="px-6 py-6 border-b border-base-300">
                    <h3 className="font-bold text-lg mb-5">
                      Customer Information
                    </h3>

                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-base-content/50">
                          Full Name
                        </p>

                        <h4 className="font-semibold mt-1">
                          {order.customer?.name}
                        </h4>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-base-content/50">
                          Phone
                        </p>

                        <h4 className="font-semibold mt-1">
                          {order.customer?.phone}
                        </h4>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-base-content/50">
                          Delivery Address
                        </p>

                        <h4 className="font-semibold mt-1">
                          {order.customer?.address}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* =======================================================
          Products
      ======================================================= */}

                  <div className="px-6 py-6">
                    <h3 className="font-bold text-lg mb-6">Ordered Products</h3>

                    <div className="space-y-5">
                      {order.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex flex-col md:flex-row md:items-center gap-5 border border-base-300 rounded-2xl p-5 hover:shadow-md transition-all"
                        >
                          {/* Product Image */}

                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-28 h-28 rounded-xl object-cover border mx-auto md:mx-0"
                          />

                          {/* Product Info */}

                          <div className="flex-1">
                            <h4 className="text-lg font-bold">{item.name}</h4>

                            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-base-content/50 uppercase">
                                  Price
                                </p>

                                <p className="font-semibold">${item.price}</p>
                              </div>

                              <div>
                                <p className="text-xs text-base-content/50 uppercase">
                                  Discount
                                </p>

                                <p className="font-semibold">
                                  {item.discount}%
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-base-content/50 uppercase">
                                  Quantity
                                </p>

                                <p className="font-semibold">{item.quantity}</p>
                              </div>

                              <div>
                                <p className="text-xs text-base-content/50 uppercase">
                                  Subtotal
                                </p>

                                <p className="font-bold text-primary">
                                  ${item.subtotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ===========================================
          Part 3B Starts Here
      =========================================== */}
                </div>
              ))}
            </section>
          </>
        )}
      </>
    </div>
  );
};

export default MyOrders;
