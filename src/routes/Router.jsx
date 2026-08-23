import { createBrowserRouter } from "react-router-dom";

// ============================================================
// LAYOUT
// ============================================================

import Main from "../components/layout/Main";
import DashboardLayout from "../components/layout/DashboardLayout";

// ============================================================
// MAIN PAGES
// ============================================================

import Home from "../pages/Home";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Success from "../pages/Success";
import NotFound from "../components/home/NotFound";

// ============================================================
// AUTH
// ============================================================

import Login from "../Auth/Login";
import Register from "../Auth/Register";

// ============================================================
// PRODUCTS
// ============================================================

import ProductCard from "../components/products/ProductCard";
import ProductDetails from "../components/products/ProductDetails";
import FeaturedProdetails from "../components/home/FeaturedProdetails";
import Checkout from "../components/products/Checkout";

// ============================================================
// CART
// ============================================================

import Cart from "../components/cart/Cart";

// ============================================================
// DASHBOARD
// ============================================================

import DashboardRedirect from "../components/layout/DashboardRedirect";
import DashboardUser from "../components/dashboard/DashboardUser";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import MyOrders from "../components/dashboard/MyOrders";
import Wishlist from "../components/dashboard/Wishlist";
import Profile from "../components/dashboard/Profile";
import Settings from "../components/dashboard/Settings";
import Invoice from "../components/dashboard/Invoice";

// ============================================================
// ADMIN
// ============================================================

import AddProduct from "../components/dashboard/AddProduct";
import ManageProducts from "../components/dashboard/ManageProducts";
import ManageOrders from "../components/dashboard/ManageOrders";
import AllUsers from "../components/dashboard/AllUsers";

// ============================================================
// ROUTE GUARDS
// ============================================================

import PrivateRoute from "./PrivateRoute";
import UserRoute from "./UserRoute";
import AdminRoute from "./AdminRoute";

// ============================================================
// ROUTER
// ============================================================

const router = createBrowserRouter([
  // ============================================================
  // MAIN WEBSITE
  // ============================================================

  {
    path: "/",
    element: <Main />,
    errorElement: <NotFound />,

    children: [
      // ========================================================
      // HOME
      // ========================================================

      {
        index: true,
        element: <Home />,
      },

      // ========================================================
      // PRODUCTS
      // ========================================================

      {
        path: "products",
        element: <ProductCard />,
      },

      {
        path: "product/:id",
        element: (
          <PrivateRoute>
            <ProductDetails />
          </PrivateRoute>
        ),
      },

      {
        path: "FeaturedProdetails/:id",
        element: <FeaturedProdetails />,
      },

      // ========================================================
      // CART
      // ========================================================

      {
        path: "cart",
        element: (
          <PrivateRoute>
            <Cart />
          </PrivateRoute>
        ),
      },

      // ========================================================
      // CHECKOUT
      // ========================================================

      {
        path: "checkout",
        element: (
          <PrivateRoute>
            <Checkout />
          </PrivateRoute>
        ),
      },

      // ========================================================
      // OTHER PAGES
      // ========================================================

      {
        path: "about",
        element: <About />,
      },

      {
        path: "contact",
        element: <Contact />,
      },

      // ========================================================
      // AUTH
      // ========================================================

      {
        path: "login",
        element: <Login />,
      },

      {
        path: "register",
        element: <Register />,
      },

      // ========================================================
      // SUCCESS
      // ========================================================

      {
        path: "success",
        element: <Success />,
      },
    ],
  },

  // ============================================================
  // DASHBOARD
  // ============================================================

  {
    path: "/dashboard",

    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),

    children: [
      // ========================================================
      // DASHBOARD REDIRECT
      // ========================================================

      {
        index: true,
        element: <DashboardRedirect />,
      },

      // ========================================================
      // USER DASHBOARD
      // ========================================================

      {
        path: "user-dashboard",
        element: (
          <UserRoute>
            <DashboardUser />
          </UserRoute>
        ),
      },

      // ========================================================
      // USER CART
      // ========================================================

      {
        path: "cart",
        element: (
          <UserRoute>
            <Cart />
          </UserRoute>
        ),
      },

      // ========================================================
      // MY ORDERS
      // ========================================================

      {
        path: "my-orders",
        element: (
          <UserRoute>
            <MyOrders />
          </UserRoute>
        ),
      },

      // ========================================================
      // INVOICE
      // ========================================================

      {
        path: "invoice/:id",
        element: (
          <UserRoute>
            <Invoice />
          </UserRoute>
        ),
      },

      // ========================================================
      // WISHLIST
      // ========================================================

      {
        path: "wishlist",
        element: (
          <UserRoute>
            <Wishlist />
          </UserRoute>
        ),
      },

      // ========================================================
      // PROFILE
      // ========================================================

      {
        path: "profile",
        element: (
          <UserRoute>
            <Profile />
          </UserRoute>
        ),
      },

      // ========================================================
      // SETTINGS
      // ========================================================

      {
        path: "settings",
        element: (
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        ),
      },

      // ========================================================
      // ADMIN DASHBOARD
      // ========================================================

      {
        path: "admin-dashboard",
        element: (
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        ),
      },

      // ========================================================
      // ADD PRODUCT
      // ========================================================

      {
        path: "add-product",
        element: (
          <AdminRoute>
            <AddProduct />
          </AdminRoute>
        ),
      },

      // ========================================================
      // MANAGE PRODUCTS
      // ========================================================

      {
        path: "manage-products",
        element: (
          <AdminRoute>
            <ManageProducts />
          </AdminRoute>
        ),
      },

      // ========================================================
      // MANAGE ORDERS
      // ========================================================

      {
        path: "manage-orders",
        element: (
          <AdminRoute>
            <ManageOrders />
          </AdminRoute>
        ),
      },

      // ========================================================
      // ALL USERS
      // ========================================================

      {
        path: "all-users",
        element: (
          <AdminRoute>
            <AllUsers />
          </AdminRoute>
        ),
      },
    ],
  },
]);

export default router;
