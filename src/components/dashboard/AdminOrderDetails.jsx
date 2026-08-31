import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight,
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

const REQUEST_TIMEOUT = 15000;

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_BADGES = {
  pending: "badge-warning",
  confirmed: "badge-primary",
  processing: "badge-info",
  shipped: "badge-secondary",
  delivered: "badge-success",
  cancelled: "badge-error",
};

const PAYMENT_BADGES = {
  unpaid: "badge-warning",
  pending: "badge-warning",
  paid: "badge-success",
  failed: "badge-error",
  refunded: "badge-info",
};

const STATUS_ICONS = {
  pending: FiClock,
  confirmed: FiCheckCircle,
  processing: FiPackage,
  shipped: FiTruck,
  delivered: FiCheckCircle,
  cancelled: FiXCircle,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const round = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
};

const normalizeStatus = (value) => {
  const status = String(value || "pending")
    .trim()
    .toLowerCase();

  return ORDER_STATUSES.includes(status) ? status : "pending";
};

const normalizePaymentStatus = (value) => {
  const status = String(value || "pending")
    .trim()
    .toLowerCase();

  return status;
};

const formatStatus = (value) => {
  const status = normalizeStatus(value);

  return STATUS_LABELS[status] || "Pending";
};

const getStatusBadge = (value) => {
  const status = normalizeStatus(value);

  return STATUS_BADGES[status] || "badge-ghost";
};

const getPaymentBadge = (value) => {
  const status = normalizePaymentStatus(value);

  return PAYMENT_BADGES[status] || "badge-ghost";
};

const getStatusIcon = (value) => {
  const status = normalizeStatus(value);
  const Icon = STATUS_ICONS[status] || FiClock;

  return <Icon />;
};

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
    .replace(/[_-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(capitalize)
    .join(" ");
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const getOrderId = (order) => {
  return String(order?._id || order?.id || "");
};

const getOrderNumber = (order) => {
  if (order?.orderNumber) {
    return order.orderNumber;
  }

  if (order?.orderNo) {
    return order.orderNo;
  }

  if (order?.invoiceNumber) {
    return order.invoiceNumber;
  }

  const id = getOrderId(order);

  return id ? id.slice(-8).toUpperCase() : "—";
};

const getCustomer = (order) => {
  return order?.customer && typeof order.customer === "object"
    ? order.customer
    : {};
};

const getItems = (order) => {
  return Array.isArray(order?.items) ? order.items : [];
};

const getTimeline = (order) => {
  if (Array.isArray(order?.timeline)) {
    return order.timeline;
  }

  if (Array.isArray(order?.statusHistory)) {
    return order.statusHistory;
  }

  return [];
};

const getItemQuantity = (item) => {
  return Math.max(0, toNumber(item?.quantity, 0));
};

const getItemOriginalPrice = (item) => {
  return Math.max(0, toNumber(item?.price, 0));
};

const getItemFinalPrice = (item) => {
  const finalPrice = toNumber(item?.finalPrice, NaN);

  if (Number.isFinite(finalPrice)) {
    return Math.max(0, finalPrice);
  }

  const price = getItemOriginalPrice(item);

  const discount = Math.max(0, toNumber(item?.discount, 0));

  return Math.max(0, price - (price * discount) / 100);
};

const getItemSubtotal = (item) => {
  const storedSubtotal = toNumber(item?.subtotal, NaN);

  if (Number.isFinite(storedSubtotal)) {
    return Math.max(0, storedSubtotal);
  }

  return round(getItemFinalPrice(item) * getItemQuantity(item));
};

const getItemDiscountAmount = (item) => {
  const storedDiscountAmount = toNumber(item?.discountAmount, NaN);

  if (Number.isFinite(storedDiscountAmount) && storedDiscountAmount >= 0) {
    return storedDiscountAmount;
  }

  const quantity = getItemQuantity(item);
  const originalPrice = getItemOriginalPrice(item);
  const finalPrice = getItemFinalPrice(item);

  const calculatedDiscount = Math.max(
    0,
    (originalPrice - finalPrice) * quantity,
  );

  if (calculatedDiscount > 0) {
    return calculatedDiscount;
  }

  const discountPercent = Math.max(0, toNumber(item?.discount, 0));

  return (originalPrice * discountPercent * quantity) / 100;
};

/* -------------------------------------------------------------------------- */
/* Order Summary Helpers                                                      */
/* -------------------------------------------------------------------------- */

const getTotalQuantity = (order) => {
  if (order?.totalQuantity !== undefined && order?.totalQuantity !== null) {
    return Math.max(0, toNumber(order.totalQuantity, 0));
  }

  return getItems(order).reduce(
    (total, item) => total + getItemQuantity(item),
    0,
  );
};

const getProductCount = (order) => {
  if (order?.totalItems !== undefined && order?.totalItems !== null) {
    return Math.max(0, toNumber(order.totalItems, 0));
  }

  return getItems(order).length;
};

/*
 * IMPORTANT:
 *
 * Backend subtotal:
 *
 * finalPrice * quantity
 *
 * Therefore subtotal is already AFTER product discount.
 */
const getSubtotal = (order) => {
  if (order?.subtotal !== undefined && order?.subtotal !== null) {
    return Math.max(0, toNumber(order.subtotal, 0));
  }

  if (order?.subTotal !== undefined && order?.subTotal !== null) {
    return Math.max(0, toNumber(order.subTotal, 0));
  }

  return round(
    getItems(order).reduce(
      (total, item) => total + getItemFinalPrice(item) * getItemQuantity(item),
      0,
    ),
  );
};

const getDiscountTotal = (order) => {
  if (order?.totalDiscount !== undefined && order?.totalDiscount !== null) {
    return Math.max(0, toNumber(order.totalDiscount, 0));
  }

  if (order?.discountAmount !== undefined && order?.discountAmount !== null) {
    return Math.max(0, toNumber(order.discountAmount, 0));
  }

  if (order?.discount !== undefined && order?.discount !== null) {
    return Math.max(0, toNumber(order.discount, 0));
  }

  return round(
    getItems(order).reduce(
      (total, item) => total + getItemDiscountAmount(item),
      0,
    ),
  );
};

const getShippingCost = (order) => {
  if (order?.shipping !== undefined && order?.shipping !== null) {
    return Math.max(0, toNumber(order.shipping, 0));
  }

  if (order?.shippingCost !== undefined && order?.shippingCost !== null) {
    return Math.max(0, toNumber(order.shippingCost, 0));
  }

  if (order?.deliveryCharge !== undefined && order?.deliveryCharge !== null) {
    return Math.max(0, toNumber(order.deliveryCharge, 0));
  }

  return 0;
};

const getTax = (order) => {
  if (order?.tax !== undefined && order?.tax !== null) {
    return Math.max(0, toNumber(order.tax, 0));
  }

  if (order?.taxAmount !== undefined && order?.taxAmount !== null) {
    return Math.max(0, toNumber(order.taxAmount, 0));
  }

  return 0;
};

/*
 * IMPORTANT:
 *
 * Your backend calculates:
 *
 * subtotal = discounted item total
 *
 * grandTotal = subtotal + shipping + tax
 *
 * Therefore DO NOT do:
 *
 * subtotal - totalDiscount + shipping + tax
 *
 * because that would subtract the discount twice.
 */
const getGrandTotal = (order) => {
  if (order?.grandTotal !== undefined && order?.grandTotal !== null) {
    return Math.max(0, toNumber(order.grandTotal, 0));
  }

  if (order?.total !== undefined && order?.total !== null) {
    return Math.max(0, toNumber(order.total, 0));
  }

  if (order?.finalTotal !== undefined && order?.finalTotal !== null) {
    return Math.max(0, toNumber(order.finalTotal, 0));
  }

  return round(getSubtotal(order) + getShippingCost(order) + getTax(order));
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

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

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

  const showToast = useCallback((type, message) => {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

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

        const responseData = response?.data;

        const fetchedOrder =
          responseData?.data || responseData?.order || responseData;

        if (
          !fetchedOrder ||
          typeof fetchedOrder !== "object" ||
          Array.isArray(fetchedOrder)
        ) {
          throw new Error("Order information was not found.");
        }

        setOrder(fetchedOrder);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError, "Failed to load order details."),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiRequest, id, user],
  );

  useEffect(() => {
    if (authLoading || !user || !id) {
      return;
    }

    fetchOrder();
  }, [authLoading, user, id, fetchOrder]);

  const handleStatusChange = async (event) => {
    const nextStatus = normalizeStatus(event.target.value);

    const currentStatus = normalizeStatus(order?.status);

    const orderId = getOrderId(order);

    if (!orderId || nextStatus === currentStatus) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const response = await apiRequest({
        method: "PATCH",
        url: `/orders/status/${orderId}`,
        data: {
          status: nextStatus,
        },
      });

      const responseData = response?.data;

      const updatedOrder = responseData?.data || responseData?.order || null;

      if (updatedOrder) {
        setOrder(updatedOrder);
      } else {
        await fetchOrder({
          silent: true,
        });
      }

      showToast(
        "success",
        responseData?.message || "Order status updated successfully.",
      );
    } catch (requestError) {
      showToast(
        "error",
        getErrorMessage(requestError, "Failed to update order status."),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRefresh = async () => {
    await fetchOrder({
      silent: true,
    });

    showToast("success", "Order details refreshed.");
  };

  const customer = useMemo(() => getCustomer(order), [order]);

  const items = useMemo(() => getItems(order), [order]);

  const timeline = useMemo(() => {
    return [...getTimeline(order)].sort((a, b) => {
      const first = new Date(a?.createdAt || 0).getTime();

      const second = new Date(b?.createdAt || 0).getTime();

      return second - first;
    });
  }, [order]);

  const currentStatus = normalizeStatus(order?.status);

  const paymentStatus = normalizePaymentStatus(order?.paymentStatus);

  const customerName =
    customer?.name || order?.customerName || "Unknown Customer";

  const email = order?.email || customer?.email || "—";

  const phone = customer?.phone || order?.phone || "—";

  const paymentMethod =
    order?.paymentMethod || customer?.paymentMethod || "cod";

  const orderNumber = getOrderNumber(order);

  const totalQuantity = getTotalQuantity(order);

  const productCount = getProductCount(order);

  const subtotal = getSubtotal(order);

  const totalDiscount = getDiscountTotal(order);

  const shipping = getShippingCost(order);

  const tax = getTax(order);

  const grandTotal = getGrandTotal(order);

  if (authLoading) {
    return <AdminOrderDetailsSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-base-200 p-4 sm:p-6">
        <div className="alert alert-warning w-full max-w-lg">
          <FiUser className="shrink-0 text-lg" />

          <div className="min-w-0">
            <h3 className="font-semibold">Authentication required</h3>

            <p className="mt-1 text-sm">
              Please log in with an authorized admin account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <AdminOrderDetailsSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-base-200 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-5xl">
          <button
            type="button"
            onClick={() => navigate("/dashboard/orders")}
            className="btn btn-ghost btn-sm mb-5 gap-2"
          >
            <FiArrowLeft />
            Back to Orders
          </button>

          <div className="alert alert-error items-start">
            <FiXCircle className="mt-0.5 shrink-0 text-lg" />

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Unable to load order</h3>

              <p className="mt-1 break-words text-sm">
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-base-200 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-4 sm:space-y-5 lg:space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate("/dashboard/orders")}
              className="btn btn-ghost btn-sm mb-3 -ml-2 gap-2"
            >
              <FiArrowLeft />
              Back to Orders
            </button>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary sm:h-12 sm:w-12 sm:text-xl">
                <FiShoppingBag />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Order Details
                  </h1>

                  <span className={`badge ${getStatusBadge(currentStatus)}`}>
                    {formatStatus(currentStatus)}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-base-content/60 sm:text-sm">
                  <span className="font-semibold text-base-content/80">
                    #{orderNumber}
                  </span>

                  <span className="hidden sm:inline">•</span>

                  <span>Created {formatDateTime(order.createdAt)}</span>
                </div>
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

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Quick Information                                               */}
        {/* ---------------------------------------------------------------- */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickInfoCard
            icon={<FiDollarSign />}
            label="Grand Total"
            value={formatCurrency(grandTotal)}
          />

          <QuickInfoCard
            icon={<FiPackage />}
            label="Total Quantity"
            value={totalQuantity}
            description={`${productCount} product${
              productCount === 1 ? "" : "s"
            }`}
          />

          <QuickInfoCard
            icon={<FiCreditCard />}
            label="Payment"
            value={capitalize(paymentStatus)}
            badge={getPaymentBadge(paymentStatus)}
          />

          <QuickInfoCard
            icon={<FiTruck />}
            label="Order Status"
            value={formatStatus(currentStatus)}
            badge={getStatusBadge(currentStatus)}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Status Update                                                    */}
        {/* ---------------------------------------------------------------- */}

        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FiTruck className="shrink-0 text-primary" />

                  <h2 className="font-semibold">Update Order Status</h2>
                </div>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-base-content/60 sm:text-sm">
                  Change the order status. The customer order tracking timeline
                  will reflect the updated status.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                <span
                  className={`badge badge-lg ${getStatusBadge(currentStatus)}`}
                >
                  {formatStatus(currentStatus)}
                </span>

                <select
                  value={currentStatus}
                  onChange={handleStatusChange}
                  disabled={updatingStatus}
                  className="select select-bordered w-full sm:w-56"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>

                {updatingStatus && (
                  <span className="loading loading-spinner loading-sm self-center text-primary" />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Customer + Payment                                               */}
        {/* ---------------------------------------------------------------- */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <InfoCard title="Customer Information" icon={<FiUser />}>
            <div className="mb-5 flex min-w-0 items-center gap-3 rounded-xl bg-base-200/60 p-3 sm:p-4">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Name" value={customerName} />

              <InfoRow label="Email" value={email} />

              <InfoRow label="Phone" value={phone} icon={<FiPhone />} />
            </div>
          </InfoCard>

          <InfoCard title="Payment Information" icon={<FiCreditCard />}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow
                label="Payment Method"
                value={formatPaymentMethod(paymentMethod)}
              />

              <InfoRow
                label="Payment Status"
                value={
                  <span className={`badge ${getPaymentBadge(paymentStatus)}`}>
                    {capitalize(paymentStatus)}
                  </span>
                }
              />

              <InfoRow
                label="Order Total"
                value={formatCurrency(grandTotal)}
                strong
              />

              <InfoRow
                label="Order Date"
                value={formatDateTime(order.createdAt)}
                icon={<FiCalendar />}
              />

              <InfoRow
                label="Last Updated"
                value={formatDateTime(order.updatedAt)}
                icon={<FiClock />}
              />
            </div>
          </InfoCard>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Shipping Information                                             */}
        {/* ---------------------------------------------------------------- */}

        <InfoCard title="Shipping Information" icon={<FiMapPin />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Address" value={customer?.address} />

            <InfoRow label="Area" value={customer?.area} />

            <InfoRow label="City" value={customer?.city} />

            <InfoRow
              label="ZIP / Postal Code"
              value={customer?.zip || customer?.postalCode}
            />

            <InfoRow label="Phone" value={phone} icon={<FiPhone />} />

            {customer?.note && (
              <InfoRow label="Customer Note" value={customer.note} />
            )}
          </div>
        </InfoCard>

        {/* ---------------------------------------------------------------- */}
        {/* Products                                                         */}
        {/* ---------------------------------------------------------------- */}

        <section className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm">
          <div className="border-b border-base-300 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FiPackage className="shrink-0 text-primary" />

                  <h2 className="font-semibold">Ordered Products</h2>
                </div>

                <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
                  {totalQuantity} total item
                  {totalQuantity === 1 ? "" : "s"} from {productCount} product
                  {productCount === 1 ? "" : "s"}
                </p>
              </div>

              <span className="badge badge-outline self-start sm:self-auto">
                {productCount} Product
                {productCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {!items.length ? (
            <div className="m-4 rounded-xl border border-dashed border-base-300 p-8 text-center sm:m-6">
              <FiPackage className="mx-auto text-3xl text-base-content/30" />

              <p className="mt-3 text-sm text-base-content/60">
                Product details are not available for this order.
              </p>
            </div>
          ) : (
            <>
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
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Summary + Timeline                                               */}
        {/* ---------------------------------------------------------------- */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* Summary */}

          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex items-center gap-2">
                <FiDollarSign className="text-primary" />

                <h2 className="font-semibold">Order Summary</h2>
              </div>

              <div className="space-y-4">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />

                <SummaryRow
                  label="Discount"
                  value={`-${formatCurrency(totalDiscount)}`}
                  valueClass="text-success"
                />

                <SummaryRow label="Shipping" value={formatCurrency(shipping)} />

                <SummaryRow label="Tax" value={formatCurrency(tax)} />

                <div className="border-t border-base-300 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold">Grand Total</span>

                    <span className="whitespace-nowrap text-xl font-bold text-primary sm:text-2xl">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}

          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FiClock className="shrink-0 text-primary" />

                    <h2 className="font-semibold">Order Timeline</h2>
                  </div>

                  <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
                    Complete status history of this order.
                  </p>
                </div>

                <span className="badge badge-outline shrink-0">
                  {timeline.length} event
                  {timeline.length === 1 ? "" : "s"}
                </span>
              </div>

              {!timeline.length ? (
                <div className="rounded-xl bg-base-200/60 p-6 text-center text-sm text-base-content/60">
                  No timeline events found.
                </div>
              ) : (
                <div>
                  {timeline.map((event, index) => (
                    <TimelineItem
                      key={`${event?.status || "event"}-${
                        event?.createdAt || index
                      }-${index}`}
                      event={event}
                      isLast={index === timeline.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Metadata                                                         */}
        {/* ---------------------------------------------------------------- */}

        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetaItem
                icon={<FiHash />}
                label="Order Number"
                value={orderNumber}
              />

              <MetaItem
                icon={<FiCalendar />}
                label="Created"
                value={formatDateTime(order.createdAt)}
              />

              <MetaItem
                icon={<FiClock />}
                label="Updated"
                value={formatDateTime(order.updatedAt)}
              />

              <MetaItem
                icon={<FiPackage />}
                label="Total Quantity"
                value={totalQuantity}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Toast                                                              */}
      {/* ------------------------------------------------------------------ */}

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

/* -------------------------------------------------------------------------- */
/* Quick Info Card                                                            */
/* -------------------------------------------------------------------------- */

const QuickInfoCard = ({ icon, label, value, description, badge }) => {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
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
              <p className="mt-1 truncate text-xs text-base-content/50">
                {description}
              </p>
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

/* -------------------------------------------------------------------------- */
/* Info Card                                                                  */
/* -------------------------------------------------------------------------- */

const InfoCard = ({ title, icon, children }) => {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body p-4 sm:p-5 lg:p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="shrink-0 text-primary">{icon}</span>

          <h2 className="font-semibold">{title}</h2>
        </div>

        {children}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Info Row                                                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Product Table Row                                                          */
/* -------------------------------------------------------------------------- */

const ProductTableRow = ({ item }) => {
  const quantity = getItemQuantity(item);

  const price = getItemFinalPrice(item);

  const subtotal = getItemSubtotal(item);

  const discount = Math.max(0, toNumber(item?.discount, 0));

  const originalPrice = getItemOriginalPrice(item);

  return (
    <tr className="hover:bg-base-200/40">
      <td>
        <div className="flex min-w-0 items-center gap-3">
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

      <td>
        <span className="whitespace-nowrap">{item?.sku || "—"}</span>
      </td>

      <td>
        <div className="whitespace-nowrap">
          {discount > 0 && (
            <div className="text-xs text-base-content/40 line-through">
              {formatCurrency(originalPrice)}
            </div>
          )}

          <div>{formatCurrency(price)}</div>
        </div>
      </td>

      <td>
        {discount > 0 ? (
          <span className="text-success">-{discount}%</span>
        ) : (
          "—"
        )}
      </td>

      <td className="font-medium">{quantity}</td>

      <td className="font-semibold">{formatCurrency(subtotal)}</td>
    </tr>
  );
};

/* -------------------------------------------------------------------------- */
/* Product Mobile Card                                                        */
/* -------------------------------------------------------------------------- */

const ProductMobileCard = ({ item }) => {
  const quantity = getItemQuantity(item);

  const price = getItemFinalPrice(item);

  const subtotal = getItemSubtotal(item);

  const discount = Math.max(0, toNumber(item?.discount, 0));

  const originalPrice = getItemOriginalPrice(item);

  return (
    <div className="p-4 sm:p-5">
      <div className="flex gap-3">
        <ProductImage item={item} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="break-words font-semibold">
                {item?.name || "Unknown Product"}
              </p>

              {item?.brand && (
                <p className="text-xs text-base-content/50">{item.brand}</p>
              )}

              {item?.weight && (
                <p className="text-xs text-base-content/50">{item.weight}</p>
              )}
            </div>

            <p className="whitespace-nowrap font-bold text-primary">
              {formatCurrency(subtotal)}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-base-200/60 p-3 sm:grid-cols-4">
            <MobileProductInfo label="SKU" value={item?.sku} />

            <MobileProductInfo
              label="Price"
              value={
                discount > 0 ? (
                  <span>
                    <span className="mr-1 text-xs text-base-content/40 line-through">
                      {formatCurrency(originalPrice)}
                    </span>

                    {formatCurrency(price)}
                  </span>
                ) : (
                  formatCurrency(price)
                )
              }
            />

            <MobileProductInfo label="Qty" value={quantity} />

            <MobileProductInfo
              label="Discount"
              value={discount > 0 ? `-${discount}%` : "—"}
              valueClass={discount > 0 ? "text-success" : ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Product Image                                                              */
/* -------------------------------------------------------------------------- */

const ProductImage = ({ item }) => {
  const [imageError, setImageError] = useState(false);

  const image = item?.image || item?.imageUrl || "";

  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-base-300 bg-base-200 sm:h-16 sm:w-16">
      {image && !imageError ? (
        <img
          src={image}
          alt={item?.name || "Product"}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xl text-base-content/30">
          <FiPackage />
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Mobile Product Info                                                       */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Summary Row                                                                */
/* -------------------------------------------------------------------------- */

const SummaryRow = ({ label, value, valueClass = "" }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-base-content/60">{label}</span>

      <span className={`whitespace-nowrap text-sm font-medium ${valueClass}`}>
        {value}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Timeline Item                                                              */
/* -------------------------------------------------------------------------- */

const TimelineItem = ({ event, isLast }) => {
  const status = normalizeStatus(event?.status);

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
          <span className="font-semibold">{formatStatus(status)}</span>

          {event?.createdAt && (
            <>
              <FiChevronRight className="hidden text-xs text-base-content/30 sm:block" />

              <span className="text-xs text-base-content/50">
                {formatDateTime(event.createdAt)}
              </span>
            </>
          )}
        </div>

        {event?.note && (
          <p className="mt-1 break-words text-sm leading-5 text-base-content/60">
            {event.note}
          </p>
        )}

        {event?.updatedBy && (
          <p className="mt-1 break-words text-xs text-base-content/40">
            Updated by{" "}
            {typeof event.updatedBy === "object"
              ? event.updatedBy?.name || event.updatedBy?.email || "Admin"
              : event.updatedBy}
          </p>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Meta Item                                                                  */
/* -------------------------------------------------------------------------- */

const MetaItem = ({ icon, label, value }) => {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-base-200/60 p-3">
      <div className="mt-0.5 shrink-0 text-primary">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-base-content/50">{label}</p>

        <p className="mt-1 break-words text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

const AdminOrderDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        <div className="h-9 w-32 animate-pulse rounded bg-base-300" />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="h-8 w-64 animate-pulse rounded bg-base-300" />

            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-base-300" />
          </div>

          <div className="h-10 w-full animate-pulse rounded bg-base-300 sm:w-28" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
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

        <div className="h-52 animate-pulse rounded-2xl bg-base-300" />

        <div className="h-96 animate-pulse rounded-2xl bg-base-300" />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-base-300" />

          <div className="h-72 animate-pulse rounded-2xl bg-base-300" />
        </div>

        <div className="h-28 animate-pulse rounded-2xl bg-base-300" />
      </div>
    </div>
  );
};

export default AdminOrderDetails;
