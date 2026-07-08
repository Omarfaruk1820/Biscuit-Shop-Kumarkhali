import { useContext, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
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

import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import MarqueeBar from "../home/MarqueeBar";

const Navbar = () => {
  // ==========================
  // AUTH
  // ==========================

  const { user, role, loading, signOutUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const { addToast } = useToast();

  // ==========================
  // STATE
  // ==========================

  const [isOpen, setIsOpen] = useState(false);

  const email = user?.email || "";

  // ==========================
  // CART QUERY
  // ==========================

  const {
    data: carts = [],
    isLoading: cartLoading,
    isError: cartError,
  } = useQuery({
    queryKey: ["cart", email],
    enabled: !!email,

    queryFn: async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/carts`, {
          params: { email },
          withCredentials: true,
        });

        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (error) {
        console.error("Failed to fetch cart:", error);
        return [];
      }
    },

    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // ==========================
  // CART COUNT
  // ==========================

  const cartCount = useMemo(() => {
    if (!Array.isArray(carts)) return 0;

    return carts.reduce((total, item) => {
      return total + (item.quantity || 1);
    }, 0);
  }, [carts]);

  // ==========================
  // MOBILE MENU
  // ==========================

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // ==========================
  // LOGOUT
  // ==========================

  const handleLogout = async () => {
    try {
      await signOutUser();

      addToast("Logout successful 👋", "success");

      closeMenu();

      navigate("/login");
    } catch (error) {
      console.error(error);

      addToast("Logout failed ❌", "error");
    }
  };

  // ==========================
  // ACTIVE LINK STYLE
  // ==========================

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
      isActive
        ? "bg-amber-500 text-white shadow-md"
        : "text-gray-700 hover:bg-amber-50 hover:text-amber-600"
    }`;
  // ==========================
  // LOADING SKELETON
  // ==========================

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo Skeleton */}
            <div className="w-40 h-8 rounded-lg bg-gray-200 animate-pulse"></div>

            {/* Desktop Menu Skeleton */}
            <div className="hidden lg:flex items-center gap-5">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="w-20 h-8 rounded-lg bg-gray-200 animate-pulse"
                />
              ))}
            </div>

            {/* Right Side Skeleton */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>

              <div className="hidden md:block w-24 h-10 rounded-lg bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // ==========================
  // PUBLIC LINKS
  // ==========================

  const publicLinks = (
    <>
      <NavLink to="/" onClick={closeMenu} className={navLinkClass}>
        <FaHome />
        Home
      </NavLink>

      <NavLink to="/products" onClick={closeMenu} className={navLinkClass}>
        <FaBoxOpen />
        Shop
      </NavLink>

      <NavLink to="/about" onClick={closeMenu} className={navLinkClass}>
        <FaInfoCircle />
        About
      </NavLink>

      <NavLink to="/contact" onClick={closeMenu} className={navLinkClass}>
        <FaPhone />
        Contact
      </NavLink>
    </>
  );

  // ==========================
  // USER LINKS
  // ==========================

  const userLinks = user && (
    <>
      <NavLink to="/dashboard" onClick={closeMenu} className={navLinkClass}>
        <FaChartLine />
        Dashboard
      </NavLink>
    </>
  );

  // ==========================
  // ROLE BASED LINKS
  // ==========================

  const roleBasedLinks = (
    <>
      {publicLinks}
      {userLinks}
    </>
  );

  // ==========================
  // DESKTOP NAVIGATION
  // ==========================

  const desktopNavigation = (
    <div className="hidden lg:flex items-center gap-2">{roleBasedLinks}</div>
  );

  // ==========================
  // MOBILE NAVIGATION
  // ==========================

  const mobileNavigation = (
    <div className="flex flex-col gap-2 py-2">{roleBasedLinks}</div>
  );
  return (
    <>
      {/* =======================
          TOP MARQUEE
      ======================== */}
      <MarqueeBar />

      {/* =======================
          NAVBAR
      ======================== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* =======================
                LOGO
            ======================== */}

            <Link
              to="/"
              className="text-xl lg:text-2xl font-bold text-amber-600 whitespace-nowrap"
            >
              Biscuit Shop
            </Link>

            {/* =======================
                DESKTOP NAVIGATION
            ======================== */}

            {desktopNavigation}

            {/* =======================
                RIGHT SIDE
            ======================== */}

            <div className="hidden lg:flex items-center gap-5">
              {/* CART */}

              {user && (
                <Link to="/cart" className="relative group">
                  <FaShoppingCart className="text-2xl text-gray-700 group-hover:text-amber-500 duration-300" />

                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* USER */}

              {user ? (
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <img
                      loading="lazy"
                      src={
                        user?.photoURL || "https://i.ibb.co/4pDNDk1/avatar.png"
                      }
                      alt="User"
                      className="w-10 h-10 rounded-full border-2 border-amber-500 object-cover"
                    />

                    <div className="hidden xl:block">
                      <h3 className="font-semibold">
                        {user?.displayName || "User"}
                      </h3>

                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>

                  {/* =======================
                      DROPDOWN
                  ======================== */}

                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-xl shadow-xl mt-4 w-64 z-[999]"
                  >
                    <li className="pointer-events-none">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {user?.displayName}
                        </span>

                        <span className="text-xs text-gray-500 break-all">
                          {user?.email}
                        </span>
                      </div>
                    </li>

                    <div className="divider my-1"></div>

                    <li>
                      <Link to="/profile" onClick={closeMenu}>
                        <FaUser />
                        Profile
                      </Link>
                    </li>

                    <li>
                      <Link to="/dashboard" onClick={closeMenu}>
                        <FaChartLine />
                        Dashboard
                      </Link>
                    </li>

                    <div className="divider my-1"></div>

                    <li>
                      <button onClick={handleLogout} className="text-red-500">
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <button className="px-5 py-2 rounded-lg border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition">
                      Login
                    </button>
                  </Link>

                  <Link to="/register">
                    <button className="px-5 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition">
                      Register
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* =======================
                MOBILE MENU BUTTON
            ======================== */}

            <button
              onClick={toggleMenu}
              className="lg:hidden text-2xl text-gray-700"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

  

        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-screen opacity-100 border-t" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white px-5 py-5 shadow-md">
            {/* PROFILE */}

            {user && (
              <div className="flex items-center gap-3 pb-5 border-b">
                <img
                  loading="lazy"
                  src={user?.photoURL || "https://i.ibb.co/4pDNDk1/avatar.png"}
                  alt="User"
                  className="w-14 h-14 rounded-full border-2 border-amber-500 object-cover"
                />

                <div>
                  <h3 className="font-semibold">{user?.displayName}</h3>

                  <p className="text-xs text-gray-500 break-all">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}

            {/* MOBILE NAVIGATION */}

            <div className="mt-5">{mobileNavigation}</div>

            {/* CART */}

            {user && (
              <NavLink to="/cart" onClick={closeMenu} className={navLinkClass}>
                <FaShoppingCart />
                Cart
                {cartCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {cartCount}
                  </span>
                )}
              </NavLink>
            )}

            {/* LOGIN / REGISTER */}

            {!user && (
              <div className="mt-6 flex flex-col gap-3">
                <Link to="/login" onClick={closeMenu}>
                  <button className="w-full py-2 rounded-lg border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition">
                    Login
                  </button>
                </Link>

                <Link to="/register" onClick={closeMenu}>
                  <button className="w-full py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition">
                    Register
                  </button>
                </Link>
              </div>
            )}

            {/* LOGOUT */}

            {user && (
              <button
                onClick={handleLogout}
                className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <FaSignOutAlt />
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
