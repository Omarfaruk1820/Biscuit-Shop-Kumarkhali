import { useContext, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaMoon,
  FaSun,
  FaShoppingCart,
  FaSignOutAlt,
} from "react-icons/fa";
import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const Navbar = () => {
  const { user, signOutUser } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const email = user?.email?.toLowerCase().trim();

  // ================= FETCH CART COUNT =================
  const { data: cart = [] } = useQuery({
    queryKey: ["cart", email],
    queryFn: async () => {
      if (!email) return [];

      const res = await axios.get(
        `http://localhost:5000/cart?email=${email}`
      );

      return res.data?.data || [];
    },
    enabled: !!email,
  });

  // ✅ TOTAL COUNT
  const cartCount = cart.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  // ================= DARK MODE =================
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);
  const toggleTheme = () => setDark((prev) => !prev);

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

  // ================= ACTIVE LINK =================
  const navLinkClass = ({ isActive }) =>
    `block px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "text-amber-600 border-b-2 border-amber-600"
        : "text-gray-700 dark:text-gray-300 hover:text-amber-500"
    }`;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4">
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
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            <NavLink to="/products" className={navLinkClass}>Shop</NavLink>
            <NavLink to="/add-biscuit" className={navLinkClass}>Add Biscuit</NavLink>
            <NavLink to="/about" className={navLinkClass}>About</NavLink>
            <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
            <NavLink to="/AllOrder" className={navLinkClass}>All Orders</NavLink>

            {/* ✅ LIVE CART */}
            <NavLink to="/cart" className="relative">
              <FaShoppingCart className="text-xl text-gray-700 dark:text-gray-300" />

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-1.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/OrderHistory" className={navLinkClass}>
              Order History
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden md:flex items-center gap-4">

            {/* THEME */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
            >
              {dark ? <FaSun /> : <FaMoon />}
            </button>

            {/* USER */}
            {user ? (
              <div className="flex items-center gap-3">
                <img
                  src={user.photoURL || "https://i.ibb.co/4pDNDk1/avatar.png"}
                  className="w-9 h-9 rounded-full"
                  alt="user"
                />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login">
                  <button className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg">
                    Login
                  </button>
                </Link>

                <Link to="/register">
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg">
                    Register
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE BUTTON */}
          <div className="md:hidden flex items-center gap-3">
            <button onClick={toggleTheme}>
              {dark ? <FaSun /> : <FaMoon />}
            </button>

            <button onClick={toggleMenu}>
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden bg-white dark:bg-gray-900 px-4 pb-4 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <NavLink to="/" onClick={closeMenu} className={navLinkClass}>Home</NavLink>
        <NavLink to="/products" onClick={closeMenu} className={navLinkClass}>Shop</NavLink>

        {/* MOBILE CART */}
        <NavLink to="/cart" onClick={closeMenu} className={navLinkClass}>
          Cart ({cartCount})
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;