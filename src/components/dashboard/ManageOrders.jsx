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
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";

import { AuthContext } from "../../Auth/AuthProvider";
import axiosSecure from "../../hooks/axiosSecure";

const ORDERS_PER_PAGE = 10;
const REQUEST_TIMEOUT = 15000;

const STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Amount" },
  { value: "lowest", label: "Lowest Amount" },
];

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

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

const getOrderTotal = (order) => {
  return Number(order?.grandTotal ?? order?.total ?? 0);
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

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const ManageOrders = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

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

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [toast, setToast] = useState(null);

  const toastTimerRef = useRef(null);

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
  // FETCH ORDERS
  // ============================================================

  const fetchOrders = useCallback(
    async ({
      page = 1,
      currentSearch = search,
      currentStatus = status,
      currentPaymentStatus = paymentStatus,
      currentSort = sort,
    } = {}) => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiRequest({
          method: "GET",
          url: "/orders",
          params: {
            page,
            limit: ORDERS_PER_PAGE,
            search: currentSearch,
            status: currentStatus,
            paymentStatus: currentPaymentStatus,
            sort: currentSort,
          },
        });

        const responseData = response?.data || {};

        const nextOrders = Array.isArray(responseData?.data)
          ? responseData.data
          : [];

        const nextPagination = responseData?.pagination || {};

        setOrders(nextOrders);

        setPagination({
          page: Number(nextPagination?.page) || page,
          limit: Number(nextPagination?.limit) || ORDERS_PER_PAGE,
          totalOrders: Number(nextPagination?.totalOrders) || 0,
          totalPages: Number(nextPagination?.totalPages) || 0,
          hasNextPage: Boolean(nextPagination?.hasNextPage),
          hasPrevPage: Boolean(nextPagination?.hasPrevPage),
        });
      } catch (error) {
        console.error("FETCH ORDERS ERROR:", error);

        setOrders([]);
        setError(getApiErrorMessage(error, "Failed to load orders."));
      } finally {
        setLoading(false);
      }
    },
    [apiRequest, paymentStatus, search, sort, status, user],
  );

  // ============================================================
  // FETCH STATS
  // ============================================================

  const fetchStats = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError("");

      const response = await apiRequest({
        method: "GET",
        url: "/orders/stats",
      });

      const data = response?.data?.data || {};

      setStats({
        totalOrders: Number(data?.totalOrders) || 0,
        pendingOrders: Number(data?.pendingOrders) || 0,
        confirmedOrders: Number(data?.confirmedOrders) || 0,
        processingOrders: Number(data?.processingOrders) || 0,
        shippedOrders: Number(data?.shippedOrders) || 0,
        deliveredOrders: Number(data?.deliveredOrders) || 0,
        cancelledOrders: Number(data?.cancelledOrders) || 0,
        totalRevenue: Number(data?.totalRevenue) || 0,
      });
    } catch (error) {
      console.error("FETCH ORDER STATS ERROR:", error);

      setStatsError(
        getApiErrorMessage(error, "Failed to load order statistics."),
      );
    } finally {
      setStatsLoading(false);
    }
  }, [apiRequest, user]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (authLoading || !user) {
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

  // ============================================================
  // SEARCH
  // ============================================================

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

  // ============================================================
  // STATUS FILTER
  // ============================================================

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

  // ============================================================
  // PAYMENT FILTER
  // ============================================================

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

  // ============================================================
  // SORT
  // ============================================================

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

  // ============================================================
  // RESET FILTERS
  // ============================================================

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

  // ============================================================
  // PAGE CHANGE
  // ============================================================

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === pagination.page
    ) {
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

  // ============================================================
  // ORDER DETAILS
  // ============================================================

  const fetchOrderDetails = useCallback(
    async (orderId) => {
      if (!orderId) {
        return;
      }

      try {
        setDetailsLoading(true);

        const response = await apiRequest({
          method: "GET",
          url: `/orders/${orderId}`,
        });

        const order = response?.data?.data;

        if (order) {
          setSelectedOrder(order);
        }
      } catch (error) {
        console.error("FETCH ORDER DETAILS ERROR:", error);

        showToast(
          "error",
          getApiErrorMessage(error, "Failed to load order details."),
        );
      } finally {
        setDetailsLoading(false);
      }
    },
    [apiRequest, showToast],
  );

  const handleOpenOrder = (order) => {
    if (!order?._id) {
      return;
    }

    setSelectedOrder(order);
    fetchOrderDetails(order._id);
  };

  const handleCloseOrder = () => {
    if (updatingOrderId) {
      return;
    }

    setSelectedOrder(null);
  };

  // ============================================================
  // UPDATE ORDER STATUS
  // ============================================================

  const handleOrderStatusUpdate = async (orderId, nextStatus) => {
    if (!orderId || !nextStatus) {
      return;
    }

    if (updatingOrderId === orderId) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);

      const response = await apiRequest({
        method: "PATCH",
        url: `/orders/status/${orderId}`,
        data: {
          status: nextStatus,
        },
      });

      const updatedOrder = response?.data?.data || {};

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order?._id === orderId
            ? {
                ...order,
                ...updatedOrder,
                status: updatedOrder?.status || nextStatus,
              }
            : order,
        ),
      );

      setSelectedOrder((currentOrder) =>
        currentOrder?._id === orderId
          ? {
              ...currentOrder,
              ...updatedOrder,
              status: updatedOrder?.status || nextStatus,
            }
          : currentOrder,
      );

      showToast(
        "success",
        response?.data?.message || "Order status updated successfully.",
      );

      await fetchStats();
    } catch (error) {
      console.error("UPDATE ORDER STATUS ERROR:", error);

      showToast(
        "error",
        getApiErrorMessage(error, "Failed to update order status."),
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    if (!user) {
      return;
    }

    await Promise.all([
      fetchOrders({
        page: pagination.page,
        currentSearch: search,
        currentStatus: status,
        currentPaymentStatus: paymentStatus,
        currentSort: sort,
      }),
      fetchStats(),
    ]);

    showToast("success", "Order data refreshed.");
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const paginationPages = useMemo(() => {
    const totalPages = Number(pagination.totalPages) || 0;
    const currentPage = Number(pagination.page) || 1;

    if (!totalPages) {
      return [];
    }

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
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
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index,
    );
  }, [pagination.page, pagination.totalPages]);

  const hasActiveFilters =
    Boolean(search) ||
    status !== "all" ||
    paymentStatus !== "all" ||
    sort !== "newest";

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
  // NOT AUTHENTICATED
  // ============================================================

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
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

  // ============================================================
  // UI
  // ============================================================

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
              Manage Orders
            </h1>

            <p className="mt-1 max-w-2xl text-xs text-base-content/60 sm:text-sm">
              Monitor, process and manage customer orders.
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
              className="btn btn-sm w-full sm:w-auto"
            >
              Retry
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
            onClick={() => {
              setStatus("pending");

              fetchOrders({
                page: 1,
                currentSearch: search,
                currentStatus: "pending",
                currentPaymentStatus: paymentStatus,
                currentSort: sort,
              });
            }}
          />

          <StatCard
            title="Processing Orders"
            value={stats.processingOrders}
            icon={<FiPackage />}
            loading={statsLoading}
            onClick={() => {
              setStatus("processing");

              fetchOrders({
                page: 1,
                currentSearch: search,
                currentStatus: "processing",
                currentPaymentStatus: paymentStatus,
                currentSort: sort,
              });
            }}
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
            <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
              <div>
                <h2 className="font-semibold">Order Pipeline</h2>

                <p className="text-xs text-base-content/60 sm:text-sm">
                  Current order status overview
                </p>
              </div>

              <FiTruck className="shrink-0 text-xl text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
              {[
                ["Pending", "pending", stats.pendingOrders],
                ["Confirmed", "confirmed", stats.confirmedOrders],
                ["Processing", "processing", stats.processingOrders],
                ["Shipped", "shipped", stats.shippedOrders],
                ["Delivered", "delivered", stats.deliveredOrders],
              ].map(([label, value, count]) => (
                <PipelineItem
                  key={value}
                  label={label}
                  value={count}
                  status={value}
                  onClick={() => {
                    setStatus(value);

                    fetchOrders({
                      page: 1,
                      currentSearch: search,
                      currentStatus: value,
                      currentPaymentStatus: paymentStatus,
                      currentSort: sort,
                    });
                  }}
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

              <div className="min-w-0">
                <h2 className="font-semibold">Order Management</h2>

                <p className="text-xs text-base-content/60">
                  Search and filter customer orders.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_180px_180px_180px_auto]">
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
                    placeholder="Search order, email, name..."
                    className="input input-bordered join-item w-full min-w-0 pl-10"
                  />
                </div>

                <button type="submit" className="btn btn-primary join-item">
                  Search
                </button>
              </form>

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

              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-ghost border border-base-300 md:col-span-2 xl:col-span-1"
              >
                Reset
              </button>
            </div>

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
                    Payment: {capitalize(paymentStatus)}
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
          <div className="alert alert-error flex-col items-start gap-3 shadow-sm sm:flex-row sm:items-center">
            <FiAlertCircle className="shrink-0" />

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Unable to load orders</h3>

              <p className="break-words text-sm">{error}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchOrders({
                  page: pagination.page,
                  currentSearch: search,
                  currentStatus: status,
                  currentPaymentStatus: paymentStatus,
                  currentSort: sort,
                })
              }
              className="btn btn-sm w-full sm:w-auto"
            >
              Retry
            </button>
          </div>
        )}

        {/* ======================================================
            ORDERS
        ====================================================== */}

        <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm">
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

          {/* DESKTOP TABLE */}

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

          {/* MOBILE / TABLET CARDS */}

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

          {/* PAGINATION */}

          {!loading && orders.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-base-300 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
              <p className="text-center text-xs text-base-content/60 md:text-left sm:text-sm">
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
          ORDER DETAILS MODAL
      ======================================================== */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          loading={detailsLoading}
          updatingOrderId={updatingOrderId}
          onClose={handleCloseOrder}
          onStatusChange={handleOrderStatusUpdate}
        />
      )}

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
// DESKTOP ORDER ROW
// ============================================================

const OrderRow = ({ order, onView, onStatusChange, updatingOrderId }) => {
  const customerName =
    order?.customer?.name || order?.name || "Unknown Customer";

  const quantity = getOrderQuantity(order);
  const productCount = getProductCount(order);

  return (
    <tr className="hover:bg-base-200/40">
      <td>
        <div>
          <button
            type="button"
            onClick={onView}
            className="font-semibold text-primary hover:underline"
          >
            {order?.orderNumber || String(order?._id || "").slice(-8) || "—"}
          </button>

          <p className="mt-1 text-xs text-base-content/50">
            ID: {String(order?._id || "").slice(-8) || "—"}
          </p>
        </div>
      </td>

      <td>
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {getInitials(customerName)}
            </div>
          </div>

          <div className="min-w-0">
            <p className="max-w-[180px] truncate font-medium">{customerName}</p>

            <p className="max-w-[200px] truncate text-xs text-base-content/50">
              {order?.email || order?.customer?.email || "—"}
            </p>
          </div>
        </div>
      </td>

      <td>
        <div className="flex items-center gap-2 text-sm">
          <FiCalendar className="text-base-content/40" />

          {formatDate(order?.createdAt)}
        </div>
      </td>

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

      <td>
        <p className="font-bold">{formatCurrency(getOrderTotal(order))}</p>

        <p className="text-xs text-base-content/50">
          {formatPaymentMethod(
            order?.paymentMethod || order?.customer?.paymentMethod,
          )}
        </p>
      </td>

      <td>
        <span
          className={`badge ${getPaymentStatusBadge(order?.paymentStatus)}`}
        >
          {capitalize(order?.paymentStatus || "unpaid")}
        </span>
      </td>

      <td>
        <select
          value={order?.status || "pending"}
          disabled={updatingOrderId === order?._id}
          onChange={(event) => onStatusChange(order?._id, event.target.value)}
          className="select select-bordered select-sm w-[135px]"
        >
          {STATUS_OPTIONS.filter((option) => option.value !== "all").map(
            (option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
        </select>
      </td>

      <td>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onView}
            className="btn btn-square btn-sm btn-ghost"
            title="View order"
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
  const customerName =
    order?.customer?.name || order?.name || "Unknown Customer";

  const quantity = getOrderQuantity(order);
  const productCount = getProductCount(order);

  return (
    <div className="p-4 sm:p-5">
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
                className="block max-w-[220px] truncate text-left font-semibold text-primary hover:underline sm:max-w-none"
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

        {/* CUSTOMER */}

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
            value={capitalize(order?.paymentStatus || "unpaid")}
          />
        </div>

        {/* TOTAL */}

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-base-content/50">Order Total</p>

            <p className="text-lg font-bold">
              {formatCurrency(getOrderTotal(order))}
            </p>

            <p className="text-xs text-base-content/50">
              {formatPaymentMethod(
                order?.paymentMethod || order?.customer?.paymentMethod,
              )}
            </p>
          </div>

          <span
            className={`badge ${getPaymentStatusBadge(order?.paymentStatus)}`}
          >
            {capitalize(order?.paymentStatus || "unpaid")}
          </span>
        </div>

        {/* STATUS */}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-xs font-medium text-base-content/60">
            Order Status
          </label>

          <select
            value={order?.status || "pending"}
            disabled={updatingOrderId === order?._id}
            onChange={(event) => onStatusChange(order?._id, event.target.value)}
            className="select select-bordered select-sm w-full sm:flex-1"
          >
            {STATUS_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
    </div>
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

      <p className="mt-1 truncate text-sm font-medium">{value || "—"}</p>
    </div>
  );
};

// ============================================================
// ORDER DETAILS MODAL
// ============================================================

const OrderDetailsModal = ({
  order,
  loading,
  updatingOrderId,
  onClose,
  onStatusChange,
}) => {
  const customer = order?.customer || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const timeline = Array.isArray(order?.timeline) ? order.timeline : [];

  return (
    <div className="modal modal-open">
      <div className="modal-box max-h-[95vh] w-11/12 max-w-6xl overflow-hidden p-0 sm:w-11/12">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold sm:text-xl">Order Details</h3>

              <span className="badge badge-outline max-w-full">
                <span className="truncate">{order?.orderNumber || "—"}</span>
              </span>
            </div>

            <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
              Created {formatDateTime(order?.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(updatingOrderId)}
            className="btn btn-circle btn-sm btn-ghost shrink-0"
          >
            <FiX />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center sm:min-h-[400px]">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <div className="max-h-[calc(95vh-140px)] overflow-y-auto p-4 sm:p-5">
            {/* STATUS */}

            <div className="mb-5 rounded-xl border border-base-300 bg-base-200/40 p-4 sm:mb-6 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                    Order Status
                  </p>

                  <span
                    className={`badge badge-lg ${getStatusBadge(
                      order?.status,
                    )}`}
                  >
                    {ORDER_STATUS_LABELS[order?.status] ||
                      capitalize(order?.status)}
                  </span>
                </div>

                <select
                  value={order?.status || "pending"}
                  disabled={updatingOrderId === order?._id}
                  onChange={(event) =>
                    onStatusChange(order?._id, event.target.value)
                  }
                  className="select select-bordered w-full sm:w-auto"
                >
                  {STATUS_OPTIONS.filter(
                    (option) => option.value !== "all",
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CUSTOMER / ORDER INFORMATION */}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
              <div className="rounded-xl border border-base-300 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FiUser className="text-primary" />

                  <h4 className="font-semibold">Customer Information</h4>
                </div>

                <div className="space-y-3 text-sm">
                  <InfoRow label="Name" value={customer?.name} />

                  <InfoRow
                    label="Email"
                    value={order?.email || customer?.email}
                  />

                  <InfoRow
                    label="Phone"
                    value={customer?.phone}
                    icon={<FiPhone />}
                  />

                  <InfoRow label="Address" value={customer?.address} />

                  <InfoRow label="Area" value={customer?.area} />

                  <InfoRow label="City" value={customer?.city} />

                  <InfoRow
                    label="ZIP Code"
                    value={customer?.zip || customer?.postalCode}
                  />

                  {customer?.note && (
                    <div className="border-t border-base-300 pt-3">
                      <p className="mb-1 text-xs text-base-content/50">
                        Customer Note
                      </p>

                      <p className="break-words">{customer.note}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-base-300 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FiPackage className="text-primary" />

                  <h4 className="font-semibold">Order Information</h4>
                </div>

                <div className="space-y-3 text-sm">
                  <InfoRow label="Order Number" value={order?.orderNumber} />

                  <InfoRow
                    label="Payment Method"
                    value={formatPaymentMethod(
                      order?.paymentMethod || customer?.paymentMethod,
                    )}
                  />

                  <InfoRow
                    label="Payment Status"
                    value={capitalize(order?.paymentStatus || "unpaid")}
                  />

                  <InfoRow
                    label="Order Date"
                    value={formatDateTime(order?.createdAt)}
                  />

                  <InfoRow
                    label="Last Updated"
                    value={formatDateTime(order?.updatedAt)}
                  />

                  <InfoRow
                    label="Total Products"
                    value={getProductCount(order)}
                  />

                  <InfoRow
                    label="Total Quantity"
                    value={getOrderQuantity(order)}
                  />
                </div>
              </div>
            </div>

            {/* PRODUCTS */}

            <div className="mt-5 rounded-xl border border-base-300 sm:mt-6">
              <div className="border-b border-base-300 p-4 sm:p-5">
                <h4 className="font-semibold">Ordered Products</h4>
              </div>

              {!items.length ? (
                <div className="p-8 text-center text-sm text-base-content/60">
                  No product items found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table min-w-[700px]">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Discount</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => {
                        const quantity = Number(item?.quantity) || 0;

                        const subtotal =
                          item?.subtotal ??
                          Number(item?.finalPrice || 0) * quantity;

                        return (
                          <tr key={item?.productId || item?.sku || index}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-base-300 bg-base-200">
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

                                <div className="min-w-0">
                                  <p className="font-medium">
                                    {item?.name || "Unknown Product"}
                                  </p>

                                  {item?.brand && (
                                    <p className="text-xs text-base-content/50">
                                      {item.brand}
                                    </p>
                                  )}

                                  {item?.weight && (
                                    <p className="text-xs text-base-content/50">
                                      {item.weight}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>{item?.sku || "—"}</td>

                            <td>{formatCurrency(item?.price)}</td>

                            <td>
                              {Number(item?.discount) > 0 ? (
                                <span className="text-success">
                                  -{item.discount}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="font-medium">{quantity}</td>

                            <td className="font-semibold">
                              {formatCurrency(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ORDER SUMMARY */}

            <div className="mt-5 flex justify-end sm:mt-6">
              <div className="w-full rounded-xl border border-base-300 bg-base-200/30 p-4 sm:max-w-md sm:p-5">
                <h4 className="mb-4 font-semibold">Order Summary</h4>

                <div className="space-y-3 text-sm">
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

                  <div className="my-3 border-t border-base-300" />

                  <div className="flex items-center justify-between gap-4 text-lg font-bold">
                    <span>Grand Total</span>

                    <span className="text-primary">
                      {formatCurrency(getOrderTotal(order))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE */}

            {timeline.length > 0 && (
              <div className="mt-5 rounded-xl border border-base-300 p-4 sm:mt-6 sm:p-5">
                <h4 className="mb-5 font-semibold">Status History</h4>

                <div className="space-y-5">
                  {[...timeline].reverse().map((event, index) => (
                    <div
                      key={`${event?.status}-${index}`}
                      className="flex gap-3 sm:gap-4"
                    >
                      <div className="relative">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${getStatusBadge(
                            event?.status,
                          )}`}
                        >
                          <FiClock />
                        </div>

                        {index !== timeline.length - 1 && (
                          <div className="absolute left-1/2 top-9 h-full w-px -translate-x-1/2 bg-base-300" />
                        )}
                      </div>

                      <div className="min-w-0 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {ORDER_STATUS_LABELS[event?.status] ||
                              capitalize(event?.status)}
                          </span>

                          <span className="text-xs text-base-content/50">
                            {formatDateTime(event?.createdAt)}
                          </span>
                        </div>

                        {event?.note && (
                          <p className="mt-1 break-words text-sm text-base-content/60">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL FOOTER */}

        <div className="modal-action border-t border-base-300 px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(updatingOrderId)}
            className="btn w-full sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>

      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

// ============================================================
// INFO ROW
// ============================================================

const InfoRow = ({ label, value, icon }) => {
  return (
    <div className="flex gap-3 border-b border-base-300 pb-3 last:border-0 last:pb-0">
      {icon && (
        <span className="mt-0.5 shrink-0 text-base-content/40">{icon}</span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs text-base-content/50">{label}</p>

        <p className="break-words font-medium">{value || "—"}</p>
      </div>
    </div>
  );
};

// ============================================================
// SUMMARY ROW
// ============================================================

const SummaryRow = ({ label, value, valueClass = "" }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-base-content/60">{label}</span>

      <span className={`font-medium ${valueClass}`}>{value}</span>
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
      {Array.from({ length: 7 }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: 8 }).map((_, cellIndex) => (
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
      {Array.from({ length: 5 }).map((_, index) => (
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
        </div>
      ))}
    </div>
  );
};

export default ManageOrders;
