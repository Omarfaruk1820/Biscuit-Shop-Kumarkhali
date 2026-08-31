import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiEye,
  FiFilter,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../Auth/AuthProvider";
import axiosSecure from "../../hooks/axiosSecure";

// ============================================================
// CONSTANTS
// ============================================================

const ORDERS_PER_PAGE = 10;
const REQUEST_TIMEOUT = 15000;

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All Orders",
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

const PAYMENT_STATUS_OPTIONS = [
  {
    value: "all",
    label: "All Payments",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "unpaid",
    label: "Unpaid",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
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
  {
    value: "highest",
    label: "Highest Amount",
  },
  {
    value: "lowest",
    label: "Lowest Amount",
  },
];

// Backend-compatible status transitions.
//
// This mirrors the server's STATUS_TRANSITIONS object:
//
// pending    -> confirmed, cancelled
// confirmed  -> processing, cancelled
// processing -> shipped, cancelled
// shipped    -> delivered
// delivered  -> nothing
// cancelled  -> nothing
//
const STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

// ============================================================
// HELPERS
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

const getPaymentStatusBadge = (status) => {
  switch (status) {
    case "paid":
      return "badge-success";

    case "pending":
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

const getOrderTotal = (order) => {
  const grandTotal = Number(order?.grandTotal);

  if (Number.isFinite(grandTotal)) {
    return grandTotal;
  }

  const total = Number(order?.total);

  return Number.isFinite(total) ? total : 0;
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
    return total + Number(item?.quantity || 0);
  }, 0);
};

const getProductCount = (order) => {
  const totalItems = Number(order?.totalItems);

  if (Number.isFinite(totalItems)) {
    return totalItems;
  }

  return Array.isArray(order?.items) ? order.items.length : 0;
};

const getCustomerName = (order) => {
  return order?.customer?.name || order?.name || "Unknown Customer";
};

const getCustomerEmail = (order) => {
  return order?.email || order?.customer?.email || "—";
};

const getPaymentMethod = (order) => {
  return order?.paymentMethod || order?.customer?.paymentMethod || "";
};

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const normalizePagination = (pagination = {}, fallbackPage = 1) => {
  const page = Number(pagination?.page);

  const limit = Number(pagination?.limit);

  const totalOrders =
    Number(pagination?.totalOrders ?? pagination?.total ?? pagination?.count) ||
    0;

  const totalPages =
    Number(pagination?.totalPages) ||
    (totalOrders > 0 && limit > 0 ? Math.ceil(totalOrders / limit) : 0);

  const safePage = Number.isFinite(page) && page > 0 ? page : fallbackPage;

  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? limit : ORDERS_PER_PAGE;

  return {
    page: safePage,
    limit: safeLimit,
    totalOrders,
    totalPages,
    hasNextPage:
      typeof pagination?.hasNextPage === "boolean"
        ? pagination.hasNextPage
        : totalPages > 0 && safePage < totalPages,
    hasPrevPage:
      typeof pagination?.hasPrevPage === "boolean"
        ? pagination.hasPrevPage
        : safePage > 1,
  };
};

const normalizeStats = (data = {}) => {
  const orderStats = data?.orders || {};

  return {
    totalOrders: Number(data?.totalOrders) || 0,

    pendingOrders: Number(data?.pendingOrders ?? orderStats?.pending) || 0,

    confirmedOrders:
      Number(data?.confirmedOrders ?? orderStats?.confirmed) || 0,

    processingOrders:
      Number(data?.processingOrders ?? orderStats?.processing) || 0,

    shippedOrders: Number(data?.shippedOrders ?? orderStats?.shipped) || 0,

    deliveredOrders:
      Number(data?.deliveredOrders ?? orderStats?.delivered) || 0,

    cancelledOrders:
      Number(data?.cancelledOrders ?? orderStats?.cancelled) || 0,

    totalRevenue: Number(data?.totalRevenue) || 0,

    totalProductsSold: Number(data?.totalProductsSold) || 0,

    averageOrderValue: Number(data?.averageOrderValue) || 0,
  };
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AdminOrderList = () => {
  const navigate = useNavigate();

  const { user, loading: authLoading } = useContext(AuthContext);

  // ==========================================================
  // STATE
  // ==========================================================

  const [orders, setOrders] = useState([]);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalProductsSold: 0,
    averageOrderValue: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: ORDERS_PER_PAGE,
    totalOrders: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [toast, setToast] = useState(null);

  const toastTimerRef = useRef(null);

  // Prevent stale requests from overwriting newer results.
  const ordersRequestIdRef = useRef(0);

  const statsRequestIdRef = useRef(0);

  // ==========================================================
  // TOAST
  // ==========================================================

  const showToast = useCallback((type, message) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast({
      type,
      message,
    });

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // ==========================================================
  // PROTECTED API REQUEST
  // ==========================================================

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

  // ==========================================================
  // FETCH ORDERS
  // ==========================================================

  const fetchOrders = useCallback(
    async ({
      page = 1,
      currentSearch = "",
      currentStatus = "all",
      currentPaymentStatus = "all",
      currentSort = "newest",
    } = {}) => {
      if (!user) {
        return;
      }

      const requestId = ordersRequestIdRef.current + 1;

      ordersRequestIdRef.current = requestId;

      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: ORDERS_PER_PAGE,
          search: currentSearch.trim(),
          status: currentStatus,
          sort: currentSort,
        };

        // Only send paymentStatus when an actual
        // payment filter is selected.
        if (currentPaymentStatus && currentPaymentStatus !== "all") {
          params.paymentStatus = currentPaymentStatus;
        }

        const response = await apiRequest({
          method: "GET",
          url: "/orders",
          params,
        });

        // Ignore an older response if another request
        // has already started.
        if (requestId !== ordersRequestIdRef.current) {
          return;
        }

        const responseData = response?.data || {};

        const nextOrders = Array.isArray(responseData?.data)
          ? responseData.data
          : [];

        const nextPagination = normalizePagination(
          responseData?.pagination,
          page,
        );

        setOrders(nextOrders);
        setPagination(nextPagination);
      } catch (requestError) {
        if (requestId !== ordersRequestIdRef.current) {
          return;
        }

        console.error("FETCH ORDERS ERROR:", requestError);

        setOrders([]);

        setError(getApiErrorMessage(requestError, "Failed to load orders."));
      } finally {
        if (requestId === ordersRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [apiRequest, user],
  );

  // ==========================================================
  // FETCH STATS
  // ==========================================================

  const fetchStats = useCallback(async () => {
    if (!user) {
      return;
    }

    const requestId = statsRequestIdRef.current + 1;

    statsRequestIdRef.current = requestId;

    try {
      setStatsLoading(true);
      setStatsError("");

      const response = await apiRequest({
        method: "GET",
        url: "/orders/stats",
      });

      if (requestId !== statsRequestIdRef.current) {
        return;
      }

      const data = response?.data?.data || {};

      setStats(normalizeStats(data));
    } catch (requestError) {
      if (requestId !== statsRequestIdRef.current) {
        return;
      }

      console.error("FETCH ORDER STATS ERROR:", requestError);

      setStatsError(
        getApiErrorMessage(requestError, "Failed to load order statistics."),
      );
    } finally {
      if (requestId === statsRequestIdRef.current) {
        setStatsLoading(false);
      }
    }
  }, [apiRequest, user]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setOrders([]);
      setLoading(false);
      setStatsLoading(false);
      return;
    }

    fetchOrders({
      page: 1,
      currentSearch: "",
      currentStatus: "all",
      currentPaymentStatus: "all",
      currentSort: "newest",
    });

    fetchStats();
  }, [authLoading, user, fetchOrders, fetchStats]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const nextSearch = searchInput.trim();

    setSearch(nextSearch);

    fetchOrders({
      page: 1,
      currentSearch: nextSearch,
      currentStatus: status,
      currentPaymentStatus: paymentStatus,
      currentSort: sort,
    });
  };

  // ==========================================================
  // STATUS FILTER
  // ==========================================================

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;

    setStatus(nextStatus);

    fetchOrders({
      page: 1,
      currentSearch: search,
      currentStatus: nextStatus,
      currentPaymentStatus: paymentStatus,
      currentSort: sort,
    });
  };

  // ==========================================================
  // PAYMENT FILTER
  // ==========================================================

  const handlePaymentStatusChange = (event) => {
    const nextPaymentStatus = event.target.value;

    setPaymentStatus(nextPaymentStatus);

    fetchOrders({
      page: 1,
      currentSearch: search,
      currentStatus: status,
      currentPaymentStatus: nextPaymentStatus,
      currentSort: sort,
    });
  };

  // ==========================================================
  // SORT
  // ==========================================================

  const handleSortChange = (event) => {
    const nextSort = event.target.value;

    setSort(nextSort);

    fetchOrders({
      page: 1,
      currentSearch: search,
      currentStatus: status,
      currentPaymentStatus: paymentStatus,
      currentSort: nextSort,
    });
  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setPaymentStatus("all");
    setSort("newest");

    fetchOrders({
      page: 1,
      currentSearch: "",
      currentStatus: "all",
      currentPaymentStatus: "all",
      currentSort: "newest",
    });
  };

  // ==========================================================
  // QUICK STATUS FILTER
  // ==========================================================

  const handleQuickStatusFilter = (nextStatus) => {
    setStatus(nextStatus);

    fetchOrders({
      page: 1,
      currentSearch: search,
      currentStatus: nextStatus,
      currentPaymentStatus: paymentStatus,
      currentSort: sort,
    });
  };

  // ==========================================================
  // PAGE CHANGE
  // ==========================================================

  const handlePageChange = (nextPage) => {
    const totalPages = Number(pagination.totalPages) || 0;

    const currentPage = Number(pagination.page) || 1;

    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }

    fetchOrders({
      page: nextPage,
      currentSearch: search,
      currentStatus: status,
      currentPaymentStatus: paymentStatus,
      currentSort: sort,
    });
  };

  // ==========================================================
  // OPEN ORDER
  // ==========================================================

  const handleOpenOrder = (order) => {
    const orderId = order?._id;

    if (!orderId) {
      showToast("error", "Order ID is missing.");

      return;
    }

    navigate(`/dashboard/orders/${encodeURIComponent(String(orderId))}`);
  };

  // ==========================================================
  // UPDATE ORDER STATUS
  // ==========================================================

  const handleOrderStatusUpdate = async (orderId, nextStatus) => {
    if (!orderId || !nextStatus || updatingOrderId === orderId) {
      return;
    }

    const currentOrder = orders.find(
      (order) => String(order?._id) === String(orderId),
    );

    if (!currentOrder) {
      return;
    }

    const currentStatus = currentOrder?.status || "pending";

    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(nextStatus)) {
      showToast(
        "error",
        `Order cannot move from "${ORDER_STATUS_LABELS[currentStatus] || capitalize(currentStatus)}" to "${ORDER_STATUS_LABELS[nextStatus] || capitalize(nextStatus)}".`,
      );

      return;
    }

    try {
      setUpdatingOrderId(orderId);

      const response = await apiRequest({
        method: "PATCH",
        url: `/orders/status/${encodeURIComponent(String(orderId))}`,
        data: {
          status: nextStatus,
        },
      });

      const updatedOrder = response?.data?.data;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          String(order?._id) === String(orderId)
            ? {
                ...order,
                ...(updatedOrder || {}),
                status: updatedOrder?.status || nextStatus,
                updatedAt: updatedOrder?.updatedAt || new Date().toISOString(),
              }
            : order,
        ),
      );

      showToast(
        "success",
        response?.data?.message || "Order status updated successfully.",
      );

      await fetchStats();
    } catch (requestError) {
      console.error("UPDATE ORDER STATUS ERROR:", requestError);

      showToast(
        "error",
        getApiErrorMessage(requestError, "Failed to update order status."),
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    if (!user) {
      return;
    }

    try {
      await Promise.all([
        fetchOrders({
          page: pagination.page || 1,
          currentSearch: search,
          currentStatus: status,
          currentPaymentStatus: paymentStatus,
          currentSort: sort,
        }),
        fetchStats(),
      ]);

      showToast("success", "Order data refreshed.");
    } catch (refreshError) {
      console.error("REFRESH ORDERS ERROR:", refreshError);
    }
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const paginationPages = useMemo(() => {
    const totalPages = Number(pagination.totalPages) || 0;

    const currentPage = Number(pagination.page) || 1;

    if (totalPages <= 0) {
      return [];
    }

    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    let startPage = Math.max(1, currentPage - 2);

    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
      startPage = 1;
      endPage = 5;
    }

    if (currentPage >= totalPages - 2) {
      startPage = totalPages - 4;
      endPage = totalPages;
    }

    return Array.from(
      {
        length: endPage - startPage + 1,
      },
      (_, index) => startPage + index,
    );
  }, [pagination.page, pagination.totalPages]);

  // ==========================================================
  // ACTIVE FILTERS
  // ==========================================================

  const hasActiveFilters =
    Boolean(search) ||
    status !== "all" ||
    paymentStatus !== "all" ||
    sort !== "newest";

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // ==========================================================
  // NOT AUTHENTICATED
  // ==========================================================

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
        <div className="alert alert-warning w-full max-w-lg">
          <FiAlertCircle />

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

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-base-200 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-4 sm:space-y-5 lg:space-y-6">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-base-content/60 sm:text-sm">
              <FiShoppingBag />

              <span>Dashboard</span>

              <span>/</span>

              <span>Orders</span>
            </div>

            <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              Order Management
            </h1>

            <p className="mt-1 max-w-2xl text-xs text-base-content/60 sm:text-sm">
              View, search, filter and manage customer orders from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || statsLoading}
            className="btn btn-outline btn-sm w-full gap-2 sm:w-auto sm:btn-md"
          >
            <FiRefreshCw
              className={loading || statsLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ======================================================
            STATS ERROR
        ====================================================== */}

        {statsError && (
          <div className="alert alert-warning flex-col items-start gap-3 sm:flex-row sm:items-center">
            <FiAlertCircle className="shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Statistics unavailable</p>

              <p className="break-words text-sm">{statsError}</p>
            </div>

            <button
              type="button"
              onClick={fetchStats}
              disabled={statsLoading}
              className="btn btn-sm w-full sm:w-auto"
            >
              {statsLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Retrying...
                </>
              ) : (
                "Retry"
              )}
            </button>
          </div>
        )}

        {/* ======================================================
            STATS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<FiShoppingBag />}
            loading={statsLoading}
          />

          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={<FiClock />}
            loading={statsLoading}
            onClick={() => handleQuickStatusFilter("pending")}
          />

          <StatCard
            title="Processing Orders"
            value={stats.processingOrders}
            icon={<FiPackage />}
            loading={statsLoading}
            onClick={() => handleQuickStatusFilter("processing")}
          />

          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<FiDollarSign />}
            loading={statsLoading}
          />
        </div>

        {/* ======================================================
            ORDER PIPELINE
        ====================================================== */}

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Order Pipeline</h2>

                <p className="text-xs text-base-content/60 sm:text-sm">
                  Current order status overview
                </p>
              </div>

              <FiTruck className="shrink-0 text-xl text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              {[
                {
                  label: "Pending",
                  value: stats.pendingOrders,
                  status: "pending",
                },
                {
                  label: "Confirmed",
                  value: stats.confirmedOrders,
                  status: "confirmed",
                },
                {
                  label: "Processing",
                  value: stats.processingOrders,
                  status: "processing",
                },
                {
                  label: "Shipped",
                  value: stats.shippedOrders,
                  status: "shipped",
                },
                {
                  label: "Delivered",
                  value: stats.deliveredOrders,
                  status: "delivered",
                },
              ].map((item) => (
                <PipelineItem
                  key={item.status}
                  label={item.label}
                  value={item.value}
                  status={item.status}
                  onClick={() => handleQuickStatusFilter(item.status)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiFilter className="shrink-0 text-primary" />

              <div>
                <h2 className="font-semibold">Search & Filters</h2>

                <p className="text-xs text-base-content/60">
                  Find orders quickly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_180px_180px_180px_auto]">
              {/* SEARCH */}

              <form
                onSubmit={handleSearchSubmit}
                className="join w-full md:col-span-2 xl:col-span-1"
              >
                <div className="relative min-w-0 flex-1">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Order number, email, name, phone..."
                    className="input input-bordered join-item w-full min-w-0 pl-10"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary join-item"
                  disabled={loading}
                >
                  Search
                </button>
              </form>

              {/* ORDER STATUS */}

              <select
                value={status}
                onChange={handleStatusChange}
                className="select select-bordered w-full"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* PAYMENT STATUS */}

              <select
                value={paymentStatus}
                onChange={handlePaymentStatusChange}
                className="select select-bordered w-full"
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* SORT */}

              <select
                value={sort}
                onChange={handleSortChange}
                className="select select-bordered w-full"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* RESET */}

              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters && !searchInput}
                className="btn btn-ghost border border-base-300 md:col-span-2 xl:col-span-1"
              >
                Reset
              </button>
            </div>

            {/* ACTIVE FILTERS */}

            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="text-base-content/60">Active filters:</span>

                {search && (
                  <span className="badge badge-outline max-w-full">
                    <span className="truncate">Search: {search}</span>
                  </span>
                )}

                {status !== "all" && (
                  <span className="badge badge-outline">
                    Status: {ORDER_STATUS_LABELS[status] || capitalize(status)}
                  </span>
                )}

                {paymentStatus !== "all" && (
                  <span className="badge badge-outline">
                    Payment:{" "}
                    {PAYMENT_STATUS_LABELS[paymentStatus] ||
                      capitalize(paymentStatus)}
                  </span>
                )}

                {sort !== "newest" && (
                  <span className="badge badge-outline">
                    Sort:{" "}
                    {
                      SORT_OPTIONS.find((option) => option.value === sort)
                        ?.label
                    }
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="alert alert-error flex-col items-start gap-3 sm:flex-row sm:items-center">
            <FiAlertCircle className="shrink-0" />

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Unable to load orders</h3>

              <p className="break-words text-sm">{error}</p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                fetchOrders({
                  page: pagination.page || 1,
                  currentSearch: search,
                  currentStatus: status,
                  currentPaymentStatus: paymentStatus,
                  currentSort: sort,
                })
              }
              className="btn btn-sm w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Loading...
                </>
              ) : (
                "Retry"
              )}
            </button>
          </div>
        )}

        {/* ======================================================
            ORDER LIST
        ====================================================== */}

        <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm">
          {/* HEADER */}

          <div className="border-b border-base-300 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Orders</h2>

                <p className="text-xs text-base-content/60 sm:text-sm">
                  {pagination.totalOrders} order
                  {pagination.totalOrders === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="text-xs text-base-content/60 sm:text-sm">
                Page {pagination.page || 1} of {pagination.totalPages || 0}
              </div>
            </div>
          </div>

          {/* ====================================================
              DESKTOP TABLE
          ==================================================== */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="table w-full">
              <thead>
                <tr className="bg-base-200/60">
                  <th>Order</th>

                  <th>Customer</th>

                  <th>Date</th>

                  <th>Items</th>

                  <th>Total</th>

                  <th>Payment</th>

                  <th>Status</th>

                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <OrderTableSkeleton />
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyOrders
                        hasFilters={hasActiveFilters}
                        onReset={handleResetFilters}
                      />
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <OrderRow
                      key={order?._id}
                      order={order}
                      onView={() => handleOpenOrder(order)}
                      onStatusChange={handleOrderStatusUpdate}
                      updatingOrderId={updatingOrderId}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ====================================================
              MOBILE LIST
          ==================================================== */}

          <div className="block lg:hidden">
            {loading ? (
              <OrderCardSkeleton />
            ) : orders.length === 0 ? (
              <EmptyOrders
                hasFilters={hasActiveFilters}
                onReset={handleResetFilters}
              />
            ) : (
              <div className="divide-y divide-base-300">
                {orders.map((order) => (
                  <OrderMobileCard
                    key={order?._id}
                    order={order}
                    onView={() => handleOpenOrder(order)}
                    onStatusChange={handleOrderStatusUpdate}
                    updatingOrderId={updatingOrderId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ====================================================
              PAGINATION
          ==================================================== */}

          {!loading && orders.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-base-300 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
              <p className="text-center text-xs text-base-content/60 sm:text-sm md:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalOrders,
                )}{" "}
                of {pagination.totalOrders} orders
              </p>

              <div className="flex justify-center">
                <div className="join">
                  <button
                    type="button"
                    className="btn btn-sm join-item"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    aria-label="Previous page"
                  >
                    <FiChevronLeft />
                  </button>

                  {paginationPages.map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={`btn btn-sm join-item ${
                        page === pagination.page ? "btn-primary" : ""
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="btn btn-sm join-item"
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    aria-label="Next page"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            </div>
          )}
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
// STAT CARD
// ============================================================

const StatCard = ({ title, value, icon, loading, onClick }) => {
  const clickable = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`card border border-base-300 bg-base-100 text-left shadow-sm transition ${
        clickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
          : "cursor-default"
      }`}
    >
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-base-content/60 sm:text-sm">
              {title}
            </p>

            {loading ? (
              <div className="mt-2 h-8 w-24 animate-pulse rounded bg-base-300 sm:w-28" />
            ) : (
              <p className="mt-1 truncate text-xl font-bold sm:text-2xl">
                {value}
              </p>
            )}
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary sm:h-11 sm:w-11 sm:text-xl">
            {icon}
          </div>
        </div>
      </div>
    </button>
  );
};

// ============================================================
// PIPELINE ITEM
// ============================================================

const PipelineItem = ({ label, value, status, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-xl border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary hover:shadow-sm sm:p-4"
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-base-content/60 sm:text-sm">
            {label}
          </p>

          <p className="mt-1 text-lg font-bold sm:text-xl">{value}</p>
        </div>

        <span
          className={`badge shrink-0 text-[10px] sm:text-xs ${getStatusBadge(
            status,
          )}`}
        >
          {label}
        </span>
      </div>
    </button>
  );
};

// ============================================================
// STATUS OPTIONS FOR ONE ORDER
// ============================================================

const getAvailableStatusOptions = (currentStatus) => {
  const normalizedStatus = ORDER_STATUSES.includes(currentStatus)
    ? currentStatus
    : "pending";

  const allowed = STATUS_TRANSITIONS[normalizedStatus] || [];

  return [
    normalizedStatus,
    ...allowed.filter((value) => value !== normalizedStatus),
  ].map((value) => ({
    value,
    label: ORDER_STATUS_LABELS[value] || capitalize(value),
  }));
};

// ============================================================
// DESKTOP ORDER ROW
// ============================================================

const OrderRow = ({ order, onView, onStatusChange, updatingOrderId }) => {
  const customerName = getCustomerName(order);

  const customerEmail = getCustomerEmail(order);

  const quantity = getOrderQuantity(order);

  const productCount = getProductCount(order);

  const currentStatus = ORDER_STATUSES.includes(order?.status)
    ? order.status
    : "pending";

  const paymentStatus = order?.paymentStatus || "unpaid";

  const isUpdating = String(updatingOrderId) === String(order?._id);

  const statusOptions = getAvailableStatusOptions(currentStatus);

  return (
    <tr className="hover:bg-base-200/40">
      {/* ORDER */}

      <td>
        <div className="min-w-[180px]">
          <button
            type="button"
            onClick={onView}
            className="max-w-[220px] truncate font-semibold text-primary hover:underline"
          >
            {order?.orderNumber || String(order?._id || "").slice(-8) || "—"}
          </button>

          <p className="mt-1 text-xs text-base-content/50">
            ID: {String(order?._id || "").slice(-8) || "—"}
          </p>
        </div>
      </td>

      {/* CUSTOMER */}

      <td>
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {getInitials(customerName)}
            </div>
          </div>

          <div className="min-w-0">
            <p className="max-w-[180px] truncate font-medium">{customerName}</p>

            <p className="max-w-[220px] truncate text-xs text-base-content/50">
              {customerEmail}
            </p>
          </div>
        </div>
      </td>

      {/* DATE */}

      <td>
        <div className="flex min-w-[110px] items-center gap-2 text-sm">
          <FiCalendar className="text-base-content/40" />

          {formatDate(order?.createdAt)}
        </div>
      </td>

      {/* ITEMS */}

      <td>
        <p className="font-medium">
          {quantity} item
          {quantity === 1 ? "" : "s"}
        </p>

        <p className="text-xs text-base-content/50">
          {productCount} product
          {productCount === 1 ? "" : "s"}
        </p>
      </td>

      {/* TOTAL */}

      <td>
        <p className="font-bold">{formatCurrency(getOrderTotal(order))}</p>

        <p className="text-xs text-base-content/50">
          {formatPaymentMethod(getPaymentMethod(order))}
        </p>
      </td>

      {/* PAYMENT */}

      <td>
        <span className={`badge ${getPaymentStatusBadge(paymentStatus)}`}>
          {PAYMENT_STATUS_LABELS[paymentStatus] || capitalize(paymentStatus)}
        </span>
      </td>

      {/* STATUS */}

      <td>
        <select
          value={currentStatus}
          disabled={isUpdating || statusOptions.length <= 1}
          onChange={(event) => onStatusChange(order?._id, event.target.value)}
          className="select select-bordered select-sm w-[155px]"
          aria-label="Order status"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {isUpdating && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-base-content/60">
            <span className="loading loading-spinner loading-xs" />
            Updating...
          </div>
        )}
      </td>

      {/* ACTION */}

      <td>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onView}
            className="btn btn-square btn-sm btn-ghost"
            title="View order details"
          >
            <FiEye />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ============================================================
// MOBILE ORDER CARD
// ============================================================

const OrderMobileCard = ({
  order,
  onView,
  onStatusChange,
  updatingOrderId,
}) => {
  const customerName = getCustomerName(order);

  const quantity = getOrderQuantity(order);

  const productCount = getProductCount(order);

  const currentStatus = ORDER_STATUSES.includes(order?.status)
    ? order.status
    : "pending";

  const paymentStatus = order?.paymentStatus || "unpaid";

  const isUpdating = String(updatingOrderId) === String(order?._id);

  const statusOptions = getAvailableStatusOptions(currentStatus);

  return (
    <article className="p-4 sm:p-5">
      <div className="space-y-4">
        {/* TOP */}

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {getInitials(customerName)}
            </div>

            <div className="min-w-0">
              <button
                type="button"
                onClick={onView}
                className="block max-w-[220px] truncate text-left font-semibold text-primary hover:underline"
              >
                {order?.orderNumber ||
                  String(order?._id || "").slice(-8) ||
                  "—"}
              </button>

              <p className="truncate text-xs text-base-content/60">
                {customerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onView}
            className="btn btn-square btn-sm btn-ghost shrink-0"
            title="View order"
          >
            <FiEye />
          </button>
        </div>

        {/* ORDER INFO */}

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-base-200/50 p-3">
          <MobileInfo
            label="Date"
            value={formatDate(order?.createdAt)}
            icon={<FiCalendar />}
          />

          <MobileInfo
            label="Items"
            value={`${quantity} item${quantity === 1 ? "" : "s"}`}
            icon={<FiPackage />}
          />

          <MobileInfo
            label="Products"
            value={`${productCount} product${productCount === 1 ? "" : "s"}`}
          />

          <MobileInfo
            label="Payment"
            value={
              PAYMENT_STATUS_LABELS[paymentStatus] || capitalize(paymentStatus)
            }
          />
        </div>

        {/* TOTAL */}

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-base-content/50">Grand Total</p>

            <p className="text-lg font-bold">
              {formatCurrency(getOrderTotal(order))}
            </p>

            <p className="truncate text-xs text-base-content/50">
              {formatPaymentMethod(getPaymentMethod(order))}
            </p>
          </div>

          <span
            className={`badge shrink-0 ${getPaymentStatusBadge(paymentStatus)}`}
          >
            {PAYMENT_STATUS_LABELS[paymentStatus] || capitalize(paymentStatus)}
          </span>
        </div>

        {/* STATUS */}

        <div className="space-y-2">
          <label className="text-xs font-medium text-base-content/60">
            Order Status
          </label>

          <select
            value={currentStatus}
            disabled={isUpdating || statusOptions.length <= 1}
            onChange={(event) => onStatusChange(order?._id, event.target.value)}
            className="select select-bordered w-full"
            aria-label="Order status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {isUpdating && (
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <span className="loading loading-spinner loading-xs" />
              Updating order status...
            </div>
          )}

          {!isUpdating && statusOptions.length <= 1 && (
            <p className="text-[11px] text-base-content/50">
              No further status changes are available.
            </p>
          )}
        </div>

        {/* VIEW DETAILS */}

        <button
          type="button"
          onClick={onView}
          className="btn btn-outline btn-sm w-full gap-2"
        >
          <FiEye />
          View Order Details
        </button>
      </div>
    </article>
  );
};

// ============================================================
// MOBILE INFO
// ============================================================

const MobileInfo = ({ label, value, icon }) => {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[11px] text-base-content/50">
        {icon}

        <span>{label}</span>
      </div>

      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
};

// ============================================================
// EMPTY ORDERS
// ============================================================

const EmptyOrders = ({ hasFilters, onReset }) => {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[320px]">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-200 text-2xl text-base-content/40">
        <FiShoppingBag />
      </div>

      <h3 className="text-lg font-semibold">No orders found</h3>

      <p className="mt-1 max-w-md text-sm text-base-content/60">
        {hasFilters
          ? "No orders match your current search or filters."
          : "There are currently no orders available."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="btn btn-primary btn-sm mt-5"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

// ============================================================
// DESKTOP TABLE SKELETON
// ============================================================

const OrderTableSkeleton = () => {
  return (
    <>
      {Array.from({
        length: 7,
      }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({
            length: 8,
          }).map((_, cellIndex) => (
            <td key={cellIndex}>
              <div className="h-10 animate-pulse rounded bg-base-300" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// ============================================================
// MOBILE CARD SKELETON
// ============================================================

const OrderCardSkeleton = () => {
  return (
    <div className="divide-y divide-base-300">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div key={index} className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-base-300" />

            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-base-300" />

              <div className="h-3 w-24 animate-pulse rounded bg-base-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 animate-pulse rounded-xl bg-base-300" />

            <div className="h-14 animate-pulse rounded-xl bg-base-300" />

            <div className="h-14 animate-pulse rounded-xl bg-base-300" />

            <div className="h-14 animate-pulse rounded-xl bg-base-300" />
          </div>

          <div className="h-10 animate-pulse rounded bg-base-300" />

          <div className="h-10 animate-pulse rounded bg-base-300" />
        </div>
      ))}
    </div>
  );
};

export default AdminOrderList;
