import { useContext } from "react";
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
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";

const DashboardSidebar = ({ closeDrawer }) => {
  const { user, role, loading, logOut } = useContext(AuthContext);

  // ===========================
  // Drawer Close Helper
  // ===========================
  const handleCloseDrawer = () => {
    const drawer = document.getElementById("dashboard-drawer");

    if (drawer) {
      drawer.checked = false;
    }

    closeDrawer?.();
  };

  // ===========================
  // Logout Handler
  // ===========================
  const handleLogout = async () => {
    try {
      await logOut?.();
      handleCloseDrawer();
    } catch (error) {
      console.error(error);
    }
  };

  // ===========================
  // Active / Normal Styles
  // ===========================
  const activeClass =
    "flex items-center gap-3 rounded-xl bg-primary text-primary-content shadow-md px-4 py-3 font-semibold transition-all duration-300";

  const normalClass =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-base-content hover:bg-base-200 hover:translate-x-1 transition-all duration-300";

  // ===========================
  // Admin Menu
  // ===========================
  const adminMenus = [
    {
      title: "Dashboard",
      path: "/dashboard/admin",
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
      title: "All Orders",
      path: "/dashboard/all-orders",
      icon: FaClipboardList,
    },
    {
      title: "All Users",
      path: "/dashboard/all-users",
      icon: FaUsers,
    },
  ];

  // ===========================
  // Customer Menu
  // ===========================
  const userMenus = [
    {
      title: "Dashboard",
      path: "/dashboard/user",
      icon: FaUserCircle,
    },
    {
      title: "My Orders",
      path: "/dashboard/my-orders",
      icon: FaShoppingBag,
    },
    {
      title: "Wishlist",
      path: "/dashboard/wishlist",
      icon: FaHeart,
    },
    {
      title: "My Profile",
      path: "/dashboard/profile",
      icon: FaUserCircle,
    },
    {
      title: "Order Details",
      path: "/dashboard/orders-detail",
      icon: FaClipboardList,
    },
  ];

  // ===========================
  // Common Menu
  // ===========================
  const commonMenus = [
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

  // ===========================
  // Render Menu Items
  // ===========================
  const renderMenuItems = (menus) =>
    menus.map(({ title, path, icon: Icon }) => (
      <li key={path}>
        <NavLink
          to={path}
          onClick={handleCloseDrawer}
          className={({ isActive }) => (isActive ? activeClass : normalClass)}
        >
          <Icon className="text-lg shrink-0" />
          <span>{title}</span>
        </NavLink>
      </li>
    ));

  // ===========================
  // Loading State
  // ===========================
  if (loading) {
    return (
      <aside className="w-64 h-screen bg-base-100 border-r border-base-300 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-primary"></span>

          <p className="text-sm text-base-content">Loading Dashboard...</p>
        </div>
      </aside>
    );
  }

  // ===========================
  // Part 2 Starts Here
  // ===========================

  return (
    <>
      <aside className="w-64 lg:w-72 h-screen sticky top-0 bg-base-100 border-r border-base-300 shadow-xl flex flex-col">
        {/* ===========================
        Sidebar Header
    ============================ */}
        <div className="px-6 py-5 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-content flex items-center justify-center text-2xl font-bold shadow-md">
              📱
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary leading-none">
                MobileHub
              </h2>

              <p className="text-xs text-base-content/70">Smart Phone Store</p>
            </div>
          </div>

          {/* Role Badge */}

          <div className="mt-4">
            <span
              className={`badge badge-md font-semibold ${
                role === "admin" ? "badge-primary" : "badge-success"
              }`}
            >
              {role === "admin" ? "Administrator" : "Customer"}
            </span>
          </div>
        </div>

        {/* ===========================
        User Profile Card
    ============================ */}

        <div className="px-5 py-5 border-b border-base-300">
          <div className="flex items-center gap-4">
            {/* Avatar */}

            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user?.displayName || "User"}
                className="w-14 h-14 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-14">
                  <span className="text-lg font-bold">
                    {user?.displayName
                      ? user.displayName.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                </div>
              </div>
            )}

            {/* User Info */}

            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">
                {user?.displayName || "Guest User"}
              </h3>

              <p className="text-xs text-base-content/60 truncate">
                {user?.email}
              </p>

              <div className="mt-2">
                <span
                  className={`badge badge-sm ${
                    role === "admin" ? "badge-primary" : "badge-success"
                  }`}
                >
                  {role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===========================
        Navigation
    ============================ */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {/* ADMIN */}

          {role === "admin" && (
            <div className="mb-7">
              <h4 className="menu-title text-xs uppercase tracking-widest text-base-content/60 mb-2 px-2">
                Administrator
              </h4>

              <ul className="menu gap-2">{renderMenuItems(adminMenus)}</ul>
            </div>
          )}

          {/* CUSTOMER */}

          <div className="mb-7">
            <h4 className="menu-title text-xs uppercase tracking-widest text-base-content/60 mb-2 px-2">
              Customer
            </h4>

            <ul className="menu gap-2">{renderMenuItems(userMenus)}</ul>
          </div>

          {/* GENERAL */}

          <div>
            <h4 className="menu-title text-xs uppercase tracking-widest text-base-content/60 mb-2 px-2">
              General
            </h4>

            <ul className="menu gap-2">{renderMenuItems(commonMenus)}</ul>
          </div>
        </nav>
        {/* ===========================
          Sidebar Footer
      ============================ */}
        <div className="border-t border-base-300 p-4 space-y-3 bg-base-100">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-error btn-outline w-full justify-start gap-3 rounded-xl"
          >
            <FaSignOutAlt className="text-lg" />
            Logout
          </button>

          {/* Divider */}
          <div className="divider my-1"></div>

          {/* Version */}
          <div className="text-center space-y-2">
            <p className="text-xs text-base-content/60">MobileHub Dashboard</p>

            <div className="badge badge-outline badge-sm">Version 1.0.0</div>

            {/* Optional Social Links */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-hover text-base-content/60 hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                Facebook
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-hover text-base-content/60 hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                GitHub
              </a>
            </div>

            {/* Copyright */}
            <p className="text-[11px] text-base-content/50 pt-2">
              © {new Date().getFullYear()} MobileHub.
              <br />
              All Rights Reserved.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
