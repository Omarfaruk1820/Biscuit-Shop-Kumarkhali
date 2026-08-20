import { useContext, useMemo, useState } from "react";

import { Link, NavLink, useNavigate } from "react-router-dom";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaBars,
  FaTimes,
  FaHome,
  FaBoxOpen,
  FaInfoCircle,
  FaPhone,
  FaShoppingCart,
  FaUser,
  FaSignOutAlt,
  FaChartLine,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";

import axiosSecure from "../../hooks/axiosSecure";

import { useToast } from "../../context/ToastProvider";

import MarqueeBar from "../home/MarqueeBar";

// ============================================================
// CONFIG
// ============================================================

const REQUEST_TIMEOUT = 15000;

const CART_STALE_TIME = 1000 * 60 * 2;

const CART_GC_TIME = 1000 * 60 * 10;

// ============================================================
// NAVBAR
// ============================================================

const Navbar = () => {
  // ==========================================================
  // AUTH CONTEXT
  // ==========================================================

  const { user, loading: authLoading, logOutUser } = useContext(AuthContext);

  // ==========================================================
  // ROUTER / QUERY / TOAST
  // ==========================================================

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { addToast } = useToast();

  // ==========================================================
  // MOBILE MENU
  // ==========================================================

  const [isOpen, setIsOpen] = useState(false);

  // ==========================================================
  // USER DATA
  //
  // AuthProvider gets the user from:
  //
  // GET /auth/me
  //
  // Therefore we use the database user object.
  // ==========================================================

  const email = useMemo(() => {
    return String(user?.email || "")
      .trim()
      .toLowerCase();
  }, [user?.email]);

  const userName = useMemo(() => {
    return String(user?.name || user?.displayName || "").trim() || "User";
  }, [user?.name, user?.displayName]);

  const userPhoto = useMemo(() => {
    return String(user?.photo || user?.photoURL || "").trim();
  }, [user?.photo, user?.photoURL]);

  const userRole = useMemo(() => {
    return String(user?.role || "user")
      .trim()
      .toLowerCase();
  }, [user?.role]);

  const userStatus = useMemo(() => {
    return String(user?.status || "active")
      .trim()
      .toLowerCase();
  }, [user?.status]);

  // ==========================================================
  // AUTH STATUS
  // ==========================================================

  const isLoggedIn =
    !authLoading && Boolean(user) && Boolean(email) && userStatus === "active";

  const isAdmin = userRole === "admin";

  // ==========================================================
  // CART
  //
  // Authentication is handled by HTTP-only cookie.
  //
  // Do NOT manually send email/user ID here.
  // ==========================================================

  const { data: cartResponse, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],

    enabled: isLoggedIn,

    queryFn: async () => {
      const response = await axiosSecure.get("/carts", {
        withCredentials: true,
        timeout: REQUEST_TIMEOUT,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to load cart.");
      }

      return response.data;
    },

    staleTime: CART_STALE_TIME,

    gcTime: CART_GC_TIME,

    retry: false,

    refetchOnWindowFocus: false,

    refetchOnReconnect: true,
  });

  // ==========================================================
  // CART ITEMS
  // ==========================================================

  const cartItems = Array.isArray(cartResponse?.data) ? cartResponse.data : [];

  // ==========================================================
  // CART COUNT
  // ==========================================================

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const quantity = Number(item?.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return total;
      }

      return total + quantity;
    }, 0);
  }, [cartItems]);

  const formattedCartCount = cartCount > 99 ? "99+" : cartCount;

  // ==========================================================
  // MOBILE MENU
  // ==========================================================

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen((previous) => !previous);
  };

  // ==========================================================
  // LOGOUT
  //
  // IMPORTANT:
  //
  // AuthProvider provides:
  //
  // logOutUser()
  //
  // NOT signOutUser()
  // ==========================================================

  const handleLogout = async () => {
    if (!isLoggedIn) {
      closeMenu();
      return;
    }

    try {
      await logOutUser();

      // Remove cached cart data after logout.
      queryClient.removeQueries({
        queryKey: ["cart"],
      });

      closeMenu();

      addToast("Logout successful. See you again! 👋", "success");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "NAVBAR LOGOUT ERROR:",
        error?.response?.data || error?.message || error,
      );

      addToast(
        error?.response?.data?.message ||
          error?.message ||
          "Logout failed. Please try again.",
        "error",
      );
    }
  };

  // ==========================================================
  // IMAGE ERROR
  // ==========================================================

  const handleImageError = (event) => {
    event.currentTarget.style.display = "none";
  };

  // ==========================================================
  // NAV LINK CLASS
  // ==========================================================

  const navLinkClass = ({ isActive }) =>
    [
      "flex",
      "items-center",
      "gap-2",
      "rounded-lg",
      "px-3",
      "py-2",
      "font-medium",
      "whitespace-nowrap",
      "transition-all",
      "duration-200",

      isActive
        ? "bg-amber-500 text-white shadow-md"
        : "text-gray-700 hover:bg-amber-50 hover:text-amber-600",
    ].join(" ");

  // ==========================================================
  // PUBLIC LINKS
  // ==========================================================

  const publicLinks = (
    <>
      <NavLink to="/" onClick={closeMenu} className={navLinkClass}>
        <FaHome aria-hidden="true" />

        <span>Home</span>
      </NavLink>

      <NavLink to="/products" onClick={closeMenu} className={navLinkClass}>
        <FaBoxOpen aria-hidden="true" />

        <span>Shop</span>
      </NavLink>

      <NavLink to="/about" onClick={closeMenu} className={navLinkClass}>
        <FaInfoCircle aria-hidden="true" />

        <span>About</span>
      </NavLink>

      <NavLink to="/contact" onClick={closeMenu} className={navLinkClass}>
        <FaPhone aria-hidden="true" />

        <span>Contact</span>
      </NavLink>
    </>
  );

  // ==========================================================
  // AUTHENTICATED LINKS
  // ==========================================================

  const authenticatedLinks = isLoggedIn ? (
    <>
      <NavLink to="/dashboard" onClick={closeMenu} className={navLinkClass}>
        <FaChartLine aria-hidden="true" />

        <span>Dashboard</span>
      </NavLink>

      {isAdmin && (
        <NavLink
          to="/dashboard/admin"
          onClick={closeMenu}
          className={navLinkClass}
        >
          <FaChartLine aria-hidden="true" />

          <span>Admin</span>
        </NavLink>
      )}
    </>
  ) : null;

  // ==========================================================
  // LOADING NAVBAR
  // ==========================================================

  if (authLoading) {
    return (
      <>
        <MarqueeBar />

        <nav
          className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm"
          aria-label="Main navigation loading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* LOGO SKELETON */}

              <div className="h-8 w-36 animate-pulse rounded-lg bg-gray-200" />

              {/* DESKTOP SKELETON */}

              <div className="hidden items-center gap-3 lg:flex">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-9 w-20 animate-pulse rounded-lg bg-gray-200"
                  />
                ))}
              </div>

              {/* USER SKELETON */}

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />

                <div className="hidden h-10 w-24 animate-pulse rounded-lg bg-gray-200 sm:block" />
              </div>
            </div>
          </div>
        </nav>
      </>
    );
  }

  // ==========================================================
  // NAVBAR
  // ==========================================================

  return (
    <>
      <MarqueeBar />

      <nav
        className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md"
        aria-label="Main navigation"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* ==================================================
              NAVBAR MAIN ROW
          ================================================== */}

          <div className="flex min-h-16 items-center justify-between gap-3">
            {/* =================================================
                LOGO
            ================================================= */}

            <Link
              to="/"
              onClick={closeMenu}
              className="shrink-0 text-xl font-bold text-amber-600 transition hover:text-amber-700 sm:text-2xl"
              aria-label="Biscuit Shop home"
            >
              Biscuit Shop
            </Link>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}

            <div className="hidden items-center gap-1 lg:flex xl:gap-2">
              {publicLinks}

              {authenticatedLinks}
            </div>

            {/* =================================================
                DESKTOP RIGHT SIDE
            ================================================= */}

            <div className="hidden items-center gap-3 lg:flex">
              {/* ==============================================
                  CART
              ============================================== */}

              {isLoggedIn && (
                <Link
                  to="/cart"
                  onClick={closeMenu}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-amber-50"
                  aria-label={`Shopping cart${
                    cartCount > 0 ? `, ${cartCount} items` : ""
                  }`}
                >
                  <FaShoppingCart
                    className={`text-xl transition ${
                      cartLoading
                        ? "text-gray-400"
                        : "text-gray-700 group-hover:text-amber-500"
                    }`}
                    aria-hidden="true"
                  />

                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {formattedCartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* ==============================================
                  LOGGED-IN USER
              ============================================== */}

              {isLoggedIn ? (
                <div className="dropdown dropdown-end">
                  {/* USER BUTTON */}

                  <div
                    tabIndex={0}
                    role="button"
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-gray-50"
                    aria-label="Open user menu"
                  >
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt={`${userName} profile`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        className="h-10 w-10 rounded-full border-2 border-amber-500 object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-600"
                        aria-hidden="true"
                      >
                        <FaUser />
                      </div>
                    )}

                    <div className="hidden max-w-44 xl:block">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {userName}
                      </p>

                      <p className="truncate text-xs text-gray-500">{email}</p>
                    </div>
                  </div>

                  {/* USER DROPDOWN */}

                  <ul
                    tabIndex={0}
                    className="dropdown-content menu z-[999] mt-4 w-72 rounded-2xl border border-base-200 bg-base-100 p-2 shadow-xl"
                  >
                    {/* USER INFORMATION */}

                    <li className="pointer-events-none">
                      <div className="flex items-center gap-3 rounded-xl p-3">
                        {userPhoto ? (
                          <img
                            src={userPhoto}
                            alt={`${userName} profile`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={handleImageError}
                            className="h-12 w-12 shrink-0 rounded-full border-2 border-amber-500 object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-600"
                            aria-hidden="true"
                          >
                            <FaUser />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-800">
                            {userName}
                          </p>

                          <p className="break-all text-xs text-gray-500">
                            {email}
                          </p>

                          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                            {userRole}
                          </span>
                        </div>
                      </div>
                    </li>

                    <div className="divider my-1" />

                    {/* PROFILE */}

                    <li>
                      <Link to="/profile" onClick={closeMenu}>
                        <FaUser aria-hidden="true" />

                        <span>Profile</span>
                      </Link>
                    </li>

                    {/* DASHBOARD */}

                    <li>
                      <Link to="/dashboard" onClick={closeMenu}>
                        <FaChartLine aria-hidden="true" />

                        <span>Dashboard</span>
                      </Link>
                    </li>

                    {/* ADMIN */}

                    {isAdmin && (
                      <li>
                        <Link to="/dashboard/admin" onClick={closeMenu}>
                          <FaChartLine aria-hidden="true" />

                          <span>Admin Panel</span>
                        </Link>
                      </li>
                    )}

                    {/* CART */}

                    <li>
                      <Link to="/cart" onClick={closeMenu}>
                        <FaShoppingCart aria-hidden="true" />

                        <span>Cart</span>

                        {cartCount > 0 && (
                          <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                            {formattedCartCount}
                          </span>
                        )}
                      </Link>
                    </li>

                    <div className="divider my-1" />

                    {/* LOGOUT */}

                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <FaSignOutAlt aria-hidden="true" />

                        <span>Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                /* ============================================
                   LOGIN / REGISTER
                ============================================ */

                <div className="flex items-center gap-2 xl:gap-3">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="rounded-lg border border-amber-500 px-4 py-2 font-medium text-amber-600 transition hover:bg-amber-500 hover:text-white"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition hover:bg-amber-600"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={toggleMenu}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl text-gray-700 transition hover:bg-amber-50 hover:text-amber-600 lg:hidden"
              aria-label={
                isOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* ====================================================
            MOBILE NAVIGATION
        ==================================================== */}

        <div
          id="mobile-navigation"
          className={`overflow-hidden border-t border-gray-200 transition-all duration-300 lg:hidden ${
            isOpen
              ? "max-h-[calc(100vh-4rem)] opacity-100"
              : "max-h-0 border-t-0 opacity-0"
          }`}
        >
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto bg-white px-4 py-5 sm:px-6">
            {/* =================================================
                MOBILE USER
            ================================================= */}

            {isLoggedIn && (
              <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-3">
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt={`${userName} profile`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      className="h-14 w-14 shrink-0 rounded-full border-2 border-amber-500 object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 bg-white text-xl text-amber-600"
                      aria-hidden="true"
                    >
                      <FaUser />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-gray-800">
                      {userName}
                    </p>

                    <p className="break-all text-sm text-gray-500">{email}</p>

                    <span className="mt-1 inline-block rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                MOBILE LINKS
            ================================================= */}

            <div className="flex flex-col gap-1">
              {publicLinks}

              {authenticatedLinks}

              {/* CART */}

              {isLoggedIn && (
                <NavLink
                  to="/cart"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  <FaShoppingCart aria-hidden="true" />

                  <span>Cart</span>

                  {cartCount > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      {formattedCartCount}
                    </span>
                  )}
                </NavLink>
              )}
            </div>

            {/* =================================================
                MOBILE LOGIN / REGISTER
            ================================================= */}

            {!isLoggedIn && (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center rounded-lg border border-amber-500 px-4 py-3 font-medium text-amber-600 transition hover:bg-amber-500 hover:text-white"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex items-center justify-center rounded-lg bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600"
                >
                  Register
                </Link>
              </div>
            )}

            {/* =================================================
                MOBILE LOGOUT
            ================================================= */}

            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <FaSignOutAlt aria-hidden="true" />

                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
