import { useCallback, useContext } from "react";
import { NavLink } from "react-router-dom";

import {
  FaHome,
  FaUsers,
  FaBoxOpen,
  FaPlusCircle,
  FaShoppingBag,
  FaUserCircle,
  FaClipboardList,
  FaHeart,
  FaCog,
  FaSignOutAlt,
  FaShoppingCart,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";

export const adminMenus = [
  {
    title: "Dashboard",
    path: "/dashboard/admin-dashboard",
    icon: FaUserCircle,
  },
  {
    title: "Add Product",
    path: "/dashboard/add-product",
    icon: FaPlusCircle,
  },
  {
    title: "Manage Products",
    path: "/dashboard/manage-products",
    icon: FaBoxOpen,
  },
  {
    title: "Manage Orders",
    path: "/dashboard/manage-orders",
    icon: FaClipboardList,
  },
  {
    title: "All Users",
    path: "/dashboard/all-users",
    icon: FaUsers,
  },
];

// ======================================================
// User Navigation
// ======================================================

export const userMenus = [
  {
    title: "Dashboard",
    path: "/dashboard/user-dashboard",
    icon: FaUserCircle,
  },
  {
    title: "My Orders",
    path: "/dashboard/my-orders",
    icon: FaShoppingBag,
  },
  {
    title: "My-Cart",
    path: "/dashboard/cart",
    icon: FaShoppingCart,
  },
  {
    title: "Wishlist",
    path: "/dashboard/wishlist",
    icon: FaHeart,
  },
  {
    title: "Profile",
    path: "/dashboard/profile",
    icon: FaUserCircle,
  },
];

// ======================================================
// Common Navigation
// ======================================================

export const commonMenus = [
  {
    title: "Home",
    path: "/",
    icon: FaHome,
  },
  {
    title: "Settings",
    path: "/dashboard/settings",
    icon: FaCog,
  },
];

// ======================================================
// NavLink Styles
// ======================================================

const ACTIVE_CLASS =
  "flex items-center gap-3 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-content shadow transition-all duration-200";

const NORMAL_CLASS =
  "flex items-center gap-3 rounded-xl px-4 py-3 text-base-content hover:bg-base-200 hover:text-primary transition-all duration-200";

// ======================================================
// Dashboard Sidebar Component
// ======================================================

const DashboardSidebar = ({ closeDrawer }) => {
  // ======================================================
  // Auth Context
  // ======================================================

  const { user, role, loading, signOutUser } = useContext(AuthContext);

  // ======================================================
  // Close Mobile Drawer
  // ======================================================

  const handleCloseDrawer = useCallback(() => {
    const drawer = document.getElementById("dashboard-drawer");

    if (drawer) {
      drawer.checked = false;
    }

    closeDrawer?.();
  }, [closeDrawer]);

  // ======================================================
  // Logout
  // ======================================================

  const handleLogout = useCallback(async () => {
    try {
      await signOutUser();
      handleCloseDrawer();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  }, [signOutUser, handleCloseDrawer]);

  // ======================================================
  // Render Navigation Item
  // ======================================================

  const renderNavItem = ({ title, path, icon: Icon }) => (
    <li key={path}>
      <NavLink
        to={path}
        onClick={handleCloseDrawer}
        className={({ isActive }) => (isActive ? ACTIVE_CLASS : NORMAL_CLASS)}
      >
        <Icon className="text-lg shrink-0" />

        <span>{title}</span>
      </NavLink>
    </li>
  );

  // ======================================================
  // Loading State
  // ======================================================

  if (loading) {
    return (
      <aside className="flex w-72 items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </aside>
    );
  }

  // ======================================================
  // Part 2 Starts Here...
  // ======================================================
  return (
    <aside className="flex h-full w-72 flex-col bg-base-100 shadow-xl">
      {/* ====================================================== */}
      {/* Logo Section */}
      {/* ====================================================== */}

      <div className="border-b border-base-300 px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-content shadow-lg">
            📱
          </div>

          <div>
            <h2 className="text-xl font-bold text-base-content">MobileHub</h2>

            <p className="text-sm text-base-content/60">Smart Phone Store</p>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* User Profile */}
      {/* ====================================================== */}

      <div className="border-b border-base-300 px-6 py-5">
        <div className="flex items-center gap-4">
          {user?.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="h-14 w-14 rounded-full border-2 border-primary object-cover"
            />
          ) : (
            <div className="avatar placeholder">
              <div className="h-14 w-14 rounded-full bg-primary text-primary-content">
                <span className="text-lg font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">
              {user?.name || "Guest User"}
            </h3>

            <p className="truncate text-sm text-base-content/60">
              {user?.email}
            </p>

            <div className="mt-2">
              <span
                className={`badge badge-sm font-medium ${
                  role === "admin" ? "badge-primary" : "badge-success"
                }`}
              >
                {role === "admin" ? "Administrator" : "Customer"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* Navigation */}
      {/* ====================================================== */}

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {/* ================= Admin Navigation ================= */}

        {role === "admin" && (
          <div className="mb-8">
            <h4 className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-base-content/50">
              Administration
            </h4>

            <ul className="space-y-2">{adminMenus.map(renderNavItem)}</ul>
          </div>
        )}

        {/* ================= User Navigation ================= */}

        {role === "user" && (
          <div className="mb-8">
            <h4 className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-base-content/50">
              Customer
            </h4>

            <ul className="space-y-2">{userMenus.map(renderNavItem)}</ul>
          </div>
        )}

        {/* ================= Common Navigation ================= */}

        <div>
          <h4 className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-base-content/50">
            General
          </h4>

          <ul className="space-y-2">{commonMenus.map(renderNavItem)}</ul>
        </div>
      </nav>

      {/* ====================================================== */}
      {/* Footer */}
      {/* ====================================================== */}

      <div className="border-t border-base-300 p-5">
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-error w-full justify-start gap-3 rounded-xl"
        >
          <FaSignOutAlt className="text-lg" />
          Logout
        </button>

        <div className="divider my-5"></div>

        <div className="space-y-2 text-center">
          <p className="text-xs font-medium text-base-content/70">
            MobileHub Dashboard
          </p>

          <div className="badge badge-outline badge-sm">Version 1.0.0</div>

          <p className="text-[11px] text-base-content/50">
            © {new Date().getFullYear()}
            <br />
            MobileHub. All Rights Reserved.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
