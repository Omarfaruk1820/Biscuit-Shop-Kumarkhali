import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaFileInvoice,
  FaShoppingBag,
  FaTruck,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { auth } from "../../Auth/firebase.config";

// ============================================================
// API
// ============================================================

const API_URL = String(import.meta.env.VITE_API_URL || "").trim();

const REQUEST_TIMEOUT = 15000;

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
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "processing",
    label: "Processing",
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

const TRACKABLE_STATUSES = ["confirmed", "processing", "shipped", "delivered"];

const CANCELLABLE_STATUS = "pending";

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "৳0.00";
  }

  return `৳${amount.toFixed(2)}`;
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

const formatStatus = (value) => {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatPaymentMethod = (value) => {
  if (!value) {
    return "N/A";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusBadgeClass = (status) => {
  switch (String(status).toLowerCase()) {
    case "pending":
      return "badge-warning";

    case "confirmed":
      return "badge-info";

    case "processing":
      return "badge-info";

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

const getPaymentStatusBadgeClass = (status) => {
  switch (String(status).toLowerCase()) {
    case "paid":
      return "badge-success";

    case "pending":
      return "badge-warning";

    case "unpaid":
      return "badge-warning";

    case "failed":
      return "badge-error";

    case "refunded":
      return "badge-info";

    default:
      return "badge-ghost";
  }
};

// ============================================================
// ORDER HELPERS
// ============================================================

const getOrderId = (order) => {
  if (!order?._id) {
    return "";
  }

  return String(order._id);
};

const getOrderNumber = (order) => {
  if (order?.orderNumber) {
    return String(order.orderNumber);
  }

  const orderId = getOrderId(order);

  if (!orderId) {
    return "N/A";
  }

  return `#${orderId.slice(-8).toUpperCase()}`;
};

const getOrderItems = (order) => {
  return Array.isArray(order?.items) ? order.items : [];
};

const getItemKey = (item, index) => {
  return (
    item?.productId ||
    item?.sku ||
    item?._id ||
    `${item?.name || "product"}-${index}`
  );
};

const getItemPrice = (item) => {
  const price = Number(item?.price);

  return Number.isFinite(price) && price >= 0 ? price : 0;
};

const getItemDiscount = (item) => {
  const discount = Number(item?.discount);

  if (!Number.isFinite(discount) || discount < 0) {
    return 0;
  }

  return discount;
};

const getItemQuantity = (item) => {
  const quantity = Number(item?.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  return quantity;
};

const getItemFinalPrice = (item) => {
  const finalPrice = Number(item?.finalPrice);

  if (Number.isFinite(finalPrice) && finalPrice >= 0) {
    return finalPrice;
  }

  const price = getItemPrice(item);
  const discount = getItemDiscount(item);

  if (discount > 0) {
    return price - price * (discount / 100);
  }

  return price;
};

const getItemSubtotal = (item) => {
  const subtotal = Number(item?.subtotal);

  if (Number.isFinite(subtotal)) {
    return subtotal;
  }

  const quantity = getItemQuantity(item);

  return getItemFinalPrice(item) * quantity;
};

const getOrderQuantity = (order) => {
  const totalQuantity = Number(order?.totalQuantity);

  if (Number.isFinite(totalQuantity) && totalQuantity >= 0) {
    return totalQuantity;
  }

  return getOrderItems(order).reduce((total, item) => {
    return total + getItemQuantity(item);
  }, 0);
};

const getOrderItemCount = (order) => {
  const totalItems = Number(order?.totalItems);

  if (Number.isFinite(totalItems) && totalItems >= 0) {
    return totalItems;
  }

  return getOrderItems(order).length;
};

const getOrderSubtotal = (order) => {
  const subtotal = Number(order?.subtotal);

  return Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : 0;
};

const getOrderDiscount = (order) => {
  const discount = Number(order?.totalDiscount);

  return Number.isFinite(discount) && discount >= 0 ? discount : 0;
};

const getOrderShipping = (order) => {
  const shipping = Number(order?.shipping);

  return Number.isFinite(shipping) && shipping >= 0 ? shipping : 0;
};

const getOrderTax = (order) => {
  const tax = Number(order?.tax);

  return Number.isFinite(tax) && tax >= 0 ? tax : 0;
};

const getOrderGrandTotal = (order) => {
  const grandTotal = Number(order?.grandTotal);

  if (Number.isFinite(grandTotal)) {
    return grandTotal;
  }

  // Legacy fallback only.
  const subtotal = getOrderSubtotal(order);
  const shipping = getOrderShipping(order);
  const tax = getOrderTax(order);

  return subtotal + shipping + tax;
};

// ============================================================
// FIREBASE AUTH TOKEN
// ============================================================

const getFirebaseIdToken = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You are not authenticated.");
  }

  return currentUser.getIdToken();
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
  // FETCH MY ORDERS
  // ==========================================================

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["my-orders", user?.email || "", page, status, sort],

    enabled: Boolean(user?.email) && !authLoading && Boolean(API_URL),

    queryFn: async () => {
      const idToken = await getFirebaseIdToken();

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
          headers: {
            Authorization: `Bearer ${idToken}`,
          },

          withCredentials: true,

          timeout: REQUEST_TIMEOUT,
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
  // SERVER DATA
  // ==========================================================

  const orders = Array.isArray(data?.data) ? data.data : [];

  const pagination =
    data?.pagination && typeof data.pagination === "object"
      ? data.pagination
      : {};

  // ==========================================================
  // PAGINATION DATA
  // ==========================================================

  const totalOrders = Number(pagination.totalOrders ?? 0);

  const filteredOrders = Number(pagination.filteredOrders ?? orders.length);

  const calculatedTotalPages =
    filteredOrders > 0 ? Math.ceil(filteredOrders / ORDERS_PER_PAGE) : 0;

  const totalPages = Number(pagination.totalPages ?? calculatedTotalPages);

  const currentPage = Number(pagination.page ?? page);

  const hasNextPage =
    typeof pagination.hasNextPage === "boolean"
      ? pagination.hasNextPage
      : currentPage < totalPages;

  const hasPrevPage =
    typeof pagination.hasPrevPage === "boolean"
      ? pagination.hasPrevPage
      : currentPage > 1;

  // ==========================================================
  // PAGE SUMMARY
  // ==========================================================

  const pageSummary = useMemo(() => {
    return orders.reduce(
      (summary, order) => {
        summary.totalQuantity += getOrderQuantity(order);

        summary.totalValue += getOrderGrandTotal(order);

        return summary;
      },
      {
        totalQuantity: 0,
        totalValue: 0,
      },
    );
  }, [orders]);

  // ==========================================================
  // CANCEL ORDER
  // ==========================================================

  const cancelMutation = useMutation({
    mutationFn: async (orderId) => {
      if (!orderId) {
        throw new Error("Order ID is missing.");
      }

      const idToken = await getFirebaseIdToken();

      const response = await axios.patch(
        `${API_URL}/orders/cancel/${encodeURIComponent(orderId)}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },

          withCredentials: true,

          timeout: REQUEST_TIMEOUT,
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
    if (!hasPrevPage || isFetching) {
      return;
    }

    setPage((previousPage) => Math.max(previousPage - 1, 1));
  };

  const handleNextPage = () => {
    if (!hasNextPage || isFetching) {
      return;
    }

    setPage((previousPage) => previousPage + 1);
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
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="space-y-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-base-300 p-6"
            >
              <div className="mb-4 h-6 w-48 rounded bg-base-300" />

              <div className="mb-3 h-4 w-full rounded bg-base-300" />

              <div className="h-4 w-2/3 rounded bg-base-300" />
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
      <section className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center shadow-sm">
          <FaExclamationTriangle className="mx-auto mb-5 text-6xl text-warning" />

          <h2 className="mb-3 text-3xl font-bold">Please Login</h2>

          <p className="mb-8 text-gray-500">
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
      <section className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-2xl border border-error bg-base-100 p-10 text-center">
          <FaExclamationTriangle className="mx-auto mb-5 text-6xl text-error" />

          <h2 className="mb-3 text-3xl font-bold">API Configuration Error</h2>

          <p className="text-gray-500">VITE_API_URL is not configured.</p>
        </div>
      </section>
    );
  }

  // ==========================================================
  // ORDERS LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <div className="h-10 w-56 animate-pulse rounded bg-base-300" />

          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-base-300" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-base-200"
            />
          ))}
        </div>

        <div className="space-y-6">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-base-300 p-6"
            >
              <div className="mb-5 h-6 w-56 rounded bg-base-300" />

              <div className="mb-3 h-4 w-full rounded bg-base-300" />

              <div className="h-4 w-3/4 rounded bg-base-300" />
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
      <section className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center shadow-sm">
          <FaExclamationTriangle className="mx-auto mb-5 text-6xl text-error" />

          <h2 className="mb-3 text-3xl font-bold">Failed to Load Orders</h2>

          <p className="mb-8 text-gray-500">{errorMessage}</p>

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
  // MAIN
  // ==========================================================

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FaShoppingBag className="text-3xl text-primary" />

            <h1 className="text-4xl font-bold">My Orders</h1>
          </div>

          <p className="mt-2 text-gray-500">View and manage all your orders.</p>
        </div>

        <Link to="/products" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-gray-500">Total Orders</p>

            <h2 className="text-3xl font-bold">{totalOrders}</h2>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-gray-500">Matching Orders</p>

            <h2 className="text-3xl font-bold text-primary">
              {filteredOrders}
            </h2>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-gray-500">Items on This Page</p>

            <h2 className="text-3xl font-bold">{pageSummary.totalQuantity}</h2>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-gray-500">Page Value</p>

            <h2 className="text-3xl font-bold text-primary">
              {formatCurrency(pageSummary.totalValue)}
            </h2>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTER + SORT
      ====================================================== */}

      <div className="mb-8 rounded-2xl border border-base-300 bg-base-100 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 font-semibold">Filter by Status</p>

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

      {/* ======================================================
          BACKGROUND FETCHING
      ====================================================== */}

      {isFetching && !isLoading && (
        <div className="mb-5">
          <progress className="progress progress-primary w-full" />
        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 px-6 py-20 text-center">
          <FaBoxOpen className="mx-auto mb-6 text-7xl text-gray-300" />

          <h2 className="mb-3 text-3xl font-bold">No Orders Found</h2>

          <p className="mb-8 text-gray-500">
            {status === "all"
              ? "You haven't placed any orders yet."
              : `You don't have any ${formatStatus(status)} orders.`}
          </p>

          {status !== "all" && (
            <button
              type="button"
              onClick={() => handleStatusChange("all")}
              className="btn btn-outline mr-3"
            >
              View All Orders
            </button>
          )}

          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const orderId = getOrderId(order);
            const orderNumber = getOrderNumber(order);

            const items = getOrderItems(order);

            const orderStatus = String(
              order?.status || "unknown",
            ).toLowerCase();

            const paymentStatus = String(
              order?.paymentStatus || "pending",
            ).toLowerCase();

            const paymentMethod =
              order?.paymentMethod || order?.customer?.paymentMethod || "";

            const grandTotal = getOrderGrandTotal(order);

            const canTrack = TRACKABLE_STATUSES.includes(orderStatus);

            const canCancel = orderStatus === CANCELLABLE_STATUS;

            const isCancelling =
              cancelMutation.isPending &&
              String(cancelMutation.variables || "") === orderId;

            const cancelError =
              cancelMutation.isError &&
              String(cancelMutation.variables || "") === orderId;

            return (
              <article
                key={orderId || orderNumber}
                className="card overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
              >
                {/* ==================================================
                    ORDER HEADER
                ================================================== */}

                <div className="card-body border-b border-base-300">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="mb-1 text-sm text-gray-500">Order Number</p>

                      <h2 className="break-all text-xl font-bold">
                        {orderNumber}
                      </h2>

                      <p className="mt-2 text-sm text-gray-500">
                        Placed on {formatDate(order?.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`badge badge-lg ${getStatusBadgeClass(
                          orderStatus,
                        )}`}
                      >
                        {formatStatus(orderStatus)}
                      </span>

                      <span
                        className={`badge badge-lg ${getPaymentStatusBadgeClass(
                          paymentStatus,
                        )}`}
                      >
                        Payment: {formatStatus(paymentStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ==================================================
                    TRACKING
                ================================================== */}

                {canTrack && orderId && (
                  <div className="border-b border-base-300 bg-base-200/40 px-6 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <FaTruck className="text-2xl text-primary" />

                          <h3 className="text-lg font-bold">Order Tracking</h3>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                          Current status:{" "}
                          <span className="font-semibold text-base-content">
                            {formatStatus(orderStatus)}
                          </span>
                        </p>
                      </div>

                      <Link
                        to={`/dashboard/orders/${encodeURIComponent(
                          orderId,
                        )}/track`}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <FaTruck />
                        Track Order
                      </Link>
                    </div>
                  </div>
                )}

                {/* ==================================================
                    CUSTOMER INFORMATION
                ================================================== */}

                <div className="border-b border-base-300 px-6 py-6">
                  <h3 className="mb-5 text-lg font-bold">
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="mb-1 text-xs uppercase text-gray-500">
                        Name
                      </p>

                      <p className="font-semibold">
                        {order?.customer?.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs uppercase text-gray-500">
                        Phone
                      </p>

                      <p className="font-semibold">
                        {order?.customer?.phone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs uppercase text-gray-500">
                        Payment Method
                      </p>

                      <p className="font-semibold">
                        {formatPaymentMethod(paymentMethod)}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs uppercase text-gray-500">
                        Address
                      </p>

                      <p className="font-semibold">
                        {order?.customer?.address || "N/A"}
                      </p>
                    </div>

                    {order?.customer?.city && (
                      <div>
                        <p className="mb-1 text-xs uppercase text-gray-500">
                          City
                        </p>

                        <p className="font-semibold">{order.customer.city}</p>
                      </div>
                    )}

                    {order?.customer?.zip && (
                      <div>
                        <p className="mb-1 text-xs uppercase text-gray-500">
                          ZIP
                        </p>

                        <p className="font-semibold">{order.customer.zip}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ==================================================
                    ORDER SUMMARY
                ================================================== */}

                <div className="border-b border-base-300 px-6 py-6">
                  <h3 className="mb-5 text-lg font-bold">Order Summary</h3>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <div>
                      <p className="text-xs text-gray-500">Products</p>

                      <p className="font-semibold">
                        {getOrderItemCount(order)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>

                      <p className="font-semibold">{getOrderQuantity(order)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Subtotal</p>

                      <p className="font-semibold">
                        {formatCurrency(getOrderSubtotal(order))}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Discount</p>

                      <p className="font-semibold text-success">
                        -{formatCurrency(getOrderDiscount(order))}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Shipping</p>

                      <p className="font-semibold">
                        {formatCurrency(getOrderShipping(order))}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Tax</p>

                      <p className="font-semibold">
                        {formatCurrency(getOrderTax(order))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ==================================================
                    PRODUCTS
                ================================================== */}

                <div className="p-6">
                  <h3 className="mb-5 text-lg font-bold">Ordered Products</h3>

                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-base-300 p-8 text-center">
                      <p className="text-gray-500">
                        Product details are not available for this order.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => {
                        const itemKey = getItemKey(item, index);

                        const price = getItemPrice(item);

                        const discount = getItemDiscount(item);

                        const quantity = getItemQuantity(item);

                        const finalPrice = getItemFinalPrice(item);

                        const subtotal = getItemSubtotal(item);

                        return (
                          <div
                            key={itemKey}
                            className="rounded-xl border border-base-300 p-4"
                          >
                            <div className="flex flex-col gap-5 md:flex-row">
                              {/* IMAGE */}

                              <div className="shrink-0">
                                {item?.image ? (
                                  <img
                                    src={item.image}
                                    alt={item?.name || "Product"}
                                    className="h-24 w-24 rounded-xl border border-base-300 object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-base-300 bg-base-200">
                                    <FaBoxOpen className="text-3xl text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* PRODUCT INFO */}

                              <div className="flex-1">
                                <h4 className="text-lg font-bold">
                                  {item?.name || "Unknown Product"}
                                </h4>

                                {item?.sku && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    SKU: {item.sku}
                                  </p>
                                )}

                                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
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
                                      Final Price
                                    </p>

                                    <p className="font-semibold">
                                      {formatCurrency(finalPrice)}
                                    </p>
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

                  {/* ==================================================
                      GRAND TOTAL + ACTIONS
                  ================================================== */}

                  <div className="mt-6 border-t border-base-300 pt-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      {/* TOTAL */}

                      <div>
                        <p className="text-sm text-gray-500">Grand Total</p>

                        <h2 className="mt-1 text-3xl font-bold text-primary">
                          {formatCurrency(grandTotal)}
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                          Including shipping and tax
                        </p>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {/* TRACK */}

                        {orderId && canTrack && (
                          <Link
                            to={`/dashboard/orders/${encodeURIComponent(
                              orderId,
                            )}/track`}
                            className="btn btn-primary gap-2"
                          >
                            <FaTruck />

                            <span>Track Order</span>
                          </Link>
                        )}

                        {/* INVOICE */}

                        {orderId && (
                          <Link
                            to={`/dashboard/invoice/${encodeURIComponent(
                              orderId,
                            )}`}
                            className="btn btn-success gap-2"
                          >
                            <FaFileInvoice />

                            <span>Invoice</span>
                          </Link>
                        )}

                        {/* CANCEL */}

                        {canCancel && orderId && (
                          <button
                            type="button"
                            onClick={() => handleCancel(orderId)}
                            className="btn btn-error"
                            disabled={cancelMutation.isPending}
                          >
                            {isCancelling ? "Cancelling..." : "Cancel Order"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CANCEL ERROR */}

                    {cancelError && (
                      <div className="alert alert-error mt-5">
                        <FaExclamationTriangle />

                        <span>
                          {cancelMutation.error?.response?.data?.message ||
                            cancelMutation.error?.message ||
                            "Failed to cancel order."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {totalPages > 0 && (
        <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
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

            <button
              type="button"
              className="join-item btn btn-disabled"
              aria-label={`Current page ${currentPage}`}
            >
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
