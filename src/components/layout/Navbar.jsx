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

const REQUEST_TIMEOUT = 15000;

const CART_STALE_TIME = 1000 * 60 * 2;
const CART_GC_TIME = 1000 * 60 * 10;

const Navbar = () => {
  const { user, loading: authLoading, signOutUser } = useContext(AuthContext);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);

  // ==========================================================
  // USER
  // ==========================================================

  const email = useMemo(
    () =>
      String(user?.email || "")
        .trim()
        .toLowerCase(),
    [user?.email],
  );

  const userName =
    String(user?.name || user?.displayName || "").trim() || "User";

  const userPhoto = String(user?.photo || user?.photoURL || "").trim();

  const userRole = String(user?.role || "user")
    .trim()
    .toLowerCase();

  const userStatus = String(user?.status || "active")
    .trim()
    .toLowerCase();

  // ==========================================================
  // AUTH STATUS
  // ==========================================================

  const isLoggedIn = !authLoading && Boolean(email) && userStatus === "active";

  const isAdmin = userRole === "admin";

  // ==========================================================
  // CART
  //
  // Authentication is handled by the HTTP-only JWT cookie.
  // We do NOT send email manually.
  // ==========================================================

  const { data: cartResponse, isLoading: cartLoading } = useQuery({
    queryKey: ["cart", email],

    enabled: isLoggedIn && Boolean(email),

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

  const cartItems = Array.isArray(cartResponse?.data) ? cartResponse.data : [];

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
  // MENU
  // ==========================================================

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen((previous) => !previous);
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    if (!isLoggedIn) {
      closeMenu();
      return;
    }

    try {
      await signOutUser();

      queryClient.removeQueries({
        queryKey: ["cart", email],
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
        <FaHome />
        <span>Home</span>
      </NavLink>

      <NavLink to="/products" onClick={closeMenu} className={navLinkClass}>
        <FaBoxOpen />
        <span>Shop</span>
      </NavLink>

      <NavLink to="/about" onClick={closeMenu} className={navLinkClass}>
        <FaInfoCircle />
        <span>About</span>
      </NavLink>

      <NavLink to="/contact" onClick={closeMenu} className={navLinkClass}>
        <FaPhone />
        <span>Contact</span>
      </NavLink>
    </>
  );

  // ==========================================================
  // AUTHENTICATED LINKS
  // ==========================================================

  const authenticatedLinks = isLoggedIn ? (
    <NavLink to="/dashboard" onClick={closeMenu} className={navLinkClass}>
      <FaChartLine />
      <span>Dashboard</span>
    </NavLink>
  ) : null;

  // ==========================================================
  // IMAGE FALLBACK
  // ==========================================================

  const handleImageError = (event) => {
    event.currentTarget.style.display = "none";
  };

  // ==========================================================
  // LOADING NAVBAR
  // ==========================================================

  if (authLoading) {
    return (
      <>
        <MarqueeBar />

        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="h-8 w-36 animate-pulse rounded-lg bg-gray-200" />

              <div className="hidden items-center gap-3 lg:flex">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-9 w-20 animate-pulse rounded-lg bg-gray-200"
                  />
                ))}
              </div>

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

      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-4">
            {/* LOGO */}

            <Link
              to="/"
              onClick={closeMenu}
              className="shrink-0 text-xl font-bold text-amber-600 sm:text-2xl"
            >
              Biscuit Shop
            </Link>

            {/* DESKTOP NAVIGATION */}

            <div className="hidden items-center gap-1 lg:flex xl:gap-2">
              {publicLinks}
              {authenticatedLinks}
            </div>

            {/* DESKTOP RIGHT */}

            <div className="hidden items-center gap-4 lg:flex">
              {/* CART */}

              {isLoggedIn && (
                <Link
                  to="/cart"
                  onClick={closeMenu}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-amber-50"
                  aria-label="Shopping cart"
                >
                  <FaShoppingCart
                    className={`text-xl transition ${
                      cartLoading
                        ? "text-gray-400"
                        : "text-gray-700 group-hover:text-amber-500"
                    }`}
                  />

                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {formattedCartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* USER */}

              {isLoggedIn ? (
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-gray-50"
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-600">
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

                  {/* DROPDOWN */}

                  <ul
                    tabIndex={0}
                    className="dropdown-content menu z-[999] mt-4 w-72 rounded-2xl border border-base-200 bg-base-100 p-2 shadow-xl"
                  >
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
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-600">
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

                    <li>
                      <Link to="/profile" onClick={closeMenu}>
                        <FaUser />
                        <span>Profile</span>
                      </Link>
                    </li>

                    <li>
                      <Link to="/dashboard" onClick={closeMenu}>
                        <FaChartLine />
                        <span>Dashboard</span>
                      </Link>
                    </li>

                    <li>
                      <Link to="/cart" onClick={closeMenu}>
                        <FaShoppingCart />
                        <span>Cart</span>

                        {cartCount > 0 && (
                          <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                            {formattedCartCount}
                          </span>
                        )}
                      </Link>
                    </li>

                    <div className="divider my-1" />

                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <FaSignOutAlt />
                        <span>Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
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

            {/* MOBILE BUTTON */}

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

        {/* MOBILE NAVIGATION */}

        <div
          id="mobile-navigation"
          className={`overflow-hidden border-t border-gray-200 transition-all duration-300 lg:hidden ${
            isOpen
              ? "max-h-[calc(100vh-4rem)] opacity-100"
              : "max-h-0 border-t-0 opacity-0"
          }`}
        >
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto bg-white px-4 py-5 sm:px-6">
            {/* MOBILE USER */}

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
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 bg-white text-xl text-amber-600">
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

            {/* MOBILE LINKS */}

            <div className="flex flex-col gap-1">
              {publicLinks}
              {authenticatedLinks}

              {isLoggedIn && (
                <NavLink
                  to="/cart"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  <FaShoppingCart />

                  <span>Cart</span>

                  {cartCount > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      {formattedCartCount}
                    </span>
                  )}
                </NavLink>
              )}
            </div>

            {/* LOGIN / REGISTER */}

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

            {/* USER ACTIONS */}

            {/* {isLoggedIn && (
              <div className="mt-5 space-y-2 border-t border-gray-200 pt-5">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium text-gray-700 transition hover:bg-amber-50 hover:text-amber-600"
                >
                  <FaUser />
                  <span>Profile</span>
                </Link>

                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium text-gray-700 transition hover:bg-amber-50 hover:text-amber-600"
                >
                  <FaChartLine />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/cart"
                  onClick={closeMenu}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium text-gray-700 transition hover:bg-amber-50 hover:text-amber-600"
                >
                  <FaShoppingCart />

                  <span>Cart</span>

                  {cartCount > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      {formattedCartCount}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-medium text-white transition hover:bg-red-600"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            )} */}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
