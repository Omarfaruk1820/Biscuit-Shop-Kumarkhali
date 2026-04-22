import { createBrowserRouter } from "react-router-dom";
import Main from "../components/layout/Main";
import Home from "../pages/Home";
import NotFound from "../components/home/NotFound";
import ProductCard from "../components/products/ProductCard";
import ProductDetails from "./../components/products/ProductDetails";
import Checkout from "../components/products/Checkout";
import AddToCarts from "../components/cart/AddToCarts";
import About from "../pages/About";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main></Main>,
    errorElement: <NotFound></NotFound>,
    children: [
      {
        path: "/",
        element: <Home></Home>,
      },
      {
        path: "/product",
        element: <ProductCard></ProductCard>,
      },

      {
        path: "/product/:id",
        element: <ProductDetails />,
      },
      {
        path: "/carts",
        element: <AddToCarts />,
      },
      {
        path: "/checkout", // ✅ lowercase
        element: <Checkout />,
      },
      {
        path: "/about",
        element: <About></About>,
      },
    ],
  },
]);
export default router;
