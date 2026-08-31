import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiBox,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiTruck,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

import { toast } from "react-hot-toast";

import { AuthContext } from "../Auth/AuthProvider";
import axiosSecure from "../hooks/axiosSecure";

/* ============================================================
   ORDER STATUS
============================================================ */

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_LABELS = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_DESCRIPTIONS = {
  pending: "Your order has been received and is waiting for confirmation.",
  confirmed: "Your order has been confirmed and will be prepared soon.",
  processing: "Your order is being prepared for shipment.",
  shipped: "Your order has been shipped and is on its way.",
  delivered: "Your order has been delivered successfully.",
  cancelled: "This order has been cancelled.",
};

const STATUS_ICONS = {
  pending: FiClock,
  confirmed: FiCheckCircle,
  processing: FiPackage,
  shipped: FiTruck,
  delivered: FiCheckCircle,
  cancelled: FiXCircle,
};

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const roundMoney = (value) => {
  return Number(toNumber(value).toFixed(2));
};

const formatCurrency = (value) => {
  return `৳${toNumber(value).toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
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

const formatPaymentMethod = (method) => {
  if (!method) {
    return "N/A";
  }

  const normalizedMethod = String(method).toLowerCase();

  if (normalizedMethod === "cod" || normalizedMethod === "cash_on_delivery") {
    return "Cash on Delivery";
  }

  return String(method)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatPaymentStatus = (status) => {
  if (!status) {
    return "Pending";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getStatusClasses = (status) => {
  const classes = {
    pending: {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      icon: "bg-amber-100 text-amber-600",
    },

    confirmed: {
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      icon: "bg-blue-100 text-blue-600",
    },

    processing: {
      badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
      icon: "bg-indigo-100 text-indigo-600",
    },

    shipped: {
      badge: "border-purple-200 bg-purple-50 text-purple-700",
      icon: "bg-purple-100 text-purple-600",
    },

    delivered: {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: "bg-emerald-100 text-emerald-600",
    },

    cancelled: {
      badge: "border-red-200 bg-red-50 text-red-700",
      icon: "bg-red-100 text-red-600",
    },
  };

  return (
    classes[status] || {
      badge: "border-gray-200 bg-gray-50 text-gray-700",
      icon: "bg-gray-100 text-gray-600",
    }
  );
};

const getAxiosErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

/* ============================================================
   ORDER FINANCIAL SUMMARY
============================================================ */

const getOrderFinancialSummary = (order) => {
  if (!order) {
    return {
      subtotal: 0,
      totalDiscount: 0,
      shipping: 0,
      tax: 0,
      grandTotal: 0,
    };
  }

  const itemsSubtotal = Array.isArray(order.items)
    ? order.items.reduce((total, item) => {
        const itemSubtotal = Number(item?.subtotal);

        if (Number.isFinite(itemSubtotal)) {
          return total + itemSubtotal;
        }

        const quantity = Math.max(toNumber(item?.quantity), 0);

        const finalPrice = Number(item?.finalPrice);

        if (Number.isFinite(finalPrice)) {
          return total + finalPrice * quantity;
        }

        const price = Number(item?.price);

        if (Number.isFinite(price)) {
          return total + price * quantity;
        }

        return total;
      }, 0)
    : 0;

  /*
    Prefer backend values.

    Your backend response contains:
    subtotal
    totalDiscount
    shipping
    tax
    grandTotal
  */

  const subtotal = Number.isFinite(Number(order.subtotal))
    ? Number(order.subtotal)
    : itemsSubtotal;

  const totalDiscount = Number.isFinite(Number(order.totalDiscount))
    ? Number(order.totalDiscount)
    : Number.isFinite(Number(order.discount))
      ? Number(order.discount)
      : 0;

  const shipping = Number.isFinite(Number(order.shipping))
    ? Number(order.shipping)
    : Number.isFinite(Number(order.shippingCost))
      ? Number(order.shippingCost)
      : 0;

  const tax = Number.isFinite(Number(order.tax))
    ? Number(order.tax)
    : Number.isFinite(Number(order.taxAmount))
      ? Number(order.taxAmount)
      : 0;

  const backendGrandTotal = [order.grandTotal, order.total, order.orderTotal]
    .map(Number)
    .find((value) => Number.isFinite(value));

  const calculatedGrandTotal = subtotal - totalDiscount + shipping + tax;

  const grandTotal = Number.isFinite(backendGrandTotal)
    ? backendGrandTotal
    : calculatedGrandTotal;

  return {
    subtotal: roundMoney(subtotal),
    totalDiscount: roundMoney(Math.max(totalDiscount, 0)),
    shipping: roundMoney(Math.max(shipping, 0)),
    tax: roundMoney(Math.max(tax, 0)),
    grandTotal: roundMoney(Math.max(grandTotal, 0)),
  };
};

/* ============================================================
   COMPONENT
============================================================ */

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user, loading: authLoading } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ============================================================
     ORDER ID
  ============================================================ */

  const orderId = useMemo(() => {
    return decodeURIComponent(id || "").trim();
  }, [id]);

  /* ============================================================
     FETCH ORDER
  ============================================================ */

  const fetchOrder = useCallback(
    async (showRefreshState = false) => {
      if (!orderId || !user) {
        return;
      }

      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await axiosSecure.get(
          `/orders/my/${encodeURIComponent(orderId)}`,
        );

        const responseData = response?.data;

        if (!responseData?.success || !responseData?.data) {
          throw new Error(
            responseData?.message || "Unable to load order information.",
          );
        }

        setOrder(responseData.data);
      } catch (error) {
        console.error("OrderTracking fetch error:", error);

        const statusCode = error?.response?.status;

        if (statusCode === 401 || statusCode === 403) {
          setOrder(null);
          toast.error("Please login to view your order.");
          return;
        }

        if (statusCode === 404) {
          setOrder(null);
          toast.error("Order not found.");
          return;
        }

        toast.error(
          getAxiosErrorMessage(error, "Failed to load order information."),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId, user],
  );

  /* ============================================================
     LOAD ORDER
  ============================================================ */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/login", {
        replace: true,
        state: {
          from: `/dashboard/orders/${encodeURIComponent(orderId)}/track`,
        },
      });

      return;
    }

    if (!orderId) {
      setLoading(false);
      return;
    }

    fetchOrder();
  }, [authLoading, user, orderId, navigate, fetchOrder]);

  /* ============================================================
     CURRENT STATUS
  ============================================================ */

  const currentStatus = order?.status || "pending";

  const isCancelled = currentStatus === "cancelled";
  const isDelivered = currentStatus === "delivered";

  const statusClasses = getStatusClasses(currentStatus);

  const StatusIcon = STATUS_ICONS[currentStatus] || FiPackage;

  /* ============================================================
     FINANCIAL SUMMARY
  ============================================================ */

  const financialSummary = useMemo(() => {
    return getOrderFinancialSummary(order);
  }, [order]);

  const { subtotal, totalDiscount, shipping, tax, grandTotal } =
    financialSummary;

  /* ============================================================
     TOTAL QUANTITY
  ============================================================ */

  const totalQuantity = useMemo(() => {
    if (Number(order?.totalQuantity) > 0) {
      return Number(order.totalQuantity);
    }

    if (!Array.isArray(order?.items)) {
      return 0;
    }

    return order.items.reduce((total, item) => {
      return total + Math.max(toNumber(item?.quantity), 0);
    }, 0);
  }, [order]);

  /* ============================================================
     TRACKING STEPS
  ============================================================ */

  const trackingSteps = useMemo(() => {
    if (
      Array.isArray(order?.tracking?.steps) &&
      order.tracking.steps.length > 0
    ) {
      return order.tracking.steps;
    }

    const currentIndex = ORDER_STATUSES.indexOf(currentStatus);

    return ORDER_STATUSES.map((status, index) => ({
      status,
      label: STATUS_LABELS[status],
      completed: !isCancelled && currentIndex >= index,
      current: !isCancelled && currentStatus === status,
    }));
  }, [order, currentStatus, isCancelled]);

  /* ============================================================
     TIMELINE
  ============================================================ */

  const timeline = useMemo(() => {
    if (!Array.isArray(order?.tracking?.timeline)) {
      return [];
    }

    return [...order.tracking.timeline].reverse();
  }, [order]);

  /* ============================================================
     LOADING
  ============================================================ */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-3 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl animate-pulse">
          <div className="mb-6">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-56 rounded-lg bg-gray-200" />
            <div className="mt-2 h-4 w-72 max-w-full rounded bg-gray-100" />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-200" />

                <div>
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="mt-3 h-6 w-48 rounded bg-gray-200" />
                  <div className="mt-3 h-6 w-28 rounded-full bg-gray-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="h-20 rounded-xl bg-gray-100" />
                <div className="h-20 rounded-xl bg-gray-100" />
                <div className="h-20 rounded-xl bg-gray-100" />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
              <div className="h-6 w-44 rounded bg-gray-200" />

              <div className="mt-7 space-y-8">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />

                    <div className="flex-1">
                      <div className="h-4 w-32 rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-56 max-w-full rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="h-64 rounded-2xl bg-white shadow-sm" />
              <div className="h-40 rounded-2xl bg-white shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     INVALID ORDER ID
  ============================================================ */

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FiXCircle className="text-3xl" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Invalid Order ID
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            The order ID provided is missing or invalid.
          </p>

          <Link
            to="/dashboard/my-orders"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 sm:w-auto"
          >
            <FiArrowLeft />
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  /* ============================================================
     ORDER NOT FOUND
  ============================================================ */

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FiBox className="text-3xl" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Order Not Found
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            We could not find an order matching this order ID.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard/my-orders"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <FiArrowLeft />
              My Orders
            </Link>

            <button
              type="button"
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />

              {refreshing ? "Trying..." : "Try Again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
              <FiArrowLeft />
              Back
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Track Your Order
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Follow the latest status of your order.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ======================================================
            ORDER HEADER
        ====================================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${statusClasses.icon}`}
                >
                  <StatusIcon className="text-xl" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Order Number
                  </p>

                  <h2 className="mt-1 break-all text-lg font-bold text-gray-900 sm:text-xl">
                    {order.orderNumber || orderId}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses.badge}`}
                    >
                      {STATUS_LABELS[currentStatus] || currentStatus}
                    </span>

                    {isDelivered && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <FiCheckCircle />
                        Completed
                      </span>
                    )}

                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        <FiXCircle />
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[430px]">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <FiCalendar className="text-sm" />
                    <span className="text-xs font-medium">Ordered</span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <FiPackage className="text-sm" />
                    <span className="text-xs font-medium">Items</span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {totalQuantity}
                  </p>
                </div>

                <div className="col-span-2 rounded-xl bg-gray-50 p-3 sm:col-span-1">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-xs font-medium">Total</span>
                  </div>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(grandTotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CURRENT STATUS */}

          <div className="p-4 sm:p-6">
            <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${statusClasses.icon}`}
                >
                  <StatusIcon />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Current Status
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-gray-900">
                    {STATUS_LABELS[currentStatus] || currentStatus}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {STATUS_DESCRIPTIONS[currentStatus] ||
                      "Your order status has been updated."}
                  </p>

                  {order.updatedAt && (
                    <p className="mt-2 text-xs text-gray-400">
                      Last updated: {formatDateTime(order.updatedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            MAIN GRID
        ====================================================== */}

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {/* ORDER PROGRESS */}

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                Order Progress
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Track your order from placement to delivery.
              </p>
            </div>

            {isCancelled ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <FiXCircle />
                  </div>

                  <div>
                    <h3 className="font-semibold text-red-800">
                      Order Cancelled
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      This order has been cancelled and will not continue
                      through the delivery process.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="space-y-0">
                  {trackingSteps.map((step, index) => {
                    const StepIcon = STATUS_ICONS[step.status] || FiPackage;

                    const isLast = index === trackingSteps.length - 1;

                    const completed = Boolean(step.completed);
                    const current = Boolean(step.current);

                    return (
                      <div
                        key={`${step.status}-${index}`}
                        className="relative flex gap-3 sm:gap-4"
                      >
                        {!isLast && (
                          <div
                            className={`absolute left-5 top-10 h-[calc(100%-8px)] w-0.5 ${
                              completed ? "bg-emerald-500" : "bg-gray-200"
                            }`}
                          />
                        )}

                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                            completed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : current
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-gray-200 bg-white text-gray-400"
                          }`}
                        >
                          <StepIcon className="text-sm" />
                        </div>

                        <div
                          className={`min-w-0 flex-1 ${
                            isLast ? "pb-0" : "pb-8"
                          }`}
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <h3
                              className={`text-sm font-bold ${
                                completed || current
                                  ? "text-gray-900"
                                  : "text-gray-400"
                              }`}
                            >
                              {step.label ||
                                STATUS_LABELS[step.status] ||
                                step.status}
                            </h3>

                            {current && (
                              <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                                Current
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-xs leading-5 ${
                              completed || current
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                          >
                            {STATUS_DESCRIPTIONS[step.status] ||
                              "Order status update."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* SIDEBAR */}

          <div className="space-y-5">
            {/* DELIVERY INFORMATION */}

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">
                Delivery Information
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <FiUser />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-400">
                      Customer
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {order.customer?.name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <FiPhone />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-400">Phone</p>

                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                      {order.customer?.phone || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <FiMapPin />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-400">Address</p>

                    <p className="mt-1 break-words text-sm font-semibold leading-6 text-gray-900">
                      {order.customer?.address || "N/A"}
                    </p>

                    {(order.customer?.area || order.customer?.city) && (
                      <p className="mt-1 break-words text-xs text-gray-500">
                        {[order.customer?.area, order.customer?.city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    {order.customer?.zip && (
                      <p className="mt-1 text-xs text-gray-500">
                        ZIP: {order.customer.zip}
                      </p>
                    )}
                  </div>
                </div>

                {order.customer?.note && (
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-700">
                      Delivery Note
                    </p>

                    <p className="mt-1 text-sm leading-5 text-amber-800">
                      {order.customer.note}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* PAYMENT */}

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">Payment</h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <span className="text-sm text-gray-500">Method</span>

                  <span className="text-right text-sm font-semibold text-gray-900">
                    {formatPaymentMethod(order.paymentMethod)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">Status</span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : order.paymentStatus === "failed"
                          ? "bg-red-100 text-red-700"
                          : order.paymentStatus === "refunded"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {formatPaymentStatus(order.paymentStatus)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ======================================================
            ORDER ITEMS
        ====================================================== */}

        <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                Order Items
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {totalQuantity} item(s)
              </p>
            </div>

            <Link
              to="/dashboard/my-orders"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 transition hover:text-gray-900"
            >
              My Orders
              <FiChevronRight />
            </Link>
          </div>

          {Array.isArray(order.items) && order.items.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => {
                const quantity = Math.max(toNumber(item?.quantity), 0);

                const finalPrice = toNumber(item?.finalPrice ?? item?.price, 0);

                const backendItemSubtotal = Number(item?.subtotal);

                const itemSubtotal = Number.isFinite(backendItemSubtotal)
                  ? roundMoney(backendItemSubtotal)
                  : roundMoney(finalPrice * quantity);

                return (
                  <div
                    key={`${item.productId || "item"}-${index}`}
                    className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-24 sm:w-24">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || "Product"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <FiPackage className="text-2xl" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-bold text-gray-900 sm:text-base">
                          {item.name || "Unknown Product"}
                        </h3>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                          {item.brand && <span>Brand: {item.brand}</span>}

                          {item.weight && <span>Weight: {item.weight}</span>}

                          {item.sku && <span>SKU: {item.sku}</span>}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            Qty: {quantity}
                          </span>

                          <span className="text-xs text-gray-500">
                            {formatCurrency(finalPrice)} each
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 sm:block sm:min-w-[120px] sm:border-0 sm:pt-0 sm:text-right">
                      <span className="text-xs text-gray-500 sm:hidden">
                        Item Total
                      </span>

                      <p className="text-sm font-bold text-gray-900 sm:text-base">
                        {formatCurrency(itemSubtotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 p-8 text-center">
              <FiPackage className="mx-auto text-3xl text-gray-300" />

              <p className="mt-2 text-sm text-gray-500">
                No order items available.
              </p>
            </div>
          )}
        </section>

        {/* ======================================================
            ORDER SUMMARY
        ====================================================== */}

        <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* TIMELINE */}

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Order Timeline
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Recent updates for this order.
              </p>

              {timeline.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {timeline.map((entry, index) => {
                    const entryStatus = entry?.status || "pending";

                    const EntryIcon = STATUS_ICONS[entryStatus] || FiPackage;

                    const entryClasses = getStatusClasses(entryStatus);

                    return (
                      <div
                        key={`${entryStatus}-${entry?.createdAt || index}`}
                        className="flex gap-3"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${entryClasses.icon}`}
                        >
                          <EntryIcon className="text-sm" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-gray-900">
                              {STATUS_LABELS[entryStatus] || entryStatus}
                            </p>

                            <p className="text-xs text-gray-400">
                              {formatDateTime(entry?.createdAt)}
                            </p>
                          </div>

                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {entry?.note ||
                              STATUS_DESCRIPTIONS[entryStatus] ||
                              "Order updated."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-gray-50 p-5 text-center">
                  <FiClock className="mx-auto text-2xl text-gray-300" />

                  <p className="mt-2 text-sm text-gray-500">
                    No timeline updates available.
                  </p>
                </div>
              )}
            </div>

            {/* FINANCIAL SUMMARY */}

            <div>
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

              <p className="mt-1 text-sm text-gray-500">
                Detailed pricing information.
              </p>

              <div className="mt-5 rounded-xl bg-gray-50 p-4 sm:p-5">
                <div className="space-y-3">
                  {/* SUBTOTAL */}

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">Subtotal</span>

                    <span className="font-medium text-gray-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {/* DISCOUNT */}

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">Discount</span>

                    <span className="font-medium text-emerald-600">
                      -{formatCurrency(totalDiscount)}
                    </span>
                  </div>

                  {/* SHIPPING */}

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">Shipping</span>

                    <span className="font-medium text-gray-900">
                      {formatCurrency(shipping)}
                    </span>
                  </div>

                  {/* TAX */}

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">Tax</span>

                    <span className="font-medium text-gray-900">
                      {formatCurrency(tax)}
                    </span>
                  </div>

                  <div className="my-3 border-t border-gray-200" />

                  {/* GRAND TOTAL */}

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-bold text-gray-900">
                      Grand Total
                    </span>

                    <span className="text-xl font-extrabold text-gray-900">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-400">
                  Subtotal - Discount + Shipping + Tax = Grand Total
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            FOOTER ACTIONS
        ====================================================== */}

        <div className="mt-5 flex flex-col gap-3 pb-6 sm:flex-row sm:justify-end">
          <Link
            to="/dashboard/my-orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <FiArrowLeft />
            Back to My Orders
          </Link>

          <button
            type="button"
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
