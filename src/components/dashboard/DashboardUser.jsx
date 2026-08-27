import { useContext, useMemo } from "react";
import { Link } from "react-router";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";

import {
  FaArrowRight,
  FaBox,
  FaBoxOpen,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaHeart,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaShoppingBag,
  FaShoppingCart,
  FaTimesCircle,
  FaTruck,
  FaUserCircle,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import axiosSecure from "../../hooks/axiosSecure";

// ============================================================
// CONSTANTS
// ============================================================

const CART_STALE_TIME = 30 * 1000;
const ORDERS_STALE_TIME = 60 * 1000;

// ============================================================
// GENERAL HELPERS
// ============================================================

const normalizeStatus = (value, fallback = "pending") => {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  return status || fallback;
};

const getOrderId = (order) => {
  return order?._id ? String(order._id) : "";
};

const getOrderStatus = (order) => {
  return normalizeStatus(order?.status, "pending");
};

const getPaymentStatus = (order) => {
  return normalizeStatus(order?.paymentStatus, "unpaid");
};

const getOrderNumber = (order) => {
  if (order?.orderNumber) {
    return String(order.orderNumber);
  }

  const orderId = getOrderId(order);

  return orderId ? `#${orderId.slice(-8)}` : "#ORDER";
};

const getOrderTotal = (order) => {
  const total = Number(order?.grandTotal ?? order?.total ?? 0);

  return Number.isFinite(total) ? total : 0;
};

const getOrderItems = (order) => {
  const totalItems = Number(order?.totalItems);

  if (Number.isFinite(totalItems)) {
    return totalItems;
  }

  if (Array.isArray(order?.items)) {
    return order.items.length;
  }

  return 0;
};

const getOrderQuantity = (order) => {
  const totalQuantity = Number(order?.totalQuantity);

  if (Number.isFinite(totalQuantity)) {
    return totalQuantity;
  }

  if (!Array.isArray(order?.items)) {
    return 0;
  }

  return order.items.reduce((total, item) => {
    const quantity = Number(item?.quantity ?? 1);

    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
};

const getCartQuantity = (cart) => {
  if (!Array.isArray(cart)) {
    return 0;
  }

  return cart.reduce((total, item) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? 1);

    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
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

const formatTime = (value) => {
  if (!value) {
    return "--";
  }

  const date = moment(value);

  return date.isValid() ? date.format("hh:mm A") : "--";
};

const formatStatus = (status) => {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// ============================================================
// STATUS HELPERS
// ============================================================

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "pending":
      return "badge-warning";

    case "confirmed":
    case "processing":
      return "badge-info";

    case "shipped":
      return "badge-primary";

    case "delivered":
      return "badge-success";

    case "cancelled":
      return "badge-error";

    default:
      return "badge-ghost";
  }
};

const getStatusIconClass = (status) => {
  switch (status) {
    case "pending":
      return "bg-warning text-warning-content";

    case "confirmed":
    case "processing":
      return "bg-info text-info-content";

    case "shipped":
      return "bg-primary text-primary-content";

    case "delivered":
      return "bg-success text-success-content";

    case "cancelled":
      return "bg-error text-error-content";

    default:
      return "bg-base-300 text-base-content";
  }
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

const getPaymentBadgeClass = (status) => {
  switch (status) {
    case "paid":
      return "badge-success";

    case "pending":
    case "unpaid":
      return "badge-warning";

    case "failed":
    case "cancelled":
    case "refunded":
      return "badge-error";

    default:
      return "badge-ghost";
  }
};

// ============================================================
// ORDER STATUS CARD COLORS
// ============================================================

const STATUS_CARD_STYLES = {
  warning: {
    container: "border-warning/30 bg-warning/10",
    text: "text-warning",
    icon: "bg-warning text-warning-content",
    progress: "progress-warning",
  },

  info: {
    container: "border-info/30 bg-info/10",
    text: "text-info",
    icon: "bg-info text-info-content",
    progress: "progress-info",
  },

  primary: {
    container: "border-primary/30 bg-primary/10",
    text: "text-primary",
    icon: "bg-primary text-primary-content",
    progress: "progress-primary",
  },

  success: {
    container: "border-success/30 bg-success/10",
    text: "text-success",
    icon: "bg-success text-success-content",
    progress: "progress-success",
  },
};

// ============================================================
// API HELPERS
// ============================================================

const extractArray = (response) => {
  const data = response?.data?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

// ============================================================
// DASHBOARD SKELETON
// ============================================================

const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="h-32 animate-pulse rounded-3xl bg-base-300" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl bg-base-300"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-3xl bg-base-300" />

      <div className="h-96 animate-pulse rounded-3xl bg-base-300" />
    </div>
  );
};

// ============================================================
// ERROR STATE
// ============================================================

const DashboardError = ({ onRetry, isRefreshing }) => {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-3xl bg-base-200 p-8">
      <div className="max-w-lg text-center">
        <FaTimesCircle className="mx-auto text-6xl text-error" />

        <h2 className="mt-5 text-3xl font-bold">Failed to Load Dashboard</h2>

        <p className="mt-3 text-base-content/70">
          Something went wrong while loading your dashboard data. Please try
          again.
        </p>

        <button
          type="button"
          onClick={onRetry}
          disabled={isRefreshing}
          className="btn btn-primary mt-6"
        >
          {isRefreshing ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Refreshing...
            </>
          ) : (
            "Try Again"
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  title,
  value,
  icon,
  cardClass,
  iconClass = "opacity-80",
}) => {
  return (
    <div className={`card shadow-xl ${cardClass}`}>
      <div className="card-body">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm opacity-90">{title}</p>

            <h3 className="mt-2 text-3xl font-extrabold md:text-4xl">
              {value}
            </h3>
          </div>

          <div className={`shrink-0 text-5xl ${iconClass}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// QUICK ACTION CARD
// ============================================================

const QuickActionCard = ({ to, icon, iconClass, title, description }) => {
  return (
    <Link
      to={to}
      className="card bg-base-100 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="card-body">
        <div className={`text-5xl ${iconClass}`}>{icon}</div>

        <h3 className="mt-2 text-xl font-bold">{title}</h3>

        <p className="text-base-content/70">{description}</p>

        <div className="card-actions justify-end">
          <FaArrowRight />
        </div>
      </div>
    </Link>
  );
};

// ============================================================
// ORDER STATUS CARD
// ============================================================

const OrderStatusCard = ({
  title,
  count,
  description,
  icon,
  color = "primary",
  total,
}) => {
  const styles = STATUS_CARD_STYLES[color] || STATUS_CARD_STYLES.primary;

  return (
    <div className={`card border bg-base-100 shadow-lg ${styles.container}`}>
      <div className="card-body">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-base-content/60">{title}</p>

            <h3 className={`mt-2 text-4xl font-bold ${styles.text}`}>
              {count}
            </h3>
          </div>

          <div className={`rounded-2xl p-4 ${styles.icon}`}>{icon}</div>
        </div>

        <progress
          className={`progress mt-5 w-full ${styles.progress}`}
          value={count}
          max={total || 1}
        />

        <p className="text-xs text-base-content/60">{description}</p>
      </div>
    </div>
  );
};

// ============================================================
// EMPTY ORDERS
// ============================================================

const EmptyOrders = () => {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-12 text-center shadow-xl">
      <FaShoppingBag className="mx-auto text-6xl text-base-content/20" />

      <h3 className="mt-5 text-2xl font-bold">No Orders Yet</h3>

      <p className="mt-2 text-base-content/60">
        You have not placed any orders yet.
      </p>

      <Link to="/products" className="btn btn-primary mt-5">
        Browse Products
        <FaArrowRight />
      </Link>
    </div>
  );
};

// ============================================================
// RECENT ORDERS DESKTOP TABLE
// ============================================================

const RecentOrdersTable = ({ orders }) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-xl">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>#</th>
            <th>Order</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order, index) => {
            const orderId = getOrderId(order);
            const orderNumber = getOrderNumber(order);
            const status = getOrderStatus(order);
            const paymentStatus = getPaymentStatus(order);
            const total = getOrderTotal(order);
            const totalItems = getOrderItems(order);
            const totalQuantity = getOrderQuantity(order);

            return (
              <tr key={orderId || `${orderNumber}-${index}`}>
                <td className="font-semibold">{index + 1}</td>

                <td>
                  <span className="font-bold">{orderNumber}</span>
                </td>

                <td>{formatDate(order?.createdAt)}</td>

                <td>
                  <div className="flex flex-col gap-1">
                    <span className="badge badge-outline">
                      {totalItems} {totalItems === 1 ? "Item" : "Items"}
                    </span>

                    {totalQuantity !== totalItems && (
                      <span className="text-xs text-base-content/60">
                        Qty: {totalQuantity}
                      </span>
                    )}
                  </div>
                </td>

                <td>
                  <span className="font-bold text-primary">
                    {formatCurrency(total)}
                  </span>
                </td>

                <td>
                  <span
                    className={`badge capitalize ${getStatusBadgeClass(
                      status,
                    )}`}
                  >
                    {formatStatus(status)}
                  </span>
                </td>

                <td>
                  <span
                    className={`badge capitalize ${getPaymentBadgeClass(
                      paymentStatus,
                    )}`}
                  >
                    {formatStatus(paymentStatus)}
                  </span>
                </td>

                <td>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      to="/dashboard/my-orders"
                      className="btn btn-xs btn-primary"
                    >
                      View
                    </Link>

                    {orderId && (
                      <>
                        <Link
                          to={`/dashboard/track-order/${orderId}`}
                          className="btn btn-xs btn-info"
                        >
                          Track
                        </Link>

                        <Link
                          to={`/dashboard/invoice/${orderId}`}
                          className="btn btn-xs btn-success"
                        >
                          Invoice
                        </Link>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// MOBILE ORDER CARD
// ============================================================

const MobileOrderCard = ({ order }) => {
  const orderId = getOrderId(order);
  const status = getOrderStatus(order);
  const paymentStatus = getPaymentStatus(order);
  const total = getOrderTotal(order);
  const totalItems = getOrderItems(order);
  const totalQuantity = getOrderQuantity(order);

  return (
    <div className="card border border-base-200 bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold">
              {getOrderNumber(order)}
            </h3>

            <p className="text-xs text-base-content/60">
              {formatDate(order?.createdAt)}
            </p>
          </div>

          <span
            className={`badge shrink-0 capitalize ${getStatusBadgeClass(
              status,
            )}`}
          >
            {formatStatus(status)}
          </span>
        </div>

        <div className="divider my-1" />

        <div className="space-y-3">
          <div className="flex justify-between gap-4">
            <span className="text-base-content/60">Order Date</span>

            <span className="font-medium">{formatDate(order?.createdAt)}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/60">Items</span>

            <span className="font-medium">{totalItems}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/60">Quantity</span>

            <span className="font-medium">{totalQuantity}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/60">Payment</span>

            <span
              className={`badge capitalize ${getPaymentBadgeClass(
                paymentStatus,
              )}`}
            >
              {formatStatus(paymentStatus)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-base-content/60">Grand Total</span>

            <span className="font-bold text-primary">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {Array.isArray(order?.items) && order.items.length > 0 && (
          <>
            <div className="divider my-2" />

            <div className="space-y-3">
              {order.items.slice(0, 2).map((item, index) => {
                const quantity = Number(item?.quantity ?? 1);

                const subtotal = Number(
                  item?.subtotal ?? item?.finalPrice ?? item?.price ?? 0,
                );

                const itemKey = item?.productId || item?._id || `item-${index}`;

                return (
                  <div key={itemKey} className="flex items-center gap-3">
                    {item?.image ? (
                      <img
                        src={item.image}
                        alt={item?.name || "Product"}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-base-200">
                        <FaBox className="text-base-content/40" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-semibold">
                        {item?.name || "Product"}
                      </h4>

                      <p className="text-sm text-base-content/60">
                        Qty: {Number.isFinite(quantity) ? quantity : 1}
                      </p>
                    </div>

                    <span className="font-bold">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                );
              })}

              {order.items.length > 2 && (
                <p className="text-center text-sm text-base-content/60">
                  +{order.items.length - 2} more item(s)
                </p>
              )}
            </div>
          </>
        )}

        <div className="divider my-2" />

        <div className="grid grid-cols-3 gap-2">
          <Link to="/dashboard/my-orders" className="btn btn-primary btn-sm">
            View
          </Link>

          {orderId ? (
            <>
              <Link
                to={`/dashboard/track-order/${orderId}`}
                className="btn btn-info btn-sm"
              >
                Track
              </Link>

              <Link
                to={`/dashboard/invoice/${orderId}`}
                className="btn btn-success btn-sm"
              >
                Invoice
              </Link>
            </>
          ) : (
            <>
              <span />
              <span />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// RECENT ACTIVITY
// ============================================================

const RecentActivity = ({ orders }) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body items-center py-16 text-center">
          <FaClipboardList className="text-6xl text-base-content/20" />

          <h3 className="mt-4 text-2xl font-bold">No Recent Activity</h3>

          <p className="max-w-md text-base-content/60">
            Your order activity will appear here after you place your first
            order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-xl">
      <div className="card-body">
        <ul className="timeline timeline-vertical">
          {orders.map((order, index) => {
            const orderId = getOrderId(order);
            const status = getOrderStatus(order);

            const timeline =
              Array.isArray(order?.timeline) && order.timeline.length > 0
                ? order.timeline
                : [
                    {
                      status,
                      message: `Order ${formatStatus(status)}`,
                      time: order?.updatedAt || order?.createdAt,
                    },
                  ];

            const latest = timeline[timeline.length - 1];

            return (
              <li key={orderId || `activity-${index}`}>
                {index > 0 && <hr />}

                <div className="timeline-middle">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${getStatusIconClass(
                      status,
                    )}`}
                  >
                    {getStatusIcon(status)}
                  </div>
                </div>

                <div
                  className={`timeline-${
                    index % 2 === 0 ? "start" : "end"
                  } timeline-box border border-base-300 bg-base-100 shadow-lg`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-bold">
                        {getOrderNumber(order)}
                      </h3>

                      <span
                        className={`badge capitalize ${getStatusBadgeClass(
                          status,
                        )}`}
                      >
                        {formatStatus(status)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">Items:</span>{" "}
                        {getOrderItems(order)}
                      </p>

                      <p>
                        <span className="font-semibold">Grand Total:</span>{" "}
                        {formatCurrency(getOrderTotal(order))}
                      </p>
                    </div>

                    <div className="divider my-2" />

                    <div>
                      <p className="font-semibold">Latest Update</p>

                      <p className="mt-1 text-base-content/70">
                        {latest?.message || `Order ${formatStatus(status)}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-base-content/60">
                      <span>{formatDate(latest?.time)}</span>

                      <span>{formatTime(latest?.time)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        to="/dashboard/my-orders"
                        className="btn btn-primary btn-xs"
                      >
                        Details
                      </Link>

                      {orderId && (
                        <>
                          <Link
                            to={`/dashboard/track-order/${orderId}`}
                            className="btn btn-info btn-xs"
                          >
                            Track
                          </Link>

                          <Link
                            to={`/dashboard/invoice/${orderId}`}
                            className="btn btn-success btn-xs"
                          >
                            Invoice
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {index < orders.length - 1 && <hr />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const DashboardUser = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

  // ==========================================================
  // USER AUTHENTICATION
  // ==========================================================

  const userEmail = String(user?.email || "")
    .trim()
    .toLowerCase();

  const isAuthenticated =
    !authLoading && Boolean(user?.uid || user?.email) && Boolean(userEmail);

  // ==========================================================
  // ORDERS QUERY
  // ==========================================================

  const {
    data: orders = [],
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["my-orders", userEmail],
    enabled: isAuthenticated,
    staleTime: ORDERS_STALE_TIME,
    retry: 1,

    queryFn: async () => {
      const response = await axiosSecure.get("/orders/my");

      return extractArray(response);
    },
  });

  // ==========================================================
  // CART QUERY
  // ==========================================================

  const {
    data: cart = [],
    isLoading: cartLoading,
    isFetching: cartFetching,
    isError: cartError,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ["cart", userEmail],
    enabled: isAuthenticated,
    staleTime: CART_STALE_TIME,
    retry: 1,

    queryFn: async () => {
      const response = await axiosSecure.get("/carts");

      return extractArray(response);
    },
  });

  // ==========================================================
  // DASHBOARD STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];

    const safeCart = Array.isArray(cart) ? cart : [];

    const statusCounts = safeOrders.reduce(
      (result, order) => {
        const status = getOrderStatus(order);

        if (Object.prototype.hasOwnProperty.call(result, status)) {
          result[status] += 1;
        }

        return result;
      },
      {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      },
    );

    const totalSpent = safeOrders
      .filter((order) => getOrderStatus(order) !== "cancelled")
      .reduce((total, order) => total + getOrderTotal(order), 0);

    const recentOrders = [...safeOrders]
      .sort((first, second) => {
        const firstDate = new Date(first?.createdAt || 0).getTime();

        const secondDate = new Date(second?.createdAt || 0).getTime();

        return secondDate - firstDate;
      })
      .slice(0, 5);

    return {
      totalOrders: safeOrders.length,

      pendingOrders: statusCounts.pending,

      confirmedOrders: statusCounts.confirmed,

      processingOrders: statusCounts.processing,

      shippedOrders: statusCounts.shipped,

      deliveredOrders: statusCounts.delivered,

      cancelledOrders: statusCounts.cancelled,

      totalSpent,

      cartItems: getCartQuantity(safeCart),

      recentOrders,
    };
  }, [orders, cart]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    await Promise.all([refetchOrders(), refetchCart()]);
  };

  // ==========================================================
  // LOADING / ERROR STATES
  // ==========================================================

  const isLoading = authLoading || ordersLoading || cartLoading;

  const isRefreshing = ordersFetching || cartFetching;

  const hasError = ordersError || cartError;

  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const userName = user?.name || user?.displayName || "Customer";

  const userPhoto =
    user?.photo ||
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName,
    )}&background=2563eb&color=fff`;

  const userRole = user?.role || "user";

  const userStatus = normalizeStatus(user?.status, "active");

  const deliverySuccessRate =
    statistics.totalOrders > 0
      ? Math.round((statistics.deliveredOrders / statistics.totalOrders) * 100)
      : 0;

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (hasError) {
    return (
      <DashboardError onRetry={handleRefresh} isRefreshing={isRefreshing} />
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="space-y-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            User Dashboard
          </h1>

          <p className="mt-2 text-base-content/70">
            Welcome back! Here is a quick overview of your account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="badge badge-primary badge-lg">
            {moment().format("dddd")}
          </span>

          <span className="badge badge-outline badge-lg">
            {moment().format("DD MMMM YYYY")}
          </span>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-primary"
          >
            {isRefreshing ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Refreshing...
              </>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </header>

      {/* ======================================================
          USER HERO
      ====================================================== */}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent p-6 text-primary-content shadow-xl md:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <FaUserCircle className="text-5xl" />

              <div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Hello, {userName} 👋
                </h2>

                <p className="opacity-90">Welcome back to your dashboard.</p>
              </div>
            </div>

            <p className="max-w-2xl text-sm opacity-90 md:text-base">
              Manage your orders, track deliveries, review your shopping cart,
              and manage your account from one place.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/my-orders" className="btn btn-neutral">
                <FaClipboardList />
                My Orders
              </Link>

              <Link
                to="/products"
                className="btn border-white bg-transparent text-white hover:bg-white hover:text-primary"
              >
                <FaShoppingBag />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* USER PROFILE CARD */}

          <div className="flex justify-center">
            <div className="card w-full max-w-sm bg-base-100 text-base-content shadow-2xl">
              <div className="card-body items-center text-center">
                <img
                  src={userPhoto}
                  alt={userName}
                  className="h-28 w-28 rounded-full border-4 border-primary object-cover"
                />

                <h3 className="mt-3 text-2xl font-bold">{userName}</h3>

                <p className="max-w-full break-all text-sm text-base-content/70">
                  {userEmail}
                </p>

                <div className="divider my-2" />

                <div className="grid w-full grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-base-content/60">
                      Role
                    </p>

                    <span className="badge badge-primary mt-2 capitalize">
                      {userRole}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-base-content/60">
                      Status
                    </p>

                    <span
                      className={`badge mt-2 ${
                        userStatus === "active"
                          ? "badge-success"
                          : "badge-error"
                      }`}
                    >
                      {formatStatus(userStatus)}
                    </span>
                  </div>
                </div>

                <div className="divider my-2" />

                <div className="w-full space-y-3 text-left">
                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/70">Total Orders</span>

                    <span className="font-bold">{statistics.totalOrders}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/70">Cart Items</span>

                    <span className="font-bold">{statistics.cartItems}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-base-content/70">Member Since</span>

                    <span className="text-sm font-bold">
                      {formatDate(user?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          OVERVIEW
      ====================================================== */}

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>

          <p className="text-base-content/60">Your shopping statistics</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={statistics.totalOrders}
            icon={<FaClipboardList />}
            cardClass="bg-primary text-primary-content"
          />

          <StatCard
            title="Pending Orders"
            value={statistics.pendingOrders}
            icon={<FaClock />}
            cardClass="bg-warning text-warning-content"
          />

          <StatCard
            title="Delivered Orders"
            value={statistics.deliveredOrders}
            icon={<FaCheckCircle />}
            cardClass="bg-success text-success-content"
          />

          <StatCard
            title="Total Spending"
            value={formatCurrency(statistics.totalSpent)}
            icon={<FaMoneyBillWave />}
            cardClass="bg-secondary text-secondary-content"
          />
        </div>
      </section>

      {/* ======================================================
          SECONDARY STATISTICS
      ====================================================== */}

      <section className="grid grid-cols-2 gap-5 lg:grid-cols-5">
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <FaCheckCircle className="text-4xl text-info" />

            <h3 className="text-2xl font-bold">{statistics.confirmedOrders}</h3>

            <p className="text-sm text-base-content/70">Confirmed</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <FaBoxOpen className="text-4xl text-info" />

            <h3 className="text-2xl font-bold">
              {statistics.processingOrders}
            </h3>

            <p className="text-sm text-base-content/70">Processing</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <FaTruck className="text-4xl text-primary" />

            <h3 className="text-2xl font-bold">{statistics.shippedOrders}</h3>

            <p className="text-sm text-base-content/70">Shipped</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <FaShoppingCart className="text-4xl text-secondary" />

            <h3 className="text-2xl font-bold">{statistics.cartItems}</h3>

            <p className="text-sm text-base-content/70">Cart Items</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <FaTimesCircle className="text-4xl text-error" />

            <h3 className="text-2xl font-bold">{statistics.cancelledOrders}</h3>

            <p className="text-sm text-base-content/70">Cancelled</p>
          </div>
        </div>
      </section>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Quick Actions</h2>

          <p className="text-base-content/60">Frequently used pages</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <QuickActionCard
            to="/products"
            icon={<FaShoppingBag />}
            iconClass="text-primary"
            title="Browse Products"
            description="Discover products and available offers."
          />

          <QuickActionCard
            to="/dashboard/my-orders"
            icon={<FaClipboardList />}
            iconClass="text-secondary"
            title="My Orders"
            description="View and manage your orders."
          />

          <QuickActionCard
            to="/cart"
            icon={<FaShoppingCart />}
            iconClass="text-success"
            title="Shopping Cart"
            description="Review your cart before checkout."
          />

          <QuickActionCard
            to="/dashboard/profile"
            icon={<FaUserCircle />}
            iconClass="text-info"
            title="My Profile"
            description="Update your personal information."
          />

          <QuickActionCard
            to="/contact"
            icon={<FaMapMarkerAlt />}
            iconClass="text-error"
            title="Contact Support"
            description="Need help? Contact our support team."
          />

          <QuickActionCard
            to="/wishlist"
            icon={<FaHeart />}
            iconClass="text-pink-500"
            title="Wishlist"
            description="Save your favourite products for later."
          />
        </div>
      </section>

      {/* ======================================================
          ORDER STATUS
      ====================================================== */}

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Order Status Summary</h2>

          <p className="text-base-content/70">
            A quick overview of your current order status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <OrderStatusCard
            title="Pending Orders"
            count={statistics.pendingOrders}
            description="Awaiting confirmation"
            icon={<FaClock className="text-3xl" />}
            color="warning"
            total={statistics.totalOrders}
          />

          <OrderStatusCard
            title="Processing"
            count={statistics.processingOrders}
            description="Preparing for shipment"
            icon={<FaBoxOpen className="text-3xl" />}
            color="info"
            total={statistics.totalOrders}
          />

          <OrderStatusCard
            title="Shipped"
            count={statistics.shippedOrders}
            description="On the way"
            icon={<FaTruck className="text-3xl" />}
            color="primary"
            total={statistics.totalOrders}
          />

          <OrderStatusCard
            title="Delivered"
            count={statistics.deliveredOrders}
            description="Successfully delivered"
            icon={<FaCheckCircle className="text-3xl" />}
            color="success"
            total={statistics.totalOrders}
          />
        </div>

        {/* OVERALL PROGRESS */}

        <div className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Overall Order Progress</h3>

                <p className="text-base-content/60">
                  Delivery success rate based on your orders.
                </p>
              </div>

              <div className="text-left md:text-right">
                <h2 className="text-4xl font-extrabold text-success">
                  {deliverySuccessRate}%
                </h2>

                <p className="text-sm text-base-content/60">Delivery Success</p>
              </div>
            </div>

            <progress
              className="progress progress-success mt-6 h-4 w-full"
              value={statistics.deliveredOrders}
              max={statistics.totalOrders || 1}
            />

            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6">
              <div>
                <p className="text-xs text-base-content/60">Total</p>

                <h4 className="text-xl font-bold">{statistics.totalOrders}</h4>
              </div>

              <div>
                <p className="text-xs text-base-content/60">Pending</p>

                <h4 className="text-xl font-bold text-warning">
                  {statistics.pendingOrders}
                </h4>
              </div>

              <div>
                <p className="text-xs text-base-content/60">Confirmed</p>

                <h4 className="text-xl font-bold text-info">
                  {statistics.confirmedOrders}
                </h4>
              </div>

              <div>
                <p className="text-xs text-base-content/60">Processing</p>

                <h4 className="text-xl font-bold text-info">
                  {statistics.processingOrders}
                </h4>
              </div>

              <div>
                <p className="text-xs text-base-content/60">Shipped</p>

                <h4 className="text-xl font-bold text-primary">
                  {statistics.shippedOrders}
                </h4>
              </div>

              <div>
                <p className="text-xs text-base-content/60">Delivered</p>

                <h4 className="text-xl font-bold text-success">
                  {statistics.deliveredOrders}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          RECENT ORDERS
      ====================================================== */}

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Recent Orders</h2>

            <p className="text-base-content/70">
              Your latest orders are shown below.
            </p>
          </div>

          <Link to="/dashboard/my-orders" className="btn btn-primary">
            View All Orders
            <FaArrowRight />
          </Link>
        </div>

        {/* DESKTOP */}

        <div className="hidden lg:block">
          <RecentOrdersTable orders={statistics.recentOrders} />
        </div>

        {/* MOBILE */}

        <div className="space-y-5 lg:hidden">
          {statistics.recentOrders.length === 0 ? (
            <EmptyOrders />
          ) : (
            statistics.recentOrders.map((order, index) => (
              <MobileOrderCard
                key={getOrderId(order) || `mobile-order-${index}`}
                order={order}
              />
            ))
          )}
        </div>
      </section>

      {/* ======================================================
          RECENT ORDER ACTIVITY
      ====================================================== */}

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Recent Order Activity</h2>

          <p className="text-base-content/70">
            Track your latest order activities and delivery progress.
          </p>
        </div>

        <RecentActivity orders={statistics.recentOrders} />
      </section>
    </div>
  );
};

export default DashboardUser;
