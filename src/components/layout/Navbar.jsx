import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaShoppingCart,
  FaSignOutAlt,
  FaHome,
  FaBox,
  FaPlus,
  FaInfoCircle,
  FaPhone,
  FaClipboardList,
  FaHistory,
  FaUser,
} from "react-icons/fa";
import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import MarqueeBar from "../home/MarqueeBar";

const Navbar = () => {
  const { user, signOutUser } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  const email = user?.email;

  // ================= CART COUNT =================
  const { data: cart = [] } = useQuery({
    queryKey: ["cart", email],
    enabled: !!email,
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:5173/cart?email=${email}`
      );
      return res.data?.data || [];
    },
  });

  const cartCount = cart.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

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

  // ================= ACTIVE STYLE =================
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-1 py-2 text-sm font-semibold transition ${
      isActive
        ? "text-amber-600 border-b-2 border-amber-600"
        : "text-gray-700 hover:text-amber-500"
    }`;

  // ================= NAV LINKS =================
  const navLinks = (
    <>
      <NavLink to="/" onClick={closeMenu} className={navLinkClass}>
        <FaHome /> Home
      </NavLink>

      <NavLink to="/products" onClick={closeMenu} className={navLinkClass}>
        <FaBox /> Shop
      </NavLink>

      <NavLink to="/add-biscuit" onClick={closeMenu} className={navLinkClass}>
        <FaPlus /> Add Biscuit
      </NavLink>

      {/* <NavLink to="/about" onClick={closeMenu} className={navLinkClass}>
        <FaInfoCircle /> About
      </NavLink>

      <NavLink to="/contact" onClick={closeMenu} className={navLinkClass}>
        <FaPhone /> Contact
      </NavLink> */}

      <NavLink to="/allOrder" onClick={closeMenu} className={navLinkClass}>
        <FaClipboardList /> Orders
      </NavLink>

      <NavLink to="/orderHistory" onClick={closeMenu} className={navLinkClass}>
        <FaHistory /> History
      </NavLink>

      <NavLink to="/users" onClick={closeMenu} className={navLinkClass}>
        <FaUser /> user
      </NavLink>
      <NavLink to="/own-product" onClick={closeMenu} className={navLinkClass}>
        <FaUser /> Own Product
      </NavLink>
    </>
  );

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-3">
        <MarqueeBar></MarqueeBar>
        <div className="flex justify-between items-center h-16">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
              className="w-10 h-10"
              alt="logo"
            />
            <span className="text-xl font-bold text-amber-600">
              Biscuit Shop
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks}

            {/* CART */}
            <NavLink to="/cart" className="relative">
              <FaShoppingCart className="text-xl text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs  rounded-full">
                  {cartCount}
                </span>
              )}
            </NavLink>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden md:flex items-center gap-4">

            {user ? (
              <div className="flex items-center gap-3">

                <div className="flex items-center gap-2">
                  <img
                    src={
                      user.photoURL ||
                      "https://i.ibb.co/4pDNDk1/avatar.png"
                    }
                    className="w-9 h-9 ml-2 rounded-full border"
                    alt="user"
                  />

                  <div className="hidden lg:block">
                    <p className="text-sm font-semibold">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <button className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white">
                    Login
                  </button>
                </Link>

                <Link to="/register">
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* MOBILE BUTTON */}
          <div className="md:hidden flex items-center gap-3">
            <button onClick={toggleMenu} className="text-xl">
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden bg-white px-4 pb-4 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        {navLinks}

        {/* MOBILE CART */}
        <NavLink to="/cart" onClick={closeMenu} className={navLinkClass}>
          <FaShoppingCart /> Cart ({cartCount})
        </NavLink>

        {/* USER MOBILE */}
        {user ? (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={
                  user.photoURL ||
                  "https://i.ibb.co/4pDNDk1/avatar.png"
                }
                className="w-10 h-10 rounded-full"
                alt="user"
              />
              <div>
                <p className="font-semibold">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 rounded"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/login" onClick={closeMenu}>
              <button className="w-full border border-amber-500 py-2 rounded">
                Login
              </button>
            </Link>

            <Link to="/register" onClick={closeMenu}>
              <button className="w-full bg-amber-500 text-white py-2 rounded">
                Register
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;