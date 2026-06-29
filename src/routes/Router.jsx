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

import UserRoute from "./UserRoute";
import MyOrders from "../pages/Dashboard/UserDashBoard/MyOrders";
import Wishlist from "../pages/Dashboard/UserDashBoard/Wishlist";

import AdminRoute from "./AdminRoute";
import ManageUsers from "../pages/Dashboard/AdminDashBoard/ManageUsers";
import ManageProducts from "../pages/Dashboard/AdminDashBoard/ManageProducts";
import AddProduct from "../pages/Dashboard/AdminDashBoard/AddProduct";
import ManageOrders from "../pages/Dashboard/AdminDashBoard/ManageOrders";
import DashboardHome from "../pages/Dashboard/DashboardHome/DashboardHome";
import AdminDashboard from "../pages/Dashboard/AdminDashBoard/AdminDashboard";

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
      {
        index: true,
        element: <DashboardHome />,
      },

      // User Routes
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

      // Admin Routes
      {
        path: "manage-users",
        element: (
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        ),
      },

      {
        path: "addmin-dashboard",
        element: <AdminDashboard />,
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
        path: "add-product",
        element: (
          <AdminRoute>
            <AddProduct />
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
    ],
  },
]);

export default router;
