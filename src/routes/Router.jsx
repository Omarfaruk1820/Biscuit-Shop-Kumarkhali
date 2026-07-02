import { createBrowserRouter } from "react-router-dom";
import Main from "../components/layout/Main";
import Home from "../pages/Home";
import NotFound from "../components/home/NotFound";
import ProductCard from "../components/products/ProductCard";
import ProductDetails from "../components/products/ProductDetails";
import Checkout from "../components/products/Checkout";

import About from "../pages/About";
import Login from "../Auth/Login";
import Register from "../Auth/Register";

import Contact from "../pages/Contact";

import Cart from "../components/cart/Cart";
import Success from "../pages/Success";

import PrivateRoute from "./PrivateRoute";
import FeaturedProdetails from "../components/home/FeaturedProdetails";
import DashboardLayout from "../components/layout/DashboardLayout";

import AdminRoute from "./AdminRoute";

import DashboardRedirect from "../components/layout/DashboardRedirect";
import MyOrders from "./../components/dashboard/MyOrders";
import Wishlist from "./../components/dashboard/Wishlist";
import ManageOrders from "./../components/dashboard/ManageOrders";
import AddProduct from "../components/dashboard/AddProduct";
import AdminDashboard from "./../components/dashboard/AdminDashboard";
import AllUsers from "../components/dashboard/AllUsers";
import UserRoute from "./UserRoute";
import DashboardUser from "../components/dashboard/DashboardUser";
import Profile from "../components/dashboard/Profile";
import ManageProducts from "./../components/dashboard/ManageProducts";
import Settings from "../components/dashboard/Settings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    errorElement: <NotFound />,
    children: [
      {
        path: "",
        element: <Home />,
      },

      // ✅ FIXED: products list page
      {
        path: "/products",
        element: <ProductCard />,
      },
      {
        path: "/cart",
        element: (
          <PrivateRoute>
            <Cart />
          </PrivateRoute>
        ),
      },

      {
        path: "/FeaturedProdetails/:id",
        element: <FeaturedProdetails></FeaturedProdetails>,
      },

      {
        path: "/product/:id",
        element: (
          <PrivateRoute>
            <ProductDetails />
          </PrivateRoute>
        ),
      },

      {
        path: "/checkout",
        element: (
          <PrivateRoute>
            {" "}
            <Checkout />
          </PrivateRoute>
        ),
      },

      {
        path: "/about",
        element: <About />,
      },

      // ✅ ADD THIS (missing before)
      {
        path: "/contact",
        element: <Contact></Contact>,
      },

      {
        path: "/login",
        element: <Login />,
      },

      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/success",
        element: <Success></Success>,
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),

    children: [
      // ======================================================
      // Default Dashboard Redirect
      // ======================================================

      {
        index: true,
        element: <DashboardRedirect />,
      },

      // ======================================================
      // User Routes
      // ======================================================

      {
        path: "user-dashboard",
        element: (
          <UserRoute>
            <DashboardUser />
          </UserRoute>
        ),
      },

      {
        path: "my-orders",
        element: (
          <UserRoute>
            <MyOrders />
          </UserRoute>
        ),
      },

      {
        path: "wishlist",
        element: (
          <UserRoute>
            <Wishlist />
          </UserRoute>
        ),
      },

      {
        path: "profile",
        element: (
          <UserRoute>
            <Profile />
          </UserRoute>
        ),
      },

      // ======================================================
      // Admin Routes
      // ======================================================

      {
        path: "admin-dashboard",
        element: (
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        ),
      },

      {
        path: "add-product",
        element: (
          <AdminRoute>
            <AddProduct />
          </AdminRoute>
        ),
      },

      {
        path: "manage-products",
        element: (
          <AdminRoute>
            <ManageProducts />
          </AdminRoute>
        ),
      },

      {
        path: "manage-orders",
        element: (
          <AdminRoute>
            <ManageOrders />
          </AdminRoute>
        ),
      },

      {
        path: "all-users",
        element: (
          <AdminRoute>
            <AllUsers></AllUsers>
          </AdminRoute>
        ),
      },

      // ======================================================
      // Shared Routes
      // ======================================================

      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);

export default router;
