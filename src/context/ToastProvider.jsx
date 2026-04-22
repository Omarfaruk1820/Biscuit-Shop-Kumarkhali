import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

// ✅ Safe Hook
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};

let id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // ➕ Add Toast
  const addToast = (message, type = "info") => {
    const newToast = {
      id: id++,
      message,
      type,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(newToast.id);
    }, 3000);
  };

  // ❌ Remove Toast
  const removeToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* 🔥 Toast Container */}
      <div className="fixed top-5 right-5 z-50 space-y-3">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// 🎨 Toast UI
const ToastItem = ({ toast, onClose }) => {
  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[260px] 
      transform transition-all duration-300 ease-in-out animate-[fadeIn_0.3s_ease]
      ${typeStyles[toast.type] || typeStyles.info}`}
    >
      <span className="text-sm font-medium">{toast.message}</span>

      {/* ❌ Close Button */}
      <button
        onClick={() => onClose(toast.id)}
        className="text-white font-bold hover:opacity-80"
      >
        ✕
      </button>
    </div>
  );
};