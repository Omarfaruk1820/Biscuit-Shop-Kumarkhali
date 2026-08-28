import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import moment from "moment";
import {
  FaArrowLeft,
  FaBox,
  FaBoxOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaExclamationCircle,
  FaHome,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPhone,
  FaShoppingBag,
  FaTimesCircle,
  FaTruck,
  FaUser,
} from "react-icons/fa";

import axiosSecure from "../hooks/axiosSecure";

// ============================================================
// CONSTANTS
// ============================================================

const ORDER_STALE_TIME = 30 * 1000;

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

// ============================================================
// HELPERS
// ============================================================

const normalizeStatus = (value, fallback = "pending") => {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  return status || fallback;
};

const formatStatus = (status) => {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatCurrency = (value) => {
  const amount = Number(value);

  return `৳${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) {
    return "--";
  }

  const date = moment(value);

  return date.isValid() ? date.format("DD MMM YYYY") : "--";
};

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  const date = moment(value);

  return date.isValid() ? date.format("DD MMM YYYY, hh:mm A") : "--";
};

const getStatusIcon = (status) => {
  switch (status) {
    case "pending":
      return <FaClock />;

    case "confirmed":
      return <FaCheckCircle />;

    case "processing":
      return <FaBoxOpen />;

    case "shipped":
      return <FaTruck />;

    case "delivered":
      return <FaCheckCircle />;

    case "cancelled":
      return <FaTimesCircle />;

    default:
      return <FaClipboardList />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "warning";

    case "confirmed":
    case "processing":
      return "info";

    case "shipped":
      return "primary";

    case "delivered":
      return "success";

    case "cancelled":
      return "error";

    default:
      return "base";
  }
};

const getStatusClasses = (status, active = false) => {
  const color = getStatusColor(status);

  if (color === "warning") {
    return active
      ? "bg-warning text-warning-content border-warning"
      : "border-warning/40 bg-warning/10 text-warning";
  }

  if (color === "info") {
    return active
      ? "bg-info text-info-content border-info"
      : "border-info/40 bg-info/10 text-info";
  }

  if (color === "primary") {
    return active
      ? "bg-primary text-primary-content border-primary"
      : "border-primary/40 bg-primary/10 text-primary";
  }

  if (color === "success") {
    return active
      ? "bg-success text-success-content border-success"
      : "border-success/40 bg-success/10 text-success";
  }

  if (color === "error") {
    return active
      ? "bg-error text-error-content border-error"
      : "border-error/40 bg-error/10 text-error";
  }

  return active
    ? "bg-base-content text-base-100 border-base-content"
    : "border-base-300 bg-base-200 text-base-content";
};

// ============================================================
// LOADING
// ============================================================

const OrderTrackingSkeleton = () => {
  return (
    <div className="space-y-6 pb-10">
      <div className="h-10 w-56 animate-pulse rounded-xl bg-base-300" />

      <div className="h-52 animate-pulse rounded-3xl bg-base-300" />

      <div className="h-80 animate-pulse rounded-3xl bg-base-300" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-3xl bg-base-300 xl:col-span-2" />

        <div className="h-80 animate-pulse rounded-3xl bg-base-300" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-3xl bg-base-300" />

        <div className="h-64 animate-pulse rounded-3xl bg-base-300" />
      </div>
    </div>
  );
};

// ============================================================
// ERROR
// ============================================================

const OrderTrackingError = ({ message, onRetry }) => {
  return (
    <div className="flex min-h-[500px] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-error/20 bg-base-100 p-8 text-center shadow-xl">
        <FaExclamationCircle className="mx-auto text-6xl text-error" />

        <h2 className="mt-5 text-2xl font-bold">Unable to Load Order</h2>

        <p className="mt-3 text-base-content/60">
          {message || "We could not load this order."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>

          <Link to="/dashboard/my-orders" className="btn btn-outline">
            My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STATUS TIMELINE
// ============================================================

const TrackingTimeline = ({ order }) => {
  const currentStatus = normalizeStatus(order?.status);

  const isCancelled = currentStatus === "cancelled";

  const currentIndex = ORDER_STATUSES.indexOf(currentStatus);

  const timeline = Array.isArray(order?.timeline) ? order.timeline : [];

  const getTimelineEntry = (status) => {
    return (
      timeline.find((item) => normalizeStatus(item?.status, "") === status) ||
      null
    );
  };

  // ----------------------------------------------------------
  // CANCELLED
  // ----------------------------------------------------------

  if (isCancelled) {
    return (
      <div className="rounded-3xl border border-error/30 bg-error/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-error text-2xl text-error-content">
            <FaTimesCircle />
          </div>

          <div>
            <h3 className="text-xl font-bold text-error">Order Cancelled</h3>

            <p className="mt-1 text-sm text-base-content/60">
              This order has been cancelled.
            </p>

            {order?.cancelledAt && (
              <p className="mt-2 text-sm font-medium">
                Cancelled: {formatDateTime(order.cancelledAt)}
              </p>
            )}
          </div>
        </div>

        {timeline.length > 0 && <TimelineActivity timeline={timeline} />}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <ul className="steps steps-horizontal w-full">
          {ORDER_STATUSES.map((status, index) => {
            const completed = currentIndex >= index && currentIndex !== -1;

            return (
              <li
                key={status}
                className={`step ${completed ? "step-primary" : ""}`}
                data-content={completed ? "✓" : index === 0 ? "!" : "•"}
              >
                <span className="font-medium">{formatStatus(status)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile Timeline */}
      <div className="space-y-4 md:hidden">
        {ORDER_STATUSES.map((status, index) => {
          const completed = currentIndex >= index && currentIndex !== -1;

          const entry = getTimelineEntry(status);

          return (
            <div key={status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${
                    completed
                      ? "border-primary bg-primary text-primary-content"
                      : "border-base-300 bg-base-200 text-base-content/40"
                  }`}
                >
                  {getStatusIcon(status)}
                </div>

                {index < ORDER_STATUSES.length - 1 && (
                  <div
                    className={`mt-2 h-10 w-0.5 ${
                      completed && currentIndex > index
                        ? "bg-primary"
                        : "bg-base-300"
                    }`}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-5">
                <h4
                  className={`font-bold ${
                    completed ? "text-primary" : "text-base-content/50"
                  }`}
                >
                  {formatStatus(status)}
                </h4>

                {entry?.message && (
                  <p className="mt-1 text-sm text-base-content/60">
                    {entry.message}
                  </p>
                )}

                {entry?.time && (
                  <p className="mt-1 text-xs text-base-content/50">
                    {formatDateTime(entry.time)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity */}
      {timeline.length > 0 && <TimelineActivity timeline={timeline} />}
    </div>
  );
};

// ============================================================
// TIMELINE ACTIVITY
// ============================================================

const TimelineActivity = ({ timeline }) => {
  return (
    <div className="rounded-2xl bg-base-200 p-5">
      <h3 className="mb-4 font-bold">Order Activity</h3>

      <div className="space-y-4">
        {[...timeline].reverse().map((entry, index) => {
          const status = normalizeStatus(entry?.status);

          return (
            <div
              key={`${status}-${entry?.time || index}`}
              className="flex gap-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getStatusClasses(
                  status,
                  true,
                )}`}
              >
                {getStatusIcon(status)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold">{formatStatus(status)}</h4>

                  {entry?.time && (
                    <span className="text-xs text-base-content/50">
                      {formatDateTime(entry.time)}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-base-content/60">
                  {entry?.message || `Order ${formatStatus(status)}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// ORDER ITEMS
// ============================================================

const OrderItems = ({ items }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="rounded-2xl bg-base-200 p-6 text-center">
        <FaBox className="mx-auto text-4xl text-base-content/30" />

        <p className="mt-3 text-base-content/60">No order items found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const quantity = Number(item?.quantity ?? 1);

        const price = Number(item?.price ?? 0);

        const discount = Number(item?.discount ?? 0);

        const subtotal = Number(
          item?.subtotal ?? (price - discount) * quantity,
        );

        const itemKey =
          item?.productId || item?.sku || item?._id || `item-${index}`;

        return (
          <div
            key={itemKey}
            className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 sm:flex-row"
          >
            {/* Image */}
            {item?.image ? (
              <img
                src={item.image}
                alt={item?.name || "Product"}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-base-200">
                <FaBox className="text-2xl text-base-content/30" />
              </div>
            )}

            {/* Product Info */}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold">{item?.name || "Product"}</h4>

              {item?.sku && (
                <p className="mt-1 text-xs text-base-content/50">
                  SKU: {item.sku}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/60">
                <span>Qty: {quantity}</span>

                <span>Unit: {formatCurrency(price)}</span>

                {discount > 0 && (
                  <span className="text-success">
                    Discount: {formatCurrency(discount)}
                  </span>
                )}
              </div>
            </div>

            {/* Subtotal */}
            <div className="sm:text-right">
              <p className="text-xs text-base-content/50">Subtotal</p>

              <p className="font-bold text-primary">
                {formatCurrency(subtotal)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// CUSTOMER INFORMATION
// ============================================================

const CustomerInformation = ({ order }) => {
  const customer = order?.customer || {};

  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FaUser />
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-base-content/50">
            Customer
          </p>

          <p className="mt-1 font-semibold">{customer?.name || "Customer"}</p>
        </div>
      </div>

      {/* Phone */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
          <FaPhone />
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-base-content/50">
            Phone
          </p>

          <p className="mt-1 font-semibold break-words">
            {customer?.phone || "--"}
          </p>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
          <FaMapMarkerAlt />
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-base-content/50">
            Delivery Address
          </p>

          <p className="mt-1 font-semibold">{customer?.address || "--"}</p>

          {(customer?.city || customer?.zip) && (
            <p className="mt-1 text-sm text-base-content/60">
              {[customer?.city, customer?.zip].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ORDER SUMMARY
// ============================================================

const OrderSummary = ({ order }) => {
  const subtotal = Number(order?.subtotal ?? 0);

  const totalDiscount = Number(order?.totalDiscount ?? 0);

  const shipping = Number(order?.shipping ?? 0);

  const tax = Number(order?.tax ?? 0);

  const grandTotal = Number(order?.grandTotal ?? 0);

  const paymentMethod = order?.paymentMethod || "cash_on_delivery";

  const paymentStatus = normalizeStatus(order?.paymentStatus, "pending");

  return (
    <div className="space-y-4">
      {/* Subtotal */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-base-content/60">Subtotal</span>

        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>

      {/* Discount */}
      {totalDiscount > 0 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-base-content/60">Discount</span>

          <span className="font-medium text-success">
            -{formatCurrency(totalDiscount)}
          </span>
        </div>
      )}

      {/* Shipping */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-base-content/60">Shipping</span>

        <span className="font-medium">{formatCurrency(shipping)}</span>
      </div>

      {/* Tax */}
      {tax > 0 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-base-content/60">Tax</span>

          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>
      )}

      <div className="divider my-2" />

      {/* Grand Total */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-lg font-bold">Grand Total</span>

        <span className="text-2xl font-extrabold text-primary">
          {formatCurrency(grandTotal)}
        </span>
      </div>

      {/* Payment */}
      <div className="rounded-xl bg-base-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm text-base-content/60">
            <FaMoneyBillWave />
            Payment
          </span>

          <span className="text-right text-sm font-semibold uppercase">
            {paymentMethod.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="text-sm text-base-content/60">Payment Status</span>

          <span
            className={`badge ${
              paymentStatus === "paid"
                ? "badge-success"
                : paymentStatus === "failed" || paymentStatus === "cancelled"
                  ? "badge-error"
                  : "badge-warning"
            }`}
          >
            {formatStatus(paymentStatus)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DELIVERY INFORMATION
// ============================================================

const DeliveryInformation = ({ order }) => {
  const customer = order?.customer || {};

  return (
    <div className="space-y-5">
      {/* Address */}
      <div className="rounded-2xl bg-base-200 p-5">
        <div className="flex items-start gap-4">
          <FaHome className="mt-1 shrink-0 text-xl text-primary" />

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-base-content/50">
              Delivery Address
            </p>

            <p className="mt-2 font-semibold">
              {customer?.address || "Address not available"}
            </p>

            {(customer?.city || customer?.zip) && (
              <p className="mt-1 text-sm text-base-content/60">
                {[customer?.city, customer?.zip].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="rounded-2xl border border-base-300 p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-base-content/60">Order Date</span>

          <span className="text-right text-sm font-semibold">
            {formatDateTime(order?.createdAt)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-base-content/60">Payment</span>

          <span className="text-right text-sm font-semibold uppercase">
            {order?.paymentMethod?.replaceAll("_", " ") || "Cash On Delivery"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-base-content/60">Payment Status</span>

          <span
            className={`badge ${
              normalizeStatus(order?.paymentStatus, "pending") === "paid"
                ? "badge-success"
                : normalizeStatus(order?.paymentStatus, "pending") === "failed"
                  ? "badge-error"
                  : "badge-warning"
            }`}
          >
            {formatStatus(normalizeStatus(order?.paymentStatus, "pending"))}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const OrderTracking = () => {
  const { id } = useParams();

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-order-tracking", id],

    enabled: Boolean(id),

    staleTime: ORDER_STALE_TIME,

    retry: 1,

    queryFn: async () => {
      const response = await axiosSecure.get(`/orders/my/${id}`);

      const data = response?.data?.data ?? response?.data;

      if (!data) {
        throw new Error("Order not found.");
      }

      return data;
    },
  });

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return <OrderTrackingSkeleton />;
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (isError || !order) {
    return (
      <OrderTrackingError
        message={
          error?.response?.data?.message ||
          error?.message ||
          "The requested order could not be found."
        }
        onRetry={refetch}
      />
    );
  }

  // ==========================================================
  // ORDER DATA
  // ==========================================================

  const orderId = String(order?._id || id);

  const orderNumber = order?.orderNumber || `#${orderId.slice(-8)}`;

  const status = normalizeStatus(order?.status);

  const totalItems = Number(order?.totalItems ?? 0);

  const totalQuantity = Number(order?.totalQuantity ?? 0);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-6 pb-10">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to="/dashboard/my-orders"
            className="btn btn-ghost btn-sm mb-3 gap-2"
          >
            <FaArrowLeft />
            Back to My Orders
          </Link>

          <h1 className="text-3xl font-extrabold md:text-4xl">
            Order Tracking
          </h1>

          <p className="mt-2 text-base-content/60">
            Track your order status and delivery progress.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/my-orders" className="btn btn-outline">
            <FaClipboardList />
            My Orders
          </Link>

          <Link
            to={`/dashboard/invoice/${orderId}`}
            className="btn btn-primary"
          >
            Invoice
          </Link>
        </div>
      </header>

      {/* ======================================================
          ORDER HERO
      ====================================================== */}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent p-6 text-primary-content shadow-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur">
                Order
              </span>

              <span className="break-all rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur">
                {orderNumber}
              </span>
            </div>

            <h2 className="mt-5 break-all text-lg font-bold md:text-2xl">
              Order ID: {orderId}
            </h2>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <FaCalendarAlt />
                {formatDate(order?.createdAt)}
              </span>

              <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <FaShoppingBag />
                {totalItems} {totalItems === 1 ? "Item" : "Items"}
              </span>

              <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <FaBox />
                Qty: {totalQuantity}
              </span>
            </div>
          </div>

          {/* Current Status */}
          <div className="w-full rounded-2xl bg-white p-5 text-center text-base-content shadow-xl sm:w-auto lg:min-w-56">
            <p className="text-xs uppercase tracking-wider text-base-content/50">
              Current Status
            </p>

            <div
              className={`mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-full ${getStatusClasses(
                status,
                true,
              )}`}
            >
              <span className="text-2xl">{getStatusIcon(status)}</span>
            </div>

            <h3 className="mt-3 text-xl font-bold">{formatStatus(status)}</h3>

            <p className="mt-1 text-xs text-base-content/50">
              Updated {formatDateTime(order?.updatedAt || order?.createdAt)}
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
          DELIVERY PROGRESS
      ====================================================== */}

      <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-xl md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Delivery Progress</h2>

          <p className="mt-1 text-sm text-base-content/60">
            Follow your order from pending to delivery.
          </p>
        </div>

        <TrackingTimeline order={order} />
      </section>

      {/* ======================================================
          ITEMS + SUMMARY
      ====================================================== */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Items */}
        <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-xl xl:col-span-2 md:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Order Items</h2>

              <p className="mt-1 text-sm text-base-content/60">
                Products included in this order.
              </p>
            </div>

            <span className="badge badge-primary badge-lg">
              {totalItems} Items
            </span>
          </div>

          <OrderItems items={order?.items} />
        </div>

        {/* Summary */}
        <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-xl md:p-7">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Order Summary</h2>

            <p className="mt-1 text-sm text-base-content/60">
              Payment and order total.
            </p>
          </div>

          <OrderSummary order={order} />
        </div>
      </section>

      {/* ======================================================
          CUSTOMER + DELIVERY
      ====================================================== */}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer */}
        <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-xl md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FaUser />
            </div>

            <div>
              <h2 className="text-xl font-bold">Customer Information</h2>

              <p className="text-sm text-base-content/60">
                Customer details for this order.
              </p>
            </div>
          </div>

          <CustomerInformation order={order} />
        </div>

        {/* Delivery */}
        <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-xl md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
              <FaMapMarkerAlt />
            </div>

            <div>
              <h2 className="text-xl font-bold">Delivery Information</h2>

              <p className="text-sm text-base-content/60">
                Delivery and payment details.
              </p>
            </div>
          </div>

          <DeliveryInformation order={order} />
        </div>
      </section>

      {/* ======================================================
          FOOTER ACTIONS
      ====================================================== */}

      <section className="rounded-3xl border border-base-300 bg-base-100 p-6 text-center shadow-xl md:p-8">
        <FaShoppingBag className="mx-auto text-5xl text-primary" />

        <h2 className="mt-4 text-2xl font-bold">
          Need to check something else?
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm text-base-content/60">
          Return to your orders, view your invoice, or continue shopping.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard/my-orders" className="btn btn-primary">
            <FaClipboardList />
            My Orders
          </Link>

          <Link
            to={`/dashboard/invoice/${orderId}`}
            className="btn btn-outline"
          >
            Invoice
          </Link>

          <Link to="/products" className="btn btn-outline">
            Continue Shopping
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OrderTracking;
