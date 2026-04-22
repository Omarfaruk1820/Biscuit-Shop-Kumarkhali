import { createBrowserRouter } from "react-router-dom";
import Main from "../components/layout/Main";
import Home from "../pages/Home";
import NotFound from "../components/home/NotFound";
import ProductCard from "../components/products/ProductCard";
import ProductDetails from "../components/products/ProductDetails";
import Checkout from "../components/products/Checkout";
import AddToCarts from "../components/cart/AddToCarts";
import About from "../pages/About";
import Login from "../Auth/Login";
import Register from "../Auth/Register";

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
        element: <ProductDetails />,
      },

      {
        path: "/carts",
        element: <AddToCarts />,
      },

      {
        path: "/checkout",
        element: <Checkout />,
      },

      {
        path: "/about",
        element: <About />,
      },

      // ✅ ADD THIS (missing before)
      {
        path: "/contact",
        element: <div className="p-10 text-center">Contact Page</div>,
      },

      {
        path: "/login",
        element: <Login />,
      },

      {
        path: "/register",
        element: <Register />,
      },
    ],
  },
]);

export default router;
