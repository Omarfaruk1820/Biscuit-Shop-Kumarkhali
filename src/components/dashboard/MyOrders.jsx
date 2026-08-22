import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaShoppingBag,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";

// ============================================================
// API
// ============================================================

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

// ============================================================
// CONSTANTS
// ============================================================

const ORDERS_PER_PAGE = 5;

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "shipped",
    label: "Shipped",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest First",
  },
  {
    value: "oldest",
    label: "Oldest First",
  },
];

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "৳0.00";
  }

  return `৳${number.toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "pending":
      return "badge-warning";

    case "processing":
      return "badge-info";

    case "paid":
      return "badge-primary";

    case "shipped":
      return "badge-secondary";

    case "delivered":
      return "badge-success";

    case "cancelled":
      return "badge-error";

    default:
      return "badge-ghost";
  }
};

const getPaymentMethod = (order) => {
  return order?.customer?.paymentMethod || order?.paymentMethod || "N/A";
};

const getOrderId = (order) => {
  return order?._id ? String(order._id) : "";
};

const getProductKey = (item, index) => {
  return item?.productId || item?.sku || item?._id || `product-${index}`;
};

// ============================================================
// COMPONENT
// ============================================================

const MyOrders = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const queryClient = useQueryClient();

  // ==========================================================
  // STATE
  // ==========================================================

  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // ==========================================================
  // GET MY ORDERS
  // ==========================================================

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["my-orders", user?.email, page, status, sort],

    enabled: Boolean(user?.email) && !authLoading && Boolean(API_URL),

    queryFn: async () => {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(ORDERS_PER_PAGE));
      params.set("sort", sort);

      if (status !== "all") {
        params.set("status", status);
      }

      const response = await axios.get(
        `${API_URL}/orders/my?${params.toString()}`,
        {
          withCredentials: true,
        },
      );

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Failed to fetch your orders.",
        );
      }

      return response.data;
    },

    staleTime: 1000 * 30,

    gcTime: 1000 * 60 * 5,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  // ==========================================================
  // DATA
  // ==========================================================

  const orders = Array.isArray(data?.data) ? data.data : [];

  const pagination = data?.pagination || {};

  const totalOrders = Number(pagination.totalOrders || 0);

  const totalPages = Number(pagination.totalPages || 0);

  const currentPage = Number(pagination.page || page);

  const hasNextPage = Boolean(pagination.hasNextPage);

  const hasPrevPage = Boolean(pagination.hasPrevPage);

  // ==========================================================
  // CANCEL ORDER
  // ==========================================================

  const cancelMutation = useMutation({
    mutationFn: async (orderId) => {
      if (!orderId) {
        throw new Error("Order ID is missing.");
      }

      const response = await axios.patch(
        `${API_URL}/orders/cancel/${orderId}`,
        {},
        {
          withCredentials: true,
        },
      );

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to cancel order.");
      }

      return response.data;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["my-orders"],
      });
    },
  });

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const handlePreviousPage = () => {
    if (hasPrevPage) {
      setPage((previousPage) => previousPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage((previousPage) => previousPage + 1);
    }
  };

  const handleCancel = (orderId) => {
    if (!orderId || cancelMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) {
      return;
    }

    cancelMutation.mutate(orderId);
  };

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="space-y-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="border border-base-300 rounded-2xl p-6 animate-pulse"
            >
              <div className="h-6 bg-base-300 rounded w-48 mb-4" />

              <div className="h-4 bg-base-300 rounded w-full mb-3" />

              <div className="h-4 bg-base-300 rounded w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ==========================================================
  // NOT AUTHENTICATED
  // ==========================================================

  if (!user) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="bg-base-100 border border-base-300 rounded-2xl shadow-sm p-10 text-center">
          <FaExclamationTriangle className="mx-auto text-6xl text-warning mb-5" />

          <h2 className="text-3xl font-bold mb-3">Please Login</h2>

          <p className="text-gray-500 mb-8">
            You need to log in to view your orders.
          </p>

          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </section>
    );
  }

  // ==========================================================
  // API CONFIGURATION ERROR
  // ==========================================================

  if (!API_URL) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="bg-base-100 border border-error rounded-2xl p-10 text-center">
          <FaExclamationTriangle className="mx-auto text-6xl text-error mb-5" />

          <h2 className="text-3xl font-bold mb-3">API Configuration Error</h2>

          <p className="text-gray-500">VITE_API_URL is not configured.</p>
        </div>
      </section>
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="h-10 bg-base-300 rounded w-56 animate-pulse" />

          <div className="h-5 bg-base-300 rounded w-96 mt-3 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 bg-base-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>

        <div className="space-y-6">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="border border-base-300 rounded-2xl p-6 animate-pulse"
            >
              <div className="h-6 bg-base-300 rounded w-56 mb-5" />

              <div className="h-4 bg-base-300 rounded w-full mb-3" />

              <div className="h-4 bg-base-300 rounded w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (isError) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong while loading your orders.";

    return (
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="bg-base-100 border border-base-300 rounded-2xl shadow-sm p-10 text-center">
          <FaExclamationTriangle className="mx-auto text-6xl text-error mb-5" />

          <h2 className="text-3xl font-bold mb-3">Failed to Load Orders</h2>

          <p className="text-gray-500 mb-8">{errorMessage}</p>

          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <FaShoppingBag className="text-primary text-3xl" />

            <h1 className="text-4xl font-bold">My Orders</h1>
          </div>

          <p className="text-gray-500 mt-2">View and manage all your orders.</p>
        </div>

        <Link to="/products" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>

      {/* ====================================================== */}
      {/* SUMMARY */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-gray-500">Total Orders</p>

            <h2 className="text-3xl font-bold">{totalOrders}</h2>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-gray-500">Orders on This Page</p>

            <h2 className="text-3xl font-bold text-primary">{orders.length}</h2>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-gray-500">Current Page</p>

            <h2 className="text-3xl font-bold">
              {totalPages > 0 ? `${currentPage} / ${totalPages}` : "0"}
            </h2>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* FILTER + SORT */}
      {/* ====================================================== */}

      <div className="bg-base-100 border border-base-300 rounded-2xl p-5 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* STATUS */}

          <div>
            <p className="font-semibold mb-3">Filter by Status</p>

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleStatusChange(item.value)}
                  className={`btn btn-sm ${
                    status === item.value ? "btn-primary" : "btn-outline"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* SORT */}

          <div className="form-control">
            <label htmlFor="order-sort" className="label">
              <span className="label-text font-semibold">Sort Orders</span>
            </label>

            <select
              id="order-sort"
              value={sort}
              onChange={handleSortChange}
              className="select select-bordered"
            >
              {SORT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* FETCHING INDICATOR */}
      {/* ====================================================== */}

      {isFetching && !isLoading && (
        <div className="mb-5">
          <progress className="progress progress-primary w-full" />
        </div>
      )}

      {/* ====================================================== */}
      {/* EMPTY */}
      {/* ====================================================== */}

      {orders.length === 0 ? (
        <div className="bg-base-100 border border-base-300 rounded-2xl py-20 px-6 text-center">
          <FaBoxOpen className="mx-auto text-7xl text-gray-300 mb-6" />

          <h2 className="text-3xl font-bold mb-3">No Orders Found</h2>

          <p className="text-gray-500 mb-8">
            {status === "all"
              ? "You haven't placed any orders yet."
              : `You don't have any ${status} orders.`}
          </p>

          {status !== "all" ? (
            <button
              type="button"
              onClick={() => handleStatusChange("all")}
              className="btn btn-outline mr-3"
            >
              View All Orders
            </button>
          ) : null}

          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ================================================== */}
          {/* ORDERS */}
          {/* ================================================== */}

          {orders.map((order) => {
            const orderId = getOrderId(order);

            const items = Array.isArray(order.items) ? order.items : [];

            const orderStatus = String(order.status || "").toLowerCase();

            return (
              <article
                key={orderId}
                className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl overflow-hidden"
              >
                {/* ============================================== */}
                {/* ORDER HEADER */}
                {/* ============================================== */}

                <div className="card-body border-b border-base-300">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div>
                      <h2 className="text-xl font-bold">
                        Order #
                        {orderId ? orderId.slice(-8).toUpperCase() : "N/A"}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`badge badge-lg ${getStatusBadgeClass(
                        orderStatus,
                      )}`}
                    >
                      {formatStatus(orderStatus)}
                    </span>
                  </div>
                </div>

                {/* ============================================== */}
                {/* CUSTOMER INFORMATION */}
                {/* ============================================== */}

                <div className="px-6 py-6 border-b border-base-300">
                  <h3 className="text-lg font-bold mb-5">
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Name
                      </p>

                      <p className="font-semibold">
                        {order.customer?.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Phone
                      </p>

                      <p className="font-semibold">
                        {order.customer?.phone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Payment
                      </p>

                      <p className="font-semibold capitalize">
                        {String(getPaymentMethod(order)).replace(/_/g, " ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Address
                      </p>

                      <p className="font-semibold">
                        {order.customer?.address || "N/A"}
                      </p>
                    </div>

                    {order.customer?.city ? (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">
                          City
                        </p>

                        <p className="font-semibold">{order.customer.city}</p>
                      </div>
                    ) : null}

                    {order.customer?.zip ? (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">
                          ZIP
                        </p>

                        <p className="font-semibold">{order.customer.zip}</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* ============================================== */}
                {/* PRODUCTS */}
                {/* ============================================== */}

                <div className="p-6">
                  <h3 className="text-lg font-bold mb-5">Ordered Products</h3>

                  {items.length === 0 ? (
                    <div className="border border-dashed border-base-300 rounded-xl p-8 text-center">
                      <p className="text-gray-500">
                        Product details are not available for this order.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => {
                        const itemKey = getProductKey(item, index);

                        const price = Number(item?.price || 0);

                        const discount = Number(item?.discount || 0);

                        const quantity = Number(item?.quantity || 0);

                        const subtotal = Number(
                          item?.subtotal ?? item?.finalPrice * quantity ?? 0,
                        );

                        return (
                          <div
                            key={itemKey}
                            className="border border-base-300 rounded-xl p-4"
                          >
                            <div className="flex flex-col md:flex-row gap-5">
                              {/* IMAGE */}

                              <div className="shrink-0">
                                {item?.image ? (
                                  <img
                                    src={item.image}
                                    alt={item?.name || "Product"}
                                    className="w-24 h-24 rounded-xl object-cover border border-base-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-24 h-24 rounded-xl border border-base-300 bg-base-200 flex items-center justify-center">
                                    <FaBoxOpen className="text-3xl text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* PRODUCT INFO */}

                              <div className="flex-1">
                                <h4 className="text-lg font-bold">
                                  {item?.name || "Unknown Product"}
                                </h4>

                                {item?.sku ? (
                                  <p className="text-sm text-gray-500 mt-1">
                                    SKU: {item.sku}
                                  </p>
                                ) : null}

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Price
                                    </p>

                                    <p className="font-semibold">
                                      {formatCurrency(price)}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Discount
                                    </p>

                                    <p className="font-semibold">{discount}%</p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Quantity
                                    </p>

                                    <p className="font-semibold">{quantity}</p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Subtotal
                                    </p>

                                    <p className="font-bold text-primary">
                                      {formatCurrency(subtotal)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* TOTAL + ACTIONS */}
                  {/* ============================================ */}

                  <div className="mt-6 pt-6 border-t border-base-300">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>

                        <h2 className="text-3xl font-bold text-primary mt-1">
                          {formatCurrency(order.total)}
                        </h2>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {orderId ? (
                          <Link
                            to={`/dashboard/invoice/${orderId}`}
                            className="btn btn-success"
                          >
                            Invoice
                          </Link>
                        ) : null}

                        {orderStatus === "pending" ? (
                          <button
                            type="button"
                            onClick={() => handleCancel(orderId)}
                            className="btn btn-error"
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending
                              ? "Cancelling..."
                              : "Cancel Order"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* CANCEL ERROR */}

                    {cancelMutation.isError &&
                    cancelMutation.variables === orderId ? (
                      <div className="alert alert-error mt-5">
                        <FaExclamationTriangle />

                        <span>
                          {cancelMutation.error?.response?.data?.message ||
                            cancelMutation.error?.message ||
                            "Failed to cancel order."}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ====================================================== */}
      {/* PAGINATION */}
      {/* ====================================================== */}

      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10">
          <div className="text-sm text-gray-500">
            Page{" "}
            <span className="font-semibold text-base-content">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-base-content">
              {totalPages}
            </span>{" "}
            ·{" "}
            <span className="font-semibold text-base-content">
              {totalOrders}
            </span>{" "}
            total orders
          </div>

          <div className="join">
            <button
              type="button"
              className="join-item btn"
              onClick={handlePreviousPage}
              disabled={!hasPrevPage || isFetching}
              aria-label="Previous page"
            >
              <FaChevronLeft />
            </button>

            <button type="button" className="join-item btn btn-disabled">
              {currentPage}
            </button>

            <button
              type="button"
              className="join-item btn"
              onClick={handleNextPage}
              disabled={!hasNextPage || isFetching}
              aria-label="Next page"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyOrders;
