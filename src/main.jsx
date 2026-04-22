import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { RouterProvider } from "react-router-dom";
import router from "./routes/Router.jsx";
import CartProvider from "./context/CartProvider.jsx";
import { ToastProvider } from "./context/ToastProvider.jsx";
import AuthProvider from "./Auth/AuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
);
