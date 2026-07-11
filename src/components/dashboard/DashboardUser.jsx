// ======================================================
// DashboardUser.jsx
// Part 1
// Imports + Hooks + Queries + Statistics
// ======================================================

import { useContext, useMemo } from "react";
import { Link } from "react-router";
import axios from "axios";

import moment from "moment";

import { useQuery } from "@tanstack/react-query";

import {
  FaBox,
  FaShoppingCart,
  FaMoneyBillWave,
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaUserCircle,
  FaArrowRight,
  FaShoppingBag,
  FaClipboardList,
  FaHeart,
  FaMapMarkerAlt,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";

// ======================================================
// API
// ======================================================

const API = import.meta.env.VITE_API_URL;

// ======================================================
// Component
// ======================================================

const DashboardUser = () => {
  const { user, loading } = useContext(AuthContext);

  const email = user?.email;

  // ====================================================
  // User Profile
  // ====================================================

  const {
    data: profile = {},
    isLoading: profileLoading,
    isError: profileError,
    refetch: profileRefetch,
  } = useQuery({
    queryKey: ["profile", email],

    enabled: !!email && !loading,

    queryFn: async () => {
      const { data } = await axios.get(`${API}/users/${email}`, {
        withCredentials: true,
      });

      return data.data;
    },
  });

  // ====================================================
  // My Orders
  // ====================================================

  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: ordersRefetch,
  } = useQuery({
    queryKey: ["my-orders", email],

    enabled: !!email && !loading,

    queryFn: async () => {
      const { data } = await axios.get(`${API}/orders/my`, {
        withCredentials: true,
      });

      return data.data;
    },
  });

  // ====================================================
  // Cart
  // ====================================================

  const {
    data: cart = [],
    isLoading: cartLoading,
    refetch: cartRefetch,
  } = useQuery({
    queryKey: ["cart", email],

    enabled: !!email && !loading,

    queryFn: async () => {
      const { data } = await axios.get(`${API}/carts`, {
        withCredentials: true,
      });

      return data.data;
    },
  });

  // ====================================================
  // Loading
  // ====================================================

  const isLoading = loading || profileLoading || ordersLoading || cartLoading;

  // ====================================================
  // Error
  // ====================================================

  const hasError = profileError || ordersError;

  // ====================================================
  // Statistics
  // ====================================================

  const statistics = useMemo(() => {
    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
      (order) => order.status === "pending",
    ).length;

    const confirmedOrders = orders.filter(
      (order) => order.status === "confirmed",
    ).length;

    const processingOrders = orders.filter(
      (order) => order.status === "processing",
    ).length;

    const packedOrders = orders.filter(
      (order) => order.status === "packed",
    ).length;

    const shippedOrders = orders.filter(
      (order) => order.status === "shipped",
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered",
    ).length;

    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled",
    ).length;

    const totalSpent = orders
      .filter((order) => order.status !== "cancelled")
      .reduce(
        (sum, order) => sum + (order.summary?.grandTotal ?? order.total ?? 0),
        0,
      );

    const cartItems = cart.length;

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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

  // ====================================================
  // Refresh Dashboard
  // ====================================================

  const handleRefresh = () => {
    profileRefetch();
    ordersRefetch();
    cartRefetch();
  };

  // ====================================================
  // Loading UI
  // ====================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-3xl bg-base-300 animate-pulse"></div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="h-36 rounded-2xl bg-base-300 animate-pulse"
            />
          ))}
        </div>

        <div className="h-96 rounded-2xl bg-base-300 animate-pulse"></div>
      </div>
    );
  }

  // ====================================================
  // Error UI
  // ====================================================

  if (hasError) {
    return (
      <div className="hero rounded-3xl bg-base-200 py-20">
        <div className="hero-content text-center">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold text-error">
              Failed to Load Dashboard
            </h2>

            <p className="mt-4 text-base-content/70">
              Something went wrong while loading your dashboard.
            </p>

            <button onClick={handleRefresh} className="btn btn-primary mt-8">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // Part 2 Starts Below
  // ====================================================
  // ====================================================
  // Dashboard UI
  // Part 2
  // Header + Welcome Banner + User Profile
  // ====================================================

  return (
    <div className="space-y-8">
      {/* ================================================= */}
      {/* Dashboard Header */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-base-content">
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

          <button onClick={handleRefresh} className="btn btn-primary">
            Refresh
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* Welcome Banner */}
      {/* ================================================= */}

      <div className="rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent p-8 text-primary-content shadow-xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <FaUserCircle className="text-5xl" />

              <div>
                <h2 className="text-3xl font-bold">
                  Hello, {profile?.name || user?.displayName || "Customer"}
                  👋
                </h2>

                <p className="opacity-90">Welcome back to your dashboard.</p>
              </div>
            </div>

            <p className="max-w-2xl text-sm md:text-base opacity-90">
              You can monitor your recent orders, track shipments, download
              invoices, manage your profile and view your shopping activity from
              one place.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/my-orders" className="btn btn-neutral">
                <FaClipboardList />
                My Orders
              </Link>

              <Link
                to="/products"
                className="btn btn-outline text-white border-white hover:bg-white hover:text-primary"
              >
                <FaShoppingBag />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right */}

          <div className="flex justify-center">
            <div className="card w-full max-w-sm bg-base-100 text-base-content shadow-2xl">
              <div className="card-body items-center text-center">
                <img
                  src={
                    profile?.photo ||
                    user?.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile?.name || user?.displayName || "User",
                    )}&background=2563eb&color=fff`
                  }
                  alt="User"
                  className="h-28 w-28 rounded-full border-4 border-primary object-cover"
                />

                <h3 className="mt-4 text-2xl font-bold">
                  {profile?.name || user?.displayName || "Customer"}
                </h3>

                <p className="text-sm text-base-content/70 break-all">
                  {profile?.email || user?.email}
                </p>

                <div className="divider my-2"></div>

                <div className="grid w-full grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs uppercase text-base-content/60">
                      Role
                    </h4>

                    <span className="badge badge-primary mt-2">
                      {profile?.role || "User"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase text-base-content/60">
                      Status
                    </h4>

                    <span
                      className={`badge mt-2 ${
                        profile?.status === "active"
                          ? "badge-success"
                          : "badge-error"
                      }`}
                    >
                      {profile?.status || "Active"}
                    </span>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">Total Orders</span>

                    <span className="font-bold">{statistics.totalOrders}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">Cart Items</span>

                    <span className="font-bold">{statistics.cartItems}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">Member Since</span>

                    <span className="font-bold text-sm">
                      {profile?.createdAt
                        ? moment(profile.createdAt).format("DD MMM YYYY")
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* Part 3 Starts Below */}
      {/* Statistics Cards + Quick Actions */}
      {/* ================================================= */}
      {/* ================================================= */}
      {/* Statistics Cards */}
      {/* ================================================= */}

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>

          <span className="text-sm text-base-content/60">
            Your shopping statistics
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Orders */}

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

          {/* Pending */}

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

          {/* Delivered */}

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

          {/* Total Spent */}

          <div className="card bg-secondary text-secondary-content shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Spending</p>

                  <h3 className="mt-2 text-3xl font-bold">
                    ৳{statistics.totalSpent.toFixed(2)}
                  </h3>
                </div>

                <FaMoneyBillWave className="text-5xl opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Order Status Cards */}
      {/* ================================================= */}

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
            <FaBox className="text-4xl text-error" />

            <h3 className="text-2xl font-bold">{statistics.cancelledOrders}</h3>

            <p className="text-sm text-base-content/70">Cancelled</p>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Quick Actions */}
      {/* ================================================= */}

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Quick Actions</h2>

          <span className="text-sm text-base-content/60">
            Frequently used pages
          </span>
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
                Discover our latest products and offers.
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
                View all your previous and current orders.
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

      {/* ================================================= */}
      {/* Part 4 Starts Below */}
      {/* Recent Orders Table + Mobile Cards */}
      {/* ================================================= */}
      {/* ================================================= */}
      {/* Recent Orders */}
      {/* Part 4A */}
      {/* Desktop Table */}
      {/* ================================================= */}

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

        {/* ============================================ */}
        {/* Desktop Table */}
        {/* ============================================ */}

        <div className="hidden overflow-x-auto rounded-2xl border border-base-300 bg-base-100 shadow-xl lg:block">
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
                const status = order.status || "pending";

                const paymentStatus =
                  order.payment?.status || order.paymentStatus || "unpaid";

                const total = order.summary?.grandTotal ?? order.total ?? 0;

                const totalItems =
                  order.summary?.totalItems ?? order.items?.length ?? 0;

                return (
                  <tr key={order._id}>
                    <td className="font-semibold">{index + 1}</td>

                    {/* ================================= */}

                    <td>
                      <div className="space-y-1">
                        <div className="font-bold">
                          {order.orderNumber || `#${order._id.slice(-8)}`}
                        </div>

                        <div className="text-xs text-base-content/60">
                          {order.invoiceNumber || "Invoice Pending"}
                        </div>
                      </div>
                    </td>

                    {/* ================================= */}

                    <td>
                      <div className="space-y-1">
                        <div>
                          {moment(order.createdAt).format("DD MMM YYYY")}
                        </div>

                        <div className="text-xs text-base-content/60">
                          {moment(order.createdAt).format("hh:mm A")}
                        </div>
                      </div>
                    </td>

                    {/* ================================= */}

                    <td>
                      <span className="badge badge-outline">
                        {totalItems} Items
                      </span>
                    </td>

                    {/* ================================= */}

                    <td>
                      <span className="font-bold text-primary">
                        ৳{Number(total).toFixed(2)}
                      </span>
                    </td>

                    {/* ================================= */}

                    <td>
                      <span
                        className={`badge capitalize
                          ${
                            status === "pending"
                              ? "badge-warning"
                              : status === "confirmed"
                                ? "badge-info"
                                : status === "processing"
                                  ? "badge-info"
                                  : status === "packed"
                                    ? "badge-secondary"
                                    : status === "shipped"
                                      ? "badge-primary"
                                      : status === "delivered"
                                        ? "badge-success"
                                        : "badge-error"
                          }`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </td>

                    {/* ================================= */}

                    <td>
                      <span
                        className={`badge
                          ${
                            paymentStatus === "paid"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                      >
                        {paymentStatus}
                      </span>
                    </td>

                    {/* ================================= */}

                    <td>
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Link
                          to={`/dashboard/my-orders`}
                          className="btn btn-xs btn-primary"
                        >
                          View
                        </Link>

                        <Link
                          to={`/dashboard/track-order/${order._id}`}
                          className="btn btn-xs btn-info"
                        >
                          Track
                        </Link>

                        <Link
                          to={`/dashboard/invoice/${order._id}`}
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
        </div>

        {/* ================================================= */}
        {/* Part 4B Starts Below */}
        {/* Mobile Order Cards */}
        {/* ================================================= */}
        {/* ================================================ */}
        {/* Mobile Cards */}
        {/* ================================================ */}

        <div className="space-y-5 lg:hidden">
          {statistics.recentOrders.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center py-14 text-center">
                <FaShoppingBag className="text-6xl text-base-content/30" />

                <h3 className="mt-5 text-2xl font-bold">No Orders Yet</h3>

                <p className="max-w-md text-base-content/70">
                  You haven't placed any orders yet. Start shopping to see your
                  recent orders here.
                </p>

                <Link to="/products" className="btn btn-primary mt-5">
                  Browse Products
                  <FaArrowRight />
                </Link>
              </div>
            </div>
          ) : (
            statistics.recentOrders.map((order) => {
              const status = order.status || "pending";

              const paymentStatus =
                order.payment?.status || order.paymentStatus || "unpaid";

              const grandTotal = order.summary?.grandTotal ?? order.total ?? 0;

              const totalItems =
                order.summary?.totalItems ?? order.items?.length ?? 0;

              return (
                <div
                  key={order._id}
                  className="card bg-base-100 shadow-xl border border-base-200"
                >
                  <div className="card-body">
                    {/* ============================ */}
                    {/* Header */}
                    {/* ============================ */}

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          {order.orderNumber || `#${order._id.slice(-8)}`}
                        </h3>

                        <p className="text-xs text-base-content/60">
                          {order.invoiceNumber || "Invoice Pending"}
                        </p>
                      </div>

                      <span
                        className={`badge capitalize
                        ${
                          status === "pending"
                            ? "badge-warning"
                            : status === "confirmed"
                              ? "badge-info"
                              : status === "processing"
                                ? "badge-info"
                                : status === "packed"
                                  ? "badge-secondary"
                                  : status === "shipped"
                                    ? "badge-primary"
                                    : status === "delivered"
                                      ? "badge-success"
                                      : "badge-error"
                        }`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="divider my-1"></div>

                    {/* ============================ */}
                    {/* Information */}
                    {/* ============================ */}

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-base-content/60">Order Date</span>

                        <span className="font-medium">
                          {moment(order.createdAt).format("DD MMM YYYY")}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-base-content/60">Items</span>

                        <span className="font-medium">{totalItems}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-base-content/60">Payment</span>

                        <span
                          className={`badge ${
                            paymentStatus === "paid"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {paymentStatus}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-base-content/60">
                          Grand Total
                        </span>

                        <span className="font-bold text-primary">
                          ৳{Number(grandTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="divider my-2"></div>

                    {/* ============================ */}
                    {/* Products Preview */}
                    {/* ============================ */}

                    <div className="space-y-3">
                      {order.items?.slice(0, 2).map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-14 w-14 rounded-lg object-cover"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="truncate font-semibold">
                              {item.name}
                            </h4>

                            <p className="text-sm text-base-content/60">
                              Qty : {item.quantity}
                            </p>
                          </div>

                          <span className="font-bold">৳{item.subtotal}</span>
                        </div>
                      ))}

                      {order.items?.length > 2 && (
                        <p className="text-center text-sm text-base-content/60">
                          +{order.items.length - 2} more item(s)
                        </p>
                      )}
                    </div>

                    <div className="divider my-2"></div>

                    {/* ============================ */}
                    {/* Actions */}
                    {/* ============================ */}

                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        to="/dashboard/my-orders"
                        className="btn btn-primary btn-sm"
                      >
                        View
                      </Link>

                      <Link
                        to={`/dashboard/track-order/${order._id}`}
                        className="btn btn-info btn-sm"
                      >
                        Track
                      </Link>

                      <Link
                        to={`/dashboard/invoice/${order._id}`}
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

      {/* ================================================= */}
      {/* Part 5 Starts Below */}
      {/* Order Analytics + Timeline + Dashboard Closing */}
      {/* ================================================= */}
    </div>
  );

  {
    /* ================================================= */
  }
  {
    /* Order Status Summary */
  }
  {
    /* Part 5A-1 */
  }
  {
    /* ================================================= */
  }

  <section className="space-y-6">
    <div className="flex flex-col gap-2">
      <h2 className="text-2xl font-bold">Order Status Summary</h2>

      <p className="text-base-content/70">
        A quick overview of all your orders and their current status.
      </p>
    </div>

    {/* ========================================== */}
    {/* Status Cards */}
    {/* ========================================== */}

    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {/* Pending */}

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
          ></progress>

          <p className="text-xs text-base-content/60">Awaiting confirmation</p>
        </div>
      </div>

      {/* Processing */}

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
          ></progress>

          <p className="text-xs text-base-content/60">Preparing for shipment</p>
        </div>
      </div>

      {/* Delivered */}

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
          ></progress>

          <p className="text-xs text-base-content/60">Successfully delivered</p>
        </div>
      </div>

      {/* Cancelled */}

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
          ></progress>

          <p className="text-xs text-base-content/60">Orders cancelled</p>
        </div>
      </div>
    </div>

    {/* ========================================== */}
    {/* Overall Progress */}
    {/* ========================================== */}

    <div className="card bg-base-100 shadow-xl border border-base-300">
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
                    (statistics.deliveredOrders / statistics.totalOrders) * 100,
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
        ></progress>

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
  </section>;

  {
    /* ================================================= */
  }
  {
    /* Part 5A-2 Starts Below */
  }
  {
    /* Activity Timeline */
  }
  {
    /* ================================================= */
  }
  {
    /* ================================================= */
  }
  {
    /* Activity Timeline */
  }
  {
    /* Part 5A-2 */
  }
  {
    /* ================================================= */
  }

  <section className="space-y-6">
    <div className="flex flex-col gap-2">
      <h2 className="text-2xl font-bold">Recent Order Activity</h2>

      <p className="text-base-content/70">
        Track your latest order activities and current delivery progress.
      </p>
    </div>

    <div className="card bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body">
        {statistics.recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FaClipboardList className="text-6xl text-base-content/20 mb-4" />

            <h3 className="text-2xl font-bold">No Recent Activity</h3>

            <p className="mt-2 text-base-content/60 max-w-md">
              Your order activity timeline will appear here after you place your
              first order.
            </p>
          </div>
        ) : (
          <ul className="timeline timeline-snap-icon timeline-vertical">
            {statistics.recentOrders.slice(0, 6).map((order, index) => {
              const status = order.status || "pending";

              const timeline = order.timeline?.length
                ? order.timeline
                : [
                    {
                      status,
                      message: `Order ${status}`,
                      time: order.updatedAt || order.createdAt,
                    },
                  ];

              const latest = timeline[timeline.length - 1];

              const badgeClass =
                status === "delivered"
                  ? "bg-success text-success-content"
                  : status === "cancelled"
                    ? "bg-error text-error-content"
                    : status === "processing"
                      ? "bg-info text-info-content"
                      : status === "shipped"
                        ? "bg-primary text-primary-content"
                        : status === "pending"
                          ? "bg-warning text-warning-content"
                          : "bg-secondary text-secondary-content";

              return (
                <li key={order._id}>
                  {index !== 0 && <hr />}

                  <div className="timeline-middle">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${badgeClass}`}
                    >
                      {status === "pending" && <FaClock className="text-lg" />}

                      {status === "processing" && (
                        <FaBoxOpen className="text-lg" />
                      )}

                      {status === "shipped" && <FaTruck className="text-lg" />}

                      {status === "delivered" && (
                        <FaCheckCircle className="text-lg" />
                      )}

                      {status === "cancelled" && (
                        <FaTimesCircle className="text-lg" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`timeline-${
                      index % 2 === 0 ? "start" : "end"
                    } timeline-box bg-base-100 shadow-lg border border-base-300`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-lg">
                          {order.orderNumber ||
                            `#${order._id.toString().slice(-8)}`}
                        </h3>

                        <span
                          className={`badge capitalize
                                  ${
                                    status === "pending"
                                      ? "badge-warning"
                                      : status === "processing"
                                        ? "badge-info"
                                        : status === "shipped"
                                          ? "badge-primary"
                                          : status === "delivered"
                                            ? "badge-success"
                                            : "badge-error"
                                  }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-semibold">Customer :</span>{" "}
                          {order.customer?.name}
                        </p>

                        <p>
                          <span className="font-semibold">Items :</span>{" "}
                          {order.items?.length || 0}
                        </p>

                        <p>
                          <span className="font-semibold">Grand Total :</span> ৳
                          {order.summary?.grandTotal ?? order.total}
                        </p>
                      </div>

                      <div className="divider my-2"></div>

                      <div>
                        <p className="font-semibold">Latest Update</p>

                        <p className="text-base-content/70 mt-1">
                          {latest.message}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-base-content/60">
                        <span>{moment(latest.time).format("DD MMM YYYY")}</span>

                        <span>{moment(latest.time).format("hh:mm A")}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Link
                          to={`/dashboard/my-orders`}
                          className="btn btn-primary btn-xs"
                        >
                          Details
                        </Link>

                        <Link
                          to={`/dashboard/track-order/${order._id}`}
                          className="btn btn-info btn-xs"
                        >
                          Track
                        </Link>

                        <Link
                          to={`/dashboard/invoice/${order._id}`}
                          className="btn btn-success btn-xs"
                        >
                          Invoice
                        </Link>
                      </div>
                    </div>
                  </div>

                  {index !== statistics.recentOrders.slice(0, 6).length - 1 && (
                    <hr />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  </section>;

  {
    /* ================================================= */
  }
  {
    /* Part 5B Starts Below */
  }
  {
    /* Account Overview + Final Dashboard Closing */
  }
  {
    /* ================================================= */
  }
};
export default DashboardUser;
