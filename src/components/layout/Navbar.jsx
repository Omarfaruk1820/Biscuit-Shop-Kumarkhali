import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaMoon, FaSun } from "react-icons/fa";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const navLinkClass = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-semibold transition duration-300 ${
      isActive
        ? "text-amber-600 after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-amber-600"
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
              alt="Biscuit Logo"
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-amber-600">
              Biscuit Shop
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              Shop
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
            <NavLink to="/carts" className={navLinkClass}>
             Cart
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              DashBoard
            </NavLink>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="text-lg p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:scale-110 transition"
            >
              {dark ? <FaSun className="text-yellow-400" /> : <FaMoon />}
            </button>

            {/* LOGIN */}
            <Link to="/login">
              <button className="px-4 py-2 text-sm font-medium border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition">
                Login
              </button>
            </Link>

            {/* REGISTER */}
            <Link to="/register">
              <button className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition shadow-md">
                Register
              </button>
            </Link>
          </div>

          {/* MOBILE BUTTON */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="text-lg p-2 rounded-full bg-gray-100 dark:bg-gray-800"
            >
              {dark ? <FaSun className="text-yellow-400" /> : <FaMoon />}
            </button>

            <button onClick={toggleMenu} className="text-xl">
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden bg-white dark:bg-gray-900 px-4 pb-4 transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <NavLink to="/" className={navLinkClass} onClick={toggleMenu}>
          Home
        </NavLink>
        <NavLink to="/products" className={navLinkClass} onClick={toggleMenu}>
          Shop
        </NavLink>
        <NavLink to="/about" className={navLinkClass} onClick={toggleMenu}>
          About
        </NavLink>
        <NavLink to="/contact" className={navLinkClass} onClick={toggleMenu}>
          Contact
        </NavLink>
        <NavLink to="/carts" className={navLinkClass} onClick={toggleMenu}>
          Cart
        </NavLink>
        <NavLink to="/dashboard" className={navLinkClass} onClick={toggleMenu}>
          DashBoard
        </NavLink>

        <div className="mt-4 flex flex-col gap-3">
          <Link to="/login">
            <button className="w-full px-4 py-2 border border-amber-500 text-amber-600 rounded-lg">
              Login
            </button>
          </Link>
          <Link to="/register">
            <button className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg">
              Register
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;