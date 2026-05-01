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
import AddBiscuit from "../pages/AddBiscuit";
import Cart from "../components/cart/Cart";
import Success from "../pages/Success";
import OrderHistory from "../pages/OrderHistory";
import AllOrder from "../pages/AllOrder";
import Users from "../pages/Dashboard/Users";
import OwnProduct from "../components/products/OwnProduct";
import PrivateRoute from "./PrivateRoute";

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

      // ✅ product details
      {
        path: "/product/:id",
        element: (
          <PrivateRoute>
            <ProductDetails />
          </PrivateRoute>
        ),
      },
      {
        path: "/Cart",
        element: (
          <PrivateRoute>
            <Cart />
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
      {
        path: "/add-biscuit",
        element: <AddBiscuit />,
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
      {
        path: "/OrderHistory",
        element: (
          <PrivateRoute>
            <OrderHistory></OrderHistory>
          </PrivateRoute>
        ),
      },
      {
        path: "/AllOrder",
        element: (
          <PrivateRoute>
            <AllOrder></AllOrder>
          </PrivateRoute>
        ),
      },
      {
        path: "/users",
        element: (
          <PrivateRoute>
            <Users></Users>
          </PrivateRoute>
        ),
      },
      {
        path: "/own-product",
        element: (
          <PrivateRoute>
            <OwnProduct></OwnProduct>
          </PrivateRoute>
        ),
      },
    ],
  },
]);

export default router;
