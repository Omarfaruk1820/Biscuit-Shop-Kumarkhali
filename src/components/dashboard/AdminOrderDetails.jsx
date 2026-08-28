import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiHash,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

import { useNavigate, useParams } from "react-router-dom";

import { AuthContext } from "../../Auth/AuthProvider";
import axiosSecure from "../../hooks/axiosSecure";

// ============================================================
// CONSTANTS
// ============================================================

const REQUEST_TIMEOUT = 15000;

const STATUS_OPTIONS = [
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

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ============================================================
// STATUS HELPERS
// ============================================================

const getStatusBadge = (status) => {
  switch (status) {
    case "pending":
      return "badge-warning";

    case "confirmed":
      return "badge-primary";

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

const getStatusIcon = (status) => {
  switch (status) {
    case "pending":
      return <FiClock />;

    case "confirmed":
      return <FiCheckCircle />;

    case "processing":
      return <FiPackage />;

    case "shipped":
      return <FiTruck />;

    case "delivered":
      return <FiCheckCircle />;

    case "cancelled":
      return <FiXCircle />;

    default:
      return <FiClock />;
  }
};

const getPaymentStatusBadge = (status) => {
  switch (status) {
    case "paid":
      return "badge-success";

    case "pending":
      return "badge-warning";

    case "failed":
      return "badge-error";

    case "refunded":
      return "badge-info";

    case "unpaid":
      return "badge-warning";

    default:
      return "badge-ghost";
  }
};

// ============================================================
// FORMAT HELPERS
// ============================================================

const capitalize = (value = "") => {
  const text = String(value).trim();

  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "৳0.00";
  }

  return `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPaymentMethod = (value) => {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .split(" ")
    .map(capitalize)
    .join(" ");
};

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const getOrderQuantity = (order) => {
  if (Number.isFinite(Number(order?.totalQuantity))) {
    return Number(order.totalQuantity);
  }

  if (!Array.isArray(order?.items)) {
    return 0;
  }

  return order.items.reduce(
    (total, item) => total + Number(item?.quantity || 0),
    0,
  );
};

const getProductCount = (order) => {
  if (Number.isFinite(Number(order?.totalItems))) {
    return Number(order.totalItems);
  }

  return Array.isArray(order?.items) ? order.items.length : 0;
};

const getInitials = (name = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "CU";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AdminOrderDetails = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const { id } = useParams();

  const navigate = useNavigate();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [error, setError] = useState("");

  const [toast, setToast] = useState(null);

  // ============================================================
  // API REQUEST
  // ============================================================

  const apiRequest = useCallback(async (config) => {
    return axiosSecure({
      ...config,
      timeout: REQUEST_TIMEOUT,
      withCredentials: true,
      headers: {
        Accept: "application/json",
        ...(config?.headers || {}),
      },
    });
  }, []);

  // ============================================================
  // TOAST
  // ============================================================

  const showToast = useCallback((type, message) => {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // ============================================================
  // FETCH ORDER
  // ============================================================

  const fetchOrder = useCallback(
    async ({ silent = false } = {}) => {
      if (!user || !id) {
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await apiRequest({
          method: "GET",
          url: `/orders/${id}`,
        });

        const nextOrder = response?.data?.data;

        if (!nextOrder) {
          throw new Error("Order information was not found.");
        }

        setOrder(nextOrder);
      } catch (error) {
        console.error("FETCH ADMIN ORDER DETAILS ERROR:", error);

        setError(
          getApiErrorMessage(
            error,
            "Failed to load order details. Please try again.",
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiRequest, id, user],
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (authLoading || !user || !id) {
      return;
    }

    fetchOrder();
  }, [authLoading, user, id, fetchOrder]);

  // ============================================================
  // UPDATE ORDER STATUS
  // ============================================================

  const handleStatusChange = async (event) => {
    const nextStatus = event.target.value;

    if (!order?._id || !nextStatus) {
      return;
    }

    if (nextStatus === order.status) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const response = await apiRequest({
        method: "PATCH",
        url: `/orders/status/${order._id}`,
        data: {
          status: nextStatus,
        },
      });

      const updatedOrder = response?.data?.data;

      if (updatedOrder) {
        setOrder(updatedOrder);
      } else {
        await fetchOrder({ silent: true });
      }

      showToast(
        "success",
        response?.data?.message || "Order status updated successfully.",
      );
    } catch (error) {
      console.error("UPDATE ADMIN ORDER STATUS ERROR:", error);

      showToast(
        "error",
        getApiErrorMessage(error, "Failed to update order status."),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    await fetchOrder({
      silent: true,
    });

    showToast("success", "Order details refreshed.");
  };

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const customer = order?.customer || {};

  const items = Array.isArray(order?.items) ? order.items : [];

  const timeline = Array.isArray(order?.timeline) ? order.timeline : [];

  const quantity = getOrderQuantity(order);

  const productCount = getProductCount(order);

  const currentStatus = order?.status || "pending";

  const paymentStatus = order?.paymentStatus || "pending";

  const paymentMethod = order?.paymentMethod;

  const customerName = customer?.name || order?.name || "Unknown Customer";

  const email = order?.email || customer?.email || "—";

  const orderNumber =
    order?.orderNumber || String(order?._id || "").slice(-8) || "—";

  const statusLabel =
    ORDER_STATUS_LABELS[currentStatus] || capitalize(currentStatus);

  const reversedTimeline = useMemo(() => {
    return [...timeline].reverse();
  }, [timeline]);

  // ============================================================
  // AUTH LOADING
  // ============================================================

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // ============================================================
  // AUTH REQUIRED
  // ============================================================

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="alert alert-warning w-full max-w-lg">
          <FiUser />

          <div>
            <h3 className="font-semibold">Authentication required</h3>

            <p className="text-sm">
              Please log in with an authorized admin account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return <AdminOrderDetailsSkeleton />;
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !order) {
    return (
      <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-5xl">
          <button
            type="button"
            onClick={() => navigate("/dashboard/orders")}
            className="btn btn-ghost btn-sm mb-5 gap-2"
          >
            <FiArrowLeft />
            Back to Orders
          </button>

          <div className="alert alert-error">
            <FiXCircle />

            <div className="min-w-0">
              <h3 className="font-semibold">Unable to load order</h3>

              <p className="break-words text-sm">
                {error || "Order information was not found."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchOrder()}
              className="btn btn-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-base-200 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-4 sm:space-y-5 lg:space-y-6">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate("/dashboard/orders")}
              className="btn btn-ghost btn-sm mb-3 -ml-2 gap-2"
            >
              <FiArrowLeft />
              Back to Orders
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
                <FiShoppingBag />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Order Details
                  </h1>

                  <span className="badge badge-outline">{statusLabel}</span>
                </div>

                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-base-content/60 sm:text-sm">
                  <span className="font-medium text-base-content/80">
                    {orderNumber}
                  </span>

                  <span>•</span>

                  <span>Created {formatDateTime(order?.createdAt)}</span>
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || updatingStatus}
            className="btn btn-outline btn-sm w-full gap-2 sm:w-auto sm:btn-md"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ======================================================
            TOP SUMMARY
        ====================================================== */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickInfoCard
            icon={<FiDollarSign />}
            label="Grand Total"
            value={formatCurrency(order?.grandTotal)}
          />

          <QuickInfoCard
            icon={<FiPackage />}
            label="Total Quantity"
            value={quantity}
            description={`${productCount} product${
              productCount === 1 ? "" : "s"
            }`}
          />

          <QuickInfoCard
            icon={<FiCreditCard />}
            label="Payment"
            value={capitalize(paymentStatus)}
            badge={getPaymentStatusBadge(paymentStatus)}
          />

          <QuickInfoCard
            icon={<FiTruck />}
            label="Order Status"
            value={statusLabel}
            badge={getStatusBadge(currentStatus)}
          />
        </div>

        {/* ======================================================
            STATUS CONTROL
        ====================================================== */}

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FiTruck className="text-primary" />

                  <h2 className="font-semibold">Order Status</h2>
                </div>

                <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
                  Update the order status. The customer tracking timeline will
                  automatically reflect the new status.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                <span
                  className={`badge badge-lg ${getStatusBadge(currentStatus)}`}
                >
                  {statusLabel}
                </span>

                <select
                  value={currentStatus}
                  disabled={updatingStatus}
                  onChange={handleStatusChange}
                  className="select select-bordered w-full sm:w-56"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {updatingStatus && (
                  <span className="loading loading-spinner loading-sm text-primary" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            CUSTOMER + PAYMENT
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* CUSTOMER */}

          <InfoCard title="Customer Information" icon={<FiUser />}>
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-base-200/50 p-3 sm:p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                {getInitials(customerName)}
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold">{customerName}</p>

                <p className="truncate text-xs text-base-content/60 sm:text-sm">
                  {email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow label="Name" value={customerName} />

              <InfoRow label="Email" value={email} />

              <InfoRow
                label="Phone"
                value={customer?.phone}
                icon={<FiPhone />}
              />
            </div>
          </InfoCard>

          {/* PAYMENT */}

          <InfoCard title="Payment Information" icon={<FiCreditCard />}>
            <div className="space-y-3">
              <InfoRow
                label="Payment Method"
                value={formatPaymentMethod(paymentMethod)}
              />

              <InfoRow
                label="Payment Status"
                value={
                  <span
                    className={`badge ${getPaymentStatusBadge(paymentStatus)}`}
                  >
                    {capitalize(paymentStatus)}
                  </span>
                }
              />

              <InfoRow
                label="Grand Total"
                value={formatCurrency(order?.grandTotal)}
                strong
              />

              <InfoRow
                label="Order Date"
                value={formatDateTime(order?.createdAt)}
                icon={<FiCalendar />}
              />

              <InfoRow
                label="Last Updated"
                value={formatDateTime(order?.updatedAt)}
                icon={<FiClock />}
              />
            </div>
          </InfoCard>
        </div>

        {/* ======================================================
            SHIPPING ADDRESS
        ====================================================== */}

        <InfoCard title="Shipping Information" icon={<FiMapPin />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Address" value={customer?.address} />

            <InfoRow label="Area" value={customer?.area} />

            <InfoRow label="City" value={customer?.city} />

            <InfoRow
              label="ZIP / Postal Code"
              value={customer?.zip || customer?.postalCode}
            />

            <InfoRow label="Phone" value={customer?.phone} icon={<FiPhone />} />

            {customer?.note && (
              <InfoRow label="Customer Note" value={customer.note} />
            )}
          </div>
        </InfoCard>

        {/* ======================================================
            ORDERED PRODUCTS
        ====================================================== */}

        <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm">
          <div className="border-b border-base-300 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FiPackage className="text-primary" />

                  <h2 className="font-semibold">Ordered Products</h2>
                </div>

                <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
                  {quantity} total item
                  {quantity === 1 ? "" : "s"} from {productCount} product
                  {productCount === 1 ? "" : "s"}
                </p>
              </div>

              <span className="badge badge-outline">
                {order?.totalItems || productCount} Products
              </span>
            </div>
          </div>

          {!items.length ? (
            <div className="p-10 text-center text-sm text-base-content/60">
              No product items found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-200/60">
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => (
                      <ProductTableRow
                        key={item?.productId || item?.sku || index}
                        item={item}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET */}

              <div className="divide-y divide-base-300 lg:hidden">
                {items.map((item, index) => (
                  <ProductMobileCard
                    key={item?.productId || item?.sku || index}
                    item={item}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ======================================================
            SUMMARY + TIMELINE
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* ORDER SUMMARY */}

          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex items-center gap-2">
                <FiDollarSign className="text-primary" />

                <h2 className="font-semibold">Order Summary</h2>
              </div>

              <div className="space-y-4">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(order?.subtotal)}
                />

                <SummaryRow
                  label="Discount"
                  value={`-${formatCurrency(order?.totalDiscount)}`}
                  valueClass="text-success"
                />

                <SummaryRow
                  label="Shipping"
                  value={formatCurrency(order?.shipping)}
                />

                <SummaryRow label="Tax" value={formatCurrency(order?.tax)} />

                <div className="border-t border-base-300 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-semibold">Grand Total</span>

                    <span className="text-xl font-bold text-primary sm:text-2xl">
                      {formatCurrency(order?.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE */}

          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FiClock className="text-primary" />

                    <h2 className="font-semibold">Order Timeline</h2>
                  </div>

                  <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
                    Complete status history of this order.
                  </p>
                </div>

                <span className="badge badge-outline">
                  {timeline.length} event
                  {timeline.length === 1 ? "" : "s"}
                </span>
              </div>

              {!reversedTimeline.length ? (
                <div className="rounded-xl bg-base-200/50 p-6 text-center text-sm text-base-content/60">
                  No timeline events found.
                </div>
              ) : (
                <div className="space-y-0">
                  {reversedTimeline.map((event, index) => (
                    <TimelineItem
                      key={`${event?.status}-${event?.createdAt}-${index}`}
                      event={event}
                      isLast={index === reversedTimeline.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================
            ORDER META
        ====================================================== */}

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetaItem
                icon={<FiHash />}
                label="Order Number"
                value={orderNumber}
              />

              <MetaItem
                icon={<FiCalendar />}
                label="Created"
                value={formatDateTime(order?.createdAt)}
              />

              <MetaItem
                icon={<FiClock />}
                label="Updated"
                value={formatDateTime(order?.updatedAt)}
              />

              <MetaItem
                icon={<FiPackage />}
                label="Total Quantity"
                value={quantity}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          TOAST
      ======================================================== */}

      {toast && (
        <div className="toast toast-end toast-bottom z-[100] w-[calc(100%-2rem)] max-w-sm sm:w-auto">
          <div
            className={`alert ${
              toast.type === "success" ? "alert-success" : "alert-error"
            } shadow-lg`}
          >
            <span className="break-words">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// QUICK INFO CARD
// ============================================================

const QuickInfoCard = ({ icon, label, value, description, badge }) => {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-base-content/60">{label}</p>

            <div className="mt-2">
              {badge ? (
                <span className={`badge badge-lg ${badge}`}>{value}</span>
              ) : (
                <p className="truncate text-xl font-bold sm:text-2xl">
                  {value}
                </p>
              )}
            </div>

            {description && (
              <p className="mt-1 text-xs text-base-content/50">{description}</p>
            )}
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary sm:h-11 sm:w-11">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// INFO CARD
// ============================================================

const InfoCard = ({ title, icon, children }) => {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body p-4 sm:p-5 lg:p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="text-primary">{icon}</span>

          <h2 className="font-semibold">{title}</h2>
        </div>

        {children}
      </div>
    </div>
  );
};

// ============================================================
// INFO ROW
// ============================================================

const InfoRow = ({ label, value, icon, strong = false }) => {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs text-base-content/50">
        {icon && <span className="shrink-0">{icon}</span>}

        <span>{label}</span>
      </div>

      <div
        className={`mt-1 break-words ${
          strong ? "text-base font-bold" : "text-sm font-medium"
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
};

// ============================================================
// PRODUCT TABLE ROW
// ============================================================

const ProductTableRow = ({ item }) => {
  const quantity = Number(item?.quantity) || 0;

  const subtotal = item?.subtotal ?? Number(item?.finalPrice || 0) * quantity;

  return (
    <tr className="hover:bg-base-200/40">
      <td>
        <div className="flex items-center gap-3">
          <ProductImage item={item} />

          <div className="min-w-0">
            <p className="max-w-[280px] truncate font-medium">
              {item?.name || "Unknown Product"}
            </p>

            {item?.brand && (
              <p className="text-xs text-base-content/50">{item.brand}</p>
            )}

            {item?.weight && (
              <p className="text-xs text-base-content/50">{item.weight}</p>
            )}
          </div>
        </div>
      </td>

      <td>{item?.sku || "—"}</td>

      <td>{formatCurrency(item?.price)}</td>

      <td>
        {Number(item?.discount) > 0 ? (
          <span className="text-success">-{item.discount}%</span>
        ) : (
          "—"
        )}
      </td>

      <td className="font-medium">{quantity}</td>

      <td className="font-semibold">{formatCurrency(subtotal)}</td>
    </tr>
  );
};

// ============================================================
// PRODUCT MOBILE CARD
// ============================================================

const ProductMobileCard = ({ item }) => {
  const quantity = Number(item?.quantity) || 0;

  const subtotal = item?.subtotal ?? Number(item?.finalPrice || 0) * quantity;

  return (
    <div className="p-4 sm:p-5">
      <div className="flex gap-3">
        <ProductImage item={item} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{item?.name || "Unknown Product"}</p>

              {item?.brand && (
                <p className="text-xs text-base-content/50">{item.brand}</p>
              )}

              {item?.weight && (
                <p className="text-xs text-base-content/50">{item.weight}</p>
              )}
            </div>

            <p className="font-bold text-primary">{formatCurrency(subtotal)}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-base-200/50 p-3 sm:grid-cols-4">
            <MobileProductInfo label="SKU" value={item?.sku} />

            <MobileProductInfo
              label="Price"
              value={formatCurrency(item?.price)}
            />

            <MobileProductInfo label="Qty" value={quantity} />

            <MobileProductInfo
              label="Discount"
              value={Number(item?.discount) > 0 ? `-${item.discount}%` : "—"}
              valueClass={Number(item?.discount) > 0 ? "text-success" : ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PRODUCT IMAGE
// ============================================================

const ProductImage = ({ item }) => {
  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-base-300 bg-base-200 sm:h-16 sm:w-16">
      {item?.image ? (
        <img
          src={item.image}
          alt={item?.name || "Product"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xl text-base-content/30">
          <FiPackage />
        </div>
      )}
    </div>
  );
};

// ============================================================
// MOBILE PRODUCT INFO
// ============================================================

const MobileProductInfo = ({ label, value, valueClass = "" }) => {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-base-content/50">
        {label}
      </p>

      <p className={`mt-1 truncate text-sm font-medium ${valueClass}`}>
        {value || "—"}
      </p>
    </div>
  );
};

// ============================================================
// SUMMARY ROW
// ============================================================

const SummaryRow = ({ label, value, valueClass = "" }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-base-content/60">{label}</span>

      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
};

// ============================================================
// TIMELINE ITEM
// ============================================================

const TimelineItem = ({ event, isLast }) => {
  const status = event?.status || "pending";

  const statusLabel = ORDER_STATUS_LABELS[status] || capitalize(status);

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="relative shrink-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusBadge(
            status,
          )}`}
        >
          {getStatusIcon(status)}
        </div>

        {!isLast && (
          <div className="absolute left-1/2 top-10 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-base-300" />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{statusLabel}</span>

          {event?.createdAt && (
            <span className="text-xs text-base-content/50">
              {formatDateTime(event.createdAt)}
            </span>
          )}
        </div>

        {event?.note && (
          <p className="mt-1 break-words text-sm text-base-content/60">
            {event.note}
          </p>
        )}

        {event?.updatedBy && (
          <p className="mt-1 text-xs text-base-content/40">
            Updated by {event.updatedBy}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================
// META ITEM
// ============================================================

const MetaItem = ({ icon, label, value }) => {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-base-200/50 p-3">
      <div className="mt-0.5 shrink-0 text-primary">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-base-content/50">{label}</p>

        <p className="mt-1 break-words text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
};

// ============================================================
// PAGE SKELETON
// ============================================================

const AdminOrderDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        <div className="h-10 w-32 animate-pulse rounded bg-base-300" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="h-8 w-56 animate-pulse rounded bg-base-300" />

            <div className="h-4 w-72 animate-pulse rounded bg-base-300" />
          </div>

          <div className="h-10 w-full animate-pulse rounded bg-base-300 sm:w-28" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-base-300"
            />
          ))}
        </div>

        <div className="h-28 animate-pulse rounded-2xl bg-base-300" />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-base-300" />

          <div className="h-64 animate-pulse rounded-2xl bg-base-300" />
        </div>

        <div className="h-80 animate-pulse rounded-2xl bg-base-300" />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-base-300" />

          <div className="h-72 animate-pulse rounded-2xl bg-base-300" />
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
