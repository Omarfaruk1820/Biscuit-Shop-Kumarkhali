import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const newToast = { id: id++, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(newToast.id);
    }, 2500);
  };

  const removeToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* 🔥 TOP RIGHT */}
      <div className="fixed top-5 right-5 z-50 space-y-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast }) => {
  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return (
    <div
      className={`px-4 py-3 rounded-xl shadow-xl text-white min-w-[250px]
      transform transition-all duration-300 ease-in-out
      animate-[slideIn_.3s_ease]
      ${typeStyles[toast.type]}`}
    >
      {toast.message}
    </div>
  );
};