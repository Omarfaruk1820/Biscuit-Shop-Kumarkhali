import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaBoxOpen,
  FaInfoCircle,
  FaPhone,
  FaShoppingCart,
  FaClipboardList,
  FaHistory,
  FaUser,
  FaSignOutAlt,
  FaPlusCircle,
  FaUsers,
  FaChartLine,
  FaTachometerAlt,
} from "react-icons/fa";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { useToast } from "../../context/ToastProvider";
import MarqueeBar from "../home/MarqueeBar";
import { AuthContext } from "../../Auth/AuthProvider";

const Navbar = () => {
  // ================= AUTH =================

  const { user, role, loading, signOutUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const { addToast } = useToast();

  // ================= STATE =================

  const [isOpen, setIsOpen] = useState(false);

  const email = user?.email;

  // ================= CART QUERY =================

  const { data: carts = [] } = useQuery({
    queryKey: ["cart", email],
    enabled: !!email,

    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/carts?email=${email}`,
        {
          withCredentials: true,
        },
      );

      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  // ================= CART COUNT =================
  const cartCount = Array.isArray(carts)
    ? carts.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : 0;

  // ================= MOBILE MENU =================

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // ================= LOGOUT =================

  const handleLogout = async () => {
    try {
      await signOutUser();

      addToast("Logout successful 👋", "success");

      navigate("/login");

      closeMenu();
    } catch (error) {
      addToast("Logout failed ❌", "error");
    }
  };

  // ================= ACTIVE LINK STYLE =================

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-2 py-2 font-medium transition duration-300 ${
      isActive
        ? "text-amber-600 border-b-2 border-amber-500"
        : "text-gray-700 hover:text-amber-500"
    }`;

  // ================= NAVBAR SKELETON =================

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo Skeleton */}
            <div className="w-40 h-8 rounded bg-gray-200 animate-pulse"></div>

            {/* Desktop Menu Skeleton */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="w-20 h-8 rounded bg-gray-200 animate-pulse"></div>

              <div className="w-20 h-8 rounded bg-gray-200 animate-pulse"></div>

              <div className="w-20 h-8 rounded bg-gray-200 animate-pulse"></div>

              <div className="w-20 h-8 rounded bg-gray-200 animate-pulse"></div>
            </div>

            {/* Right Side Skeleton */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>

              <div className="w-24 h-10 rounded bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  // ================= PUBLIC ROUTES =================

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

  // ================= USER ROUTES =================

  const userLinks = (
    <>
      <NavLink to="/cart" onClick={closeMenu} className={navLinkClass}>
        <FaShoppingCart />
        Cart
      </NavLink>

      <NavLink to="/my-orders" onClick={closeMenu} className={navLinkClass}>
        <FaClipboardList />
        My Orders
      </NavLink>

      <NavLink to="/order-history" onClick={closeMenu} className={navLinkClass}>
        <FaHistory />
        Order History
      </NavLink>

      <NavLink to="/profile" onClick={closeMenu} className={navLinkClass}>
        <FaUser />
        Profile
      </NavLink>
    </>
  );

  // ================= ADMIN ROUTES =================

  const adminLinks = (
    <>
      <NavLink to="/dashboard" onClick={closeMenu} className={navLinkClass}>
        <FaTachometerAlt />
        Dashboard
      </NavLink>

      <NavLink
        to="/dashboard/add-product"
        onClick={closeMenu}
        className={navLinkClass}
      >
        <FaPlusCircle />
        Add Product
      </NavLink>

      <NavLink
        to="/dashboard/manage-products"
        onClick={closeMenu}
        className={navLinkClass}
      >
        <FaBoxOpen />
        Manage Products
      </NavLink>

      <NavLink
        to="/dashboard/manage-orders"
        onClick={closeMenu}
        className={navLinkClass}
      >
        <FaClipboardList />
        Manage Orders
      </NavLink>

      <NavLink
        to="/dashboard/manage-users"
        onClick={closeMenu}
        className={navLinkClass}
      >
        <FaUsers />
        Manage Users
      </NavLink>

      <NavLink
        to="/dashboard/sales-analytics"
        onClick={closeMenu}
        className={navLinkClass}
      >
        <FaChartLine />
        Sales Analytics
      </NavLink>
    </>
  );

  // ================= ROLE BASED MENU =================

  const roleBasedLinks = (
    <>
      {/* Public Routes (Everyone) */}
      {publicLinks}

      {/* User Routes */}
      {user && role === "user" && userLinks}

      {/* Admin Routes */}
      {user && role === "admin" && adminLinks}
    </>
  );
  // ================= RETURN =================

  return (
    <>
      {/* TOP MARQUEE */}
      <MarqueeBar />

      <nav className="sticky top-0 z-50 bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* LOGO */}
            <Link to="/" className="text-2xl font-bold text-amber-600">
              Biscuit Shop
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden lg:flex items-center gap-5">
              {roleBasedLinks}
            </div>

            {/* RIGHT SIDE */}
            <div className="hidden lg:flex items-center gap-5">
              {/* CART */}
              {user && (
                <Link to="/cart" className="relative">
                  <FaShoppingCart className="text-2xl text-gray-700 hover:text-amber-500 duration-300" />

                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
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
                      src={
                        user?.photoURL || "https://i.ibb.co/4pDNDk1/avatar.png"
                      }
                      alt="user"
                      className="w-10 h-10 rounded-full border-2 border-amber-500"
                    />

                    <div className="hidden xl:block">
                      <h3 className="font-semibold">
                        {user?.displayName || "User"}
                      </h3>

                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>

                  {/* DROPDOWN */}
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-50 w-64 p-3 shadow"
                  >
                    <li className="mb-2">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {user?.displayName}
                        </span>

                        <span className="text-xs text-gray-500">
                          {user?.email}
                        </span>
                      </div>
                    </li>

                    <li>
                      <Link to="/profile">
                        <FaUser />
                        Profile
                      </Link>
                    </li>

                    <li>
                      <button onClick={handleLogout} className="text-red-500">
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  {/* LOGIN */}
                  <Link to="/login">
                    <button className="px-5 py-2 border border-amber-500 rounded-lg text-amber-600 hover:bg-amber-500 hover:text-white duration-300">
                      Login
                    </button>
                  </Link>

                  {/* REGISTER */}
                  <Link to="/register">
                    <button className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 duration-300">
                      Register
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* MOBILE BUTTON */}
            <button onClick={toggleMenu} className="lg:hidden text-2xl">
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        <div
          className={`lg:hidden bg-white border-t shadow-md transition-all duration-300 ${
            isOpen ? "block" : "hidden"
          }`}
        >
          <div className="px-5 py-4 flex flex-col gap-3">
            {/* PROFILE */}
            {user && (
              <div className="flex items-center gap-3 border-b pb-4">
                <img
                  src={user?.photoURL || "https://i.ibb.co/4pDNDk1/avatar.png"}
                  className="w-12 h-12 rounded-full border"
                  alt=""
                />

                <div>
                  <h3 className="font-semibold">{user?.displayName}</h3>

                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            )}

            {/* ROUTES */}
            {roleBasedLinks}

            {/* CART */}
            {user && (
              <NavLink to="/cart" className={navLinkClass} onClick={closeMenu}>
                <FaShoppingCart />
                Cart ({cartCount})
              </NavLink>
            )}

            {/* LOGIN REGISTER */}
            {!user && (
              <div className="flex flex-col gap-3 mt-3">
                <Link to="/login" onClick={closeMenu}>
                  <button className="w-full border border-amber-500 py-2 rounded-lg">
                    Login
                  </button>
                </Link>

                <Link to="/register" onClick={closeMenu}>
                  <button className="w-full bg-amber-500 text-white py-2 rounded-lg">
                    Register
                  </button>
                </Link>
              </div>
            )}

            {/* LOGOUT */}
            {user && (
              <button
                onClick={handleLogout}
                className="mt-3 bg-red-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"
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
