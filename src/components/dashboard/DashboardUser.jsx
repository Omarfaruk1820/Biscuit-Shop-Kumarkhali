import { useContext, useMemo } from "react";
import { Link } from "react-router";
import axios from "axios";
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

const API_URL = import.meta.env.VITE_API_URL;

const DashboardUser = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const email = user?.email || "";

  // ==========================================================
  // ORDERS
  // ==========================================================

  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["my-orders", email],
    enabled: Boolean(email) && !authLoading && Boolean(API_URL),
    staleTime: 1000 * 60,

    queryFn: async () => {
      const response = await axios.get(`${API_URL}/orders/my`, {
        withCredentials: true,
      });

      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
  });

  // ==========================================================
  // CART
  // ==========================================================

  const {
    data: cart = [],
    isLoading: cartLoading,
    isError: cartError,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ["cart", email],
    enabled: Boolean(email) && !authLoading && Boolean(API_URL),
    staleTime: 1000 * 30,

    queryFn: async () => {
      const response = await axios.get(`${API_URL}/carts`, {
        withCredentials: true,
      });

      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
  });

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getOrderStatus = (order) => {
    return String(order?.status || "pending").toLowerCase();
  };

  const getPaymentStatus = (order) => {
    return String(
      order?.payment?.status || order?.paymentStatus || "pending",
    ).toLowerCase();
  };

  /*
   * Your MongoDB order structure is:
   *
   * subtotal
   * totalDiscount
   * shipping
   * tax
   * grandTotal
   *
   * Therefore grandTotal is the correct value to display
   * as the final order amount.
   */
  const getOrderTotal = (order) => {
    const value = Number(
      order?.grandTotal ?? order?.summary?.grandTotal ?? order?.total ?? 0,
    );

    return Number.isFinite(value) ? value : 0;
  };

  /*
   * totalItems = number of different products.
   * totalQuantity = actual quantity of all products.
   *
   * Your database already contains totalItems and totalQuantity,
   * so use those values first.
   */
  const getOrderItems = (order) => {
    const totalItems = Number(order?.totalItems ?? order?.summary?.totalItems);

    if (Number.isFinite(totalItems)) {
      return totalItems;
    }

    if (Array.isArray(order?.items)) {
      return order.items.length;
    }

    return 0;
  };

  const getOrderQuantity = (order) => {
    const totalQuantity = Number(
      order?.totalQuantity ?? order?.summary?.totalQuantity,
    );

    if (Number.isFinite(totalQuantity)) {
      return totalQuantity;
    }

    if (Array.isArray(order?.items)) {
      return order.items.reduce((total, item) => {
        const quantity = Number(item?.quantity ?? 1);

        return total + (Number.isFinite(quantity) ? quantity : 0);
      }, 0);
    }

    return 0;
  };

  const getOrderId = (order) => {
    return order?._id ? String(order._id) : "";
  };

  const getOrderNumber = (order) => {
    if (order?.orderNumber) {
      return String(order.orderNumber);
    }

    const orderId = getOrderId(order);

    return orderId ? `#${orderId.slice(-8)}` : "#ORDER";
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "badge-warning";

      case "confirmed":
        return "badge-info";

      case "processing":
        return "badge-info";

      case "packed":
        return "badge-secondary";

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
        return "bg-info text-info-content";

      case "processing":
        return "bg-info text-info-content";

      case "packed":
        return "bg-secondary text-secondary-content";

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

      case "packed":
        return <FaBox />;

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

  const formatCurrency = (value) => {
    const amount = Number(value);

    return `৳${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
  };

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeCart = Array.isArray(cart) ? cart : [];

    const totalOrders = safeOrders.length;

    const pendingOrders = safeOrders.filter(
      (order) => getOrderStatus(order) === "pending",
    ).length;

    const confirmedOrders = safeOrders.filter(
      (order) => getOrderStatus(order) === "confirmed",
    ).length;

    const processingOrders = safeOrders.filter(
      (order) => getOrderStatus(order) === "processing",
    ).length;

    const packedOrders = safeOrders.filter(
      (order) => getOrderStatus(order) === "packed",
    ).length;

    const shippedOrders = safeOrders.filter(
      (order) => getOrderStatus(order) === "shipped",
    ).length;

    const deliveredOrders = safeOrders.filter(
      (order) => getOrderStatus(order) === "delivered",
    ).length;

    const cancelledOrders = safeOrders.filter(
      (order) => getOrderStatus(order) === "cancelled",
    ).length;

    /*
     * IMPORTANT:
     * Do not use order.total here.
     * Your MongoDB documents use grandTotal.
     */
    const totalSpent = safeOrders
      .filter((order) => getOrderStatus(order) !== "cancelled")
      .reduce((total, order) => {
        return total + getOrderTotal(order);
      }, 0);

    const cartItems = safeCart.reduce((total, item) => {
      const quantity = Number(item?.quantity ?? item?.qty ?? 1);

      return total + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);

    const recentOrders = [...safeOrders]
      .sort((a, b) => {
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      packedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalSpent,
      cartItems,
      recentOrders,
    };
  }, [orders, cart]);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = () => {
    refetchOrders();
    refetchCart();
  };

  // ==========================================================
  // LOADING / ERROR
  // ==========================================================

  const isLoading = authLoading || ordersLoading || cartLoading;
  const hasError = ordersError || cartError;

  // ==========================================================
  // USER DATA
  // ==========================================================

  const userName = user?.name || "Customer";
  const userEmail = user?.email || "";

  const userPhoto =
    user?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName,
    )}&background=2563eb&color=fff`;

  // ==========================================================
  // LOADING UI
  // ==========================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-base-300" />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-base-300"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-base-300" />
      </div>
    );
  }

  // ==========================================================
  // ERROR UI
  // ==========================================================

  if (hasError) {
    return (
      <div className="hero rounded-3xl bg-base-200 py-20">
        <div className="hero-content text-center">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold text-error">
              Failed to Load Dashboard
            </h2>

            <p className="mt-4 text-base-content/70">
              Something went wrong while loading your dashboard data.
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="btn btn-primary mt-8"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <div className="space-y-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-base-content md:text-4xl">
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
            className="btn btn-primary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ======================================================
          USER HERO
      ====================================================== */}

      <section className="rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent p-6 text-primary-content shadow-xl md:p-8">
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
              Manage your orders, track deliveries, review your shopping cart
              and manage your account from one place.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/my-orders" className="btn btn-neutral">
                <FaClipboardList />
                My Orders
              </Link>

              <Link
                to="/products"
                className="btn border-white  hover:bg-white hover:text-primary"
              >
                <FaShoppingBag />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* USER CARD */}

          <div className="flex justify-center">
            <div className="card w-full max-w-sm bg-base-100 text-base-content shadow-2xl">
              <div className="card-body items-center text-center">
                <img
                  src={userPhoto}
                  alt={userName}
                  className="h-28 w-28 rounded-full border-4 border-primary object-cover"
                />

                <h3 className="mt-4 text-2xl font-bold">{userName}</h3>

                <p className="break-all text-sm text-base-content/70">
                  {userEmail}
                </p>

                <div className="divider my-2" />

                <div className="grid w-full grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-base-content/60">
                      Role
                    </p>

                    <span className="badge badge-primary mt-2 capitalize">
                      {user?.role || "user"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-base-content/60">
                      Status
                    </p>

                    <span
                      className={`badge mt-2 ${
                        user?.status === "active"
                          ? "badge-success"
                          : "badge-error"
                      }`}
                    >
                      {user?.status || "active"}
                    </span>
                  </div>
                </div>

                <div className="divider my-2" />

                <div className="w-full space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Total Orders</span>

                    <span className="font-bold">{statistics.totalOrders}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-base-content/70">Cart Items</span>

                    <span className="font-bold">{statistics.cartItems}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-base-content/70">Member Since</span>

                    <span className="text-sm font-bold">
                      {user?.createdAt
                        ? moment(user.createdAt).format("DD MMM YYYY")
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          MAIN STATISTICS
      ====================================================== */}

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>

          <span className="text-sm text-base-content/60">
            Your shopping statistics
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* TOTAL ORDERS */}

          <div className="card bg-primary text-primary-content shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Orders</p>

                  <h3 className="mt-2 text-4xl font-bold">
                    {statistics.totalOrders}
                  </h3>
                </div>

                <FaClipboardList className="text-5xl opacity-80" />
              </div>
            </div>
          </div>

          {/* PENDING */}

          <div className="card bg-warning text-warning-content shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Pending</p>

                  <h3 className="mt-2 text-4xl font-bold">
                    {statistics.pendingOrders}
                  </h3>
                </div>

                <FaClock className="text-5xl opacity-80" />
              </div>
            </div>
          </div>

          {/* DELIVERED */}

          <div className="card bg-success text-success-content shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Delivered</p>

                  <h3 className="mt-2 text-4xl font-bold">
                    {statistics.deliveredOrders}
                  </h3>
                </div>

                <FaCheckCircle className="text-5xl opacity-80" />
              </div>
            </div>
          </div>

          {/* TOTAL SPENDING */}

          <div className="card bg-secondary text-secondary-content shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Spending</p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {formatCurrency(statistics.totalSpent)}
                  </h3>
                </div>

                <FaMoneyBillWave className="text-5xl opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          SECONDARY STATISTICS
      ====================================================== */}

      <section className="grid grid-cols-2 gap-5 lg:grid-cols-5">
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <FaClock className="text-4xl text-warning" />

            <h3 className="text-2xl font-bold">
              {statistics.processingOrders}
            </h3>

            <p className="text-sm text-base-content/70">Processing</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <FaBox className="text-4xl text-info" />

            <h3 className="text-2xl font-bold">{statistics.packedOrders}</h3>

            <p className="text-sm text-base-content/70">Packed</p>
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
          <Link
            to="/products"
            className="card bg-base-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="card-body">
              <FaShoppingBag className="text-5xl text-primary" />

              <h3 className="text-xl font-bold">Browse Products</h3>

              <p className="text-base-content/70">
                Discover products and available offers.
              </p>

              <div className="card-actions justify-end">
                <FaArrowRight />
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/my-orders"
            className="card bg-base-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="card-body">
              <FaClipboardList className="text-5xl text-secondary" />

              <h3 className="text-xl font-bold">My Orders</h3>

              <p className="text-base-content/70">
                View and manage your orders.
              </p>

              <div className="card-actions justify-end">
                <FaArrowRight />
              </div>
            </div>
          </Link>

          <Link
            to="/cart"
            className="card bg-base-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="card-body">
              <FaShoppingCart className="text-5xl text-success" />

              <h3 className="text-xl font-bold">Shopping Cart</h3>

              <p className="text-base-content/70">
                Review your cart before checkout.
              </p>

              <div className="card-actions justify-end">
                <FaArrowRight />
              </div>
            </div>
          </Link>

          <Link
            to="/dashboard/profile"
            className="card bg-base-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="card-body">
              <FaUserCircle className="text-5xl text-info" />

              <h3 className="text-xl font-bold">My Profile</h3>

              <p className="text-base-content/70">
                Update your personal information.
              </p>

              <div className="card-actions justify-end">
                <FaArrowRight />
              </div>
            </div>
          </Link>

          <Link
            to="/contact"
            className="card bg-base-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="card-body">
              <FaMapMarkerAlt className="text-5xl text-error" />

              <h3 className="text-xl font-bold">Contact Support</h3>

              <p className="text-base-content/70">
                Need help? Contact our support team.
              </p>

              <div className="card-actions justify-end">
                <FaArrowRight />
              </div>
            </div>
          </Link>

          <Link
            to="/wishlist"
            className="card bg-base-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="card-body">
              <FaHeart className="text-5xl text-pink-500" />

              <h3 className="text-xl font-bold">Wishlist</h3>

              <p className="text-base-content/70">
                Save your favourite products for later.
              </p>

              <div className="card-actions justify-end">
                <FaArrowRight />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ======================================================
          ORDER STATUS SUMMARY
      ====================================================== */}

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Order Status Summary</h2>

          <p className="text-base-content/70">
            A quick overview of your current order status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* PENDING */}

          <div className="card border border-warning/30 bg-warning/10 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Pending Orders</p>

                  <h3 className="mt-2 text-4xl font-bold text-warning">
                    {statistics.pendingOrders}
                  </h3>
                </div>

                <div className="rounded-2xl bg-warning p-4 text-warning-content">
                  <FaClock className="text-3xl" />
                </div>
              </div>

              <progress
                className="progress progress-warning mt-5"
                value={statistics.pendingOrders}
                max={statistics.totalOrders || 1}
              />

              <p className="text-xs text-base-content/60">
                Awaiting confirmation
              </p>
            </div>
          </div>

          {/* PROCESSING */}

          <div className="card border border-info/30 bg-info/10 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Processing</p>

                  <h3 className="mt-2 text-4xl font-bold text-info">
                    {statistics.processingOrders}
                  </h3>
                </div>

                <div className="rounded-2xl bg-info p-4 text-info-content">
                  <FaTruck className="text-3xl" />
                </div>
              </div>

              <progress
                className="progress progress-info mt-5"
                value={statistics.processingOrders}
                max={statistics.totalOrders || 1}
              />

              <p className="text-xs text-base-content/60">
                Preparing for shipment
              </p>
            </div>
          </div>

          {/* DELIVERED */}

          <div className="card border border-success/30 bg-success/10 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Delivered</p>

                  <h3 className="mt-2 text-4xl font-bold text-success">
                    {statistics.deliveredOrders}
                  </h3>
                </div>

                <div className="rounded-2xl bg-success p-4 text-success-content">
                  <FaCheckCircle className="text-3xl" />
                </div>
              </div>

              <progress
                className="progress progress-success mt-5"
                value={statistics.deliveredOrders}
                max={statistics.totalOrders || 1}
              />

              <p className="text-xs text-base-content/60">
                Successfully delivered
              </p>
            </div>
          </div>

          {/* CANCELLED */}

          <div className="card border border-error/30 bg-error/10 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Cancelled</p>

                  <h3 className="mt-2 text-4xl font-bold text-error">
                    {statistics.cancelledOrders}
                  </h3>
                </div>

                <div className="rounded-2xl bg-error p-4 text-error-content">
                  <FaTimesCircle className="text-3xl" />
                </div>
              </div>

              <progress
                className="progress progress-error mt-5"
                value={statistics.cancelledOrders}
                max={statistics.totalOrders || 1}
              />

              <p className="text-xs text-base-content/60">Orders cancelled</p>
            </div>
          </div>
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

              <div className="text-right">
                <h2 className="text-4xl font-extrabold text-success">
                  {statistics.totalOrders
                    ? Math.round(
                        (statistics.deliveredOrders / statistics.totalOrders) *
                          100,
                      )
                    : 0}
                  %
                </h2>

                <p className="text-sm text-base-content/60">Delivery Success</p>
              </div>
            </div>

            <progress
              className="progress progress-success mt-6 h-4 w-full"
              value={statistics.deliveredOrders}
              max={statistics.totalOrders || 1}
            />

            <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
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
                <p className="text-xs text-base-content/60">Processing</p>

                <h4 className="text-xl font-bold text-info">
                  {statistics.processingOrders}
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

        <div className="hidden overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-xl lg:block">
          {statistics.recentOrders.length === 0 ? (
            <div className="p-16 text-center">
              <FaShoppingBag className="mx-auto text-6xl text-base-content/20" />

              <h3 className="mt-5 text-2xl font-bold">No Orders Yet</h3>

              <p className="mt-2 text-base-content/60">
                You have not placed any orders yet.
              </p>

              <Link to="/products" className="btn btn-primary mt-5">
                Browse Products
              </Link>
            </div>
          ) : (
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
                {statistics.recentOrders.map((order, index) => {
                  const status = getOrderStatus(order);
                  const paymentStatus = getPaymentStatus(order);
                  const total = getOrderTotal(order);
                  const totalItems = getOrderItems(order);
                  const totalQuantity = getOrderQuantity(order);
                  const orderId = getOrderId(order);
                  const orderNumber = getOrderNumber(order);

                  return (
                    <tr key={orderId || `${orderNumber}-${index}`}>
                      <td className="font-semibold">{index + 1}</td>

                      <td>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{orderNumber}</p>

                          <p className="text-xs text-base-content/60">
                            {order?.invoiceNumber || "Invoice Pending"}
                          </p>
                        </div>
                      </td>

                      <td>
                        {order?.createdAt
                          ? moment(order.createdAt).format("DD MMM YYYY")
                          : "--"}
                      </td>

                      <td>
                        <div className="flex flex-col">
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
                          className={`badge capitalize ${getStatusClass(
                            status,
                          )}`}
                        >
                          {status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge capitalize ${
                            paymentStatus === "paid"
                              ? "badge-success"
                              : paymentStatus === "pending"
                                ? "badge-warning"
                                : "badge-error"
                          }`}
                        >
                          {paymentStatus.replaceAll("_", " ")}
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* MOBILE */}

        <div className="space-y-5 lg:hidden">
          {statistics.recentOrders.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center py-14 text-center">
                <FaShoppingBag className="text-6xl text-base-content/20" />

                <h3 className="mt-5 text-2xl font-bold">No Orders Yet</h3>

                <p className="max-w-md text-base-content/70">
                  You have not placed any orders yet.
                </p>

                <Link to="/products" className="btn btn-primary mt-5">
                  Browse Products
                  <FaArrowRight />
                </Link>
              </div>
            </div>
          ) : (
            statistics.recentOrders.map((order) => {
              const status = getOrderStatus(order);
              const paymentStatus = getPaymentStatus(order);
              const total = getOrderTotal(order);
              const totalItems = getOrderItems(order);
              const totalQuantity = getOrderQuantity(order);
              const orderId = getOrderId(order);

              return (
                <div
                  key={orderId}
                  className="card border border-base-200 bg-base-100 shadow-xl"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold">
                          {getOrderNumber(order)}
                        </h3>

                        <p className="text-xs text-base-content/60">
                          {order?.invoiceNumber || "Invoice Pending"}
                        </p>
                      </div>

                      <span
                        className={`badge shrink-0 capitalize ${getStatusClass(
                          status,
                        )}`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="divider my-1" />

                    <div className="space-y-3">
                      <div className="flex justify-between gap-4">
                        <span className="text-base-content/60">Order Date</span>

                        <span className="font-medium">
                          {order?.createdAt
                            ? moment(order.createdAt).format("DD MMM YYYY")
                            : "--"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-2">
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
                          className={`badge capitalize ${
                            paymentStatus === "paid"
                              ? "badge-success"
                              : paymentStatus === "pending"
                                ? "badge-warning"
                                : "badge-error"
                          }`}
                        >
                          {paymentStatus.replaceAll("_", " ")}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-base-content/60">
                          Grand Total
                        </span>

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

                            const itemSubtotal = Number(
                              item?.subtotal ??
                                item?.finalPrice ??
                                item?.price ??
                                0,
                            );

                            return (
                              <div
                                key={item?.productId || item?._id || index}
                                className="flex items-center gap-3"
                              >
                                {item?.image ? (
                                  <img
                                    src={item.image}
                                    alt={item?.name || "Product"}
                                    className="h-14 w-14 rounded-lg object-cover"
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
                                    Qty:{" "}
                                    {Number.isFinite(quantity) ? quantity : 1}
                                  </p>
                                </div>

                                <span className="font-bold">
                                  {formatCurrency(itemSubtotal)}
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
                      <Link
                        to="/dashboard/my-orders"
                        className="btn btn-primary btn-sm"
                      >
                        View
                      </Link>

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
                    </div>
                  </div>
                </div>
              );
            })
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

        <div className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body">
            {statistics.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FaClipboardList className="mb-4 text-6xl text-base-content/20" />

                <h3 className="text-2xl font-bold">No Recent Activity</h3>

                <p className="mt-2 max-w-md text-base-content/60">
                  Your order activity will appear here after you place your
                  first order.
                </p>
              </div>
            ) : (
              <ul className="timeline timeline-vertical">
                {statistics.recentOrders.map((order, index) => {
                  const status = getOrderStatus(order);

                  const timeline =
                    Array.isArray(order?.timeline) && order.timeline.length > 0
                      ? order.timeline
                      : [
                          {
                            status,
                            message: `Order ${status}`,
                            time: order?.updatedAt || order?.createdAt,
                          },
                        ];

                  const latest = timeline[timeline.length - 1];

                  const orderId = getOrderId(order);

                  return (
                    <li key={orderId || index}>
                      {index !== 0 && <hr />}

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
                              className={`badge capitalize ${getStatusClass(
                                status,
                              )}`}
                            >
                              {status.replaceAll("_", " ")}
                            </span>
                          </div>

                          <div className="space-y-1 ">
                            <p>
                              <span className="font-semibold">Items:</span>{" "}
                              {getOrderItems(order)}
                            </p>

                            <p>
                              <span className="font-semibold">
                                Grand Total:
                              </span>{" "}
                              {formatCurrency(getOrderTotal(order))}
                            </p>
                          </div>

                          <div className="divider my-2" />

                          <div>
                            <p className="font-semibold">Latest Update</p>

                            <p className="mt-1 text-base-content/70">
                              {latest?.message || `Order ${status}`}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-base-content/60">
                            <span>
                              {latest?.time
                                ? moment(latest.time).format("DD MMM YYYY")
                                : "--"}
                            </span>

                            <span>
                              {latest?.time
                                ? moment(latest.time).format("hh:mm A")
                                : "--"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Link
                              to="/dashboard/my-orders"
                              className="btn btn-primary btn-xs"
                            >
                              Details
                            </Link>

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
                          </div>
                        </div>
                      </div>

                      {index !==
                        Math.min(statistics.recentOrders.length, 5) - 1 && (
                        <hr />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardUser;
