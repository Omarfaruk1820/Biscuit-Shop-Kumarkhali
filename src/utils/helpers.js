import { FaCheckCircle, FaClock, FaTruck, FaTimesCircle } from "react-icons/fa";

// ================================
// Currency
// ================================

export const formatCurrency = (value = 0) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(Number(value));
};

// ================================
// Date
// ================================

export const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// ================================
// Payment Badge
// ================================

export const paymentBadge = (status = "") => {
  switch (status.toLowerCase()) {
    case "paid":
      return "badge badge-success badge-outline";

    case "unpaid":
      return "badge badge-error badge-outline";

    case "refunded":
      return "badge badge-warning badge-outline";

    default:
      return "badge badge-neutral";
  }
};

// ================================
// Shipping Badge
// ================================

export const shippingBadge = (status = "") => {
  switch (status.toLowerCase()) {
    case "pending":
      return "badge badge-warning";

    case "processing":
      return "badge badge-info";

    case "shipped":
      return "badge badge-primary";

    case "delivered":
      return "badge badge-success";

    case "cancelled":
      return "badge badge-error";

    default:
      return "badge badge-neutral";
  }
};

// ================================
// Shipping Icon Component
// ================================

export const shippingIcon = (status = "") => {
  switch (status.toLowerCase()) {
    case "pending":
      return FaClock;

    case "processing":
      return FaClock;

    case "shipped":
      return FaTruck;

    case "delivered":
      return FaCheckCircle;

    case "cancelled":
      return FaTimesCircle;

    default:
      return FaClock;
  }
};

// ================================
// Total Quantity
// ================================

export const getTotalQuantity = (items = []) => {
  return items.reduce((total, item) => total + (item.quantity || 0), 0);
};

// ================================
// Download PDF
// ================================

export const downloadInvoicePDF = (id) => {
  window.open(
    `${import.meta.env.VITE_API_URL}/orders/invoice/pdf/${id}`,
    "_blank",
  );
};

// ================================
// Print Invoice
// ================================

export const printInvoice = () => {
  window.print();
};
