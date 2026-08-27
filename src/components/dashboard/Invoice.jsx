import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaCloudDownloadAlt,
  FaFileInvoiceDollar,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPrint,
  FaReceipt,
  FaShoppingBag,
  FaSpinner,
  FaTruck,
  FaUser,
  FaPhone,
} from "react-icons/fa";

import axiosSecure from "../../hooks/axiosSecure";

// ============================================================
// CONSTANTS
// ============================================================

const INVOICE_STALE_TIME = 1000 * 60 * 5;
const INVOICE_GC_TIME = 1000 * 60 * 10;

const PAYMENT_METHOD_LABELS = {
  cod: "Cash on Delivery",
  cash: "Cash",
  cash_on_delivery: "Cash on Delivery",
  online: "Online Payment",
  card: "Card Payment",
  mobile_banking: "Mobile Banking",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
};

// ============================================================
// HELPERS
// ============================================================

const normalizeString = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const result = String(value).trim();

  return result || fallback;
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const formatMoney = (value, currency = "BDT") => {
  return `${currency} ${toNumber(value).toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatStatus = (value, fallback = "Pending") => {
  const status = normalizeString(value, fallback);

  return status
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatPaymentMethod = (value) => {
  const normalized = normalizeString(value).toLowerCase();

  if (PAYMENT_METHOD_LABELS[normalized]) {
    return PAYMENT_METHOD_LABELS[normalized];
  }

  return formatStatus(value, "Cash on Delivery");
};

const getStatusClass = (status) => {
  const normalized = normalizeString(status).toLowerCase();

  if (
    ["paid", "completed", "delivered", "active", "success"].includes(normalized)
  ) {
    return "badge-success";
  }

  if (
    ["cancelled", "canceled", "failed", "rejected", "inactive"].includes(
      normalized,
    )
  ) {
    return "badge-error";
  }

  if (["processing", "shipped", "confirmed"].includes(normalized)) {
    return "badge-info";
  }

  return "badge-warning";
};

const getProductName = (item) => {
  return normalizeString(item?.name, "Product");
};

const getProductImage = (item) => {
  return normalizeString(item?.image);
};

const getProductQuantity = (item) => {
  return toNumber(item?.quantity, 0);
};

const getProductPrice = (item) => {
  return toNumber(item?.unitPrice ?? item?.price, 0);
};

const getProductDiscount = (item) => {
  return toNumber(item?.discount, 0);
};

const getProductFinalPrice = (item) => {
  if (item?.finalPrice !== undefined && item?.finalPrice !== null) {
    return toNumber(item.finalPrice, getProductPrice(item));
  }

  const price = getProductPrice(item);
  const discount = getProductDiscount(item);

  return price - (price * discount) / 100;
};

const getProductSubtotal = (item) => {
  if (item?.subtotal !== undefined && item?.subtotal !== null) {
    return toNumber(item.subtotal);
  }

  return getProductFinalPrice(item) * getProductQuantity(item);
};

// ============================================================
// PDF HELPERS
// ============================================================

const getPdfErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;

  if (status === 400) {
    return "The invoice ID is invalid.";
  }

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You are not allowed to access this invoice.";
  }

  if (status === 404) {
    return "The requested invoice could not be found.";
  }

  return error?.response?.data?.message || error?.message || fallbackMessage;
};

/**
 * Fetch the protected PDF through axiosSecure.
 *
 * IMPORTANT:
 * Do NOT use window.open(apiUrl) directly because that request
 * will not contain the Firebase Authorization header added by
 * axiosSecure.
 */
const fetchInvoicePdf = async (id) => {
  if (!id) {
    throw new Error("Invoice ID is missing.");
  }

  const response = await axiosSecure.get(
    `/invoices/view/${encodeURIComponent(id)}`,
    {
      responseType: "blob",
      timeout: 30000,
    },
  );

  const contentType =
    response?.headers?.["content-type"] ||
    response?.data?.type ||
    "application/pdf";

  // If the backend unexpectedly returned JSON instead of PDF,
  // convert the blob back to JSON and expose the server message.
  if (!contentType.includes("application/pdf")) {
    let message = "Failed to generate invoice PDF.";

    try {
      const text = await response.data.text();

      const parsed = JSON.parse(text);

      message = parsed?.message || message;
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  return response.data;
};

// ============================================================
// COMPONENT
// ============================================================

const Invoice = () => {
  const { id } = useParams();

  // ==========================================================
  // PDF ACTION STATE
  // ==========================================================

  const [pdfAction, setPdfAction] = React.useState(null);

  // ==========================================================
  // LOAD INVOICE DATA
  // ==========================================================

  const {
    data: invoice,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["invoice", id],

    enabled: Boolean(id),

    queryFn: async () => {
      if (!id) {
        throw new Error("Invoice ID is missing.");
      }

      const response = await axiosSecure.get(`/invoices/${id}`);

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to load invoice.");
      }

      return response.data.invoice;
    },

    staleTime: INVOICE_STALE_TIME,

    gcTime: INVOICE_GC_TIME,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  // ==========================================================
  // PRINT
  // ==========================================================

  const handlePrint = () => {
    window.print();
  };

  // ==========================================================
  // VIEW PDF
  // ==========================================================

  const handleViewPDF = async () => {
    if (!id || pdfAction) {
      return;
    }

    /*
     * Open a blank tab immediately.
     *
     * This avoids popup blockers because the window.open()
     * happens directly inside the user's click event.
     */
    const pdfWindow = window.open("", "_blank");

    if (!pdfWindow) {
      window.alert(
        "Please allow pop-ups in your browser to view the invoice PDF.",
      );

      return;
    }

    setPdfAction("view");

    try {
      pdfWindow.document.title = "Loading Invoice...";

      const pdfBlob = await fetchInvoicePdf(id);

      const pdfUrl = URL.createObjectURL(pdfBlob);

      pdfWindow.location.href = pdfUrl;

      /*
       * Keep the object URL alive long enough for the new tab
       * to load the PDF.
       */
      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60_000);
    } catch (error) {
      console.error("VIEW INVOICE PDF ERROR:", error);

      pdfWindow.close();

      window.alert(
        getPdfErrorMessage(error, "Failed to open the invoice PDF."),
      );
    } finally {
      setPdfAction(null);
    }
  };

  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  const handleDownloadPDF = async () => {
    if (!id || pdfAction) {
      return;
    }

    setPdfAction("download");

    try {
      const pdfBlob = await fetchInvoicePdf(id);

      const pdfUrl = URL.createObjectURL(pdfBlob);

      const invoiceNumber = normalizeString(
        invoice?.invoiceNumber,
        `invoice-${id}`,
      )
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 150);

      const filename = `${invoiceNumber || "invoice"}.pdf`;

      const anchor = document.createElement("a");

      anchor.href = pdfUrl;
      anchor.download = filename;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60_000);
    } catch (error) {
      console.error("DOWNLOAD INVOICE PDF ERROR:", error);

      window.alert(
        getPdfErrorMessage(error, "Failed to download the invoice PDF."),
      );
    } finally {
      setPdfAction(null);
    }
  };

  // const shop = {
  //   name: "Fresh Basket",
  //   address: "123 Main Road, Kaliganj, Dhaka, Bangladesh",
  //   phone: "+880 1700-000000",
  //   email: "hello@freshbasket.com",
  //   website: "freshbasket.com",
  // };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <section className="min-h-screen bg-base-200/40 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 h-10 w-64 animate-pulse rounded-lg bg-base-300" />

          <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="h-8 w-48 animate-pulse rounded bg-base-300" />

                <div className="mt-4 h-4 w-72 animate-pulse rounded bg-base-300" />

                <div className="mt-3 h-4 w-60 animate-pulse rounded bg-base-300" />
              </div>

              <div className="md:text-right">
                <div className="ml-auto h-8 w-36 animate-pulse rounded bg-base-300" />

                <div className="mt-4 ml-auto h-4 w-52 animate-pulse rounded bg-base-300" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-56 animate-pulse rounded-3xl bg-base-100" />

            <div className="h-56 animate-pulse rounded-3xl bg-base-100" />
          </div>

          <div className="mt-6 h-96 animate-pulse rounded-3xl bg-base-100" />
        </div>
      </section>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (isError || !invoice) {
    const errorMessage = getPdfErrorMessage(
      error,
      "We could not load this invoice.",
    );

    return (
      <section className="min-h-screen bg-base-200/40 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-base-300 bg-base-100 p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error/10 text-error">
              <FaFileInvoiceDollar className="text-4xl" />
            </div>

            <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
              Unable to Load Invoice
            </h1>

            <p className="mt-3 text-base-content/60">{errorMessage}</p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => refetch()}
                className="btn btn-primary"
              >
                Try Again
              </button>

              <Link to="/dashboard/my-orders" className="btn btn-outline">
                <FaArrowLeft />
                My Orders
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // INVOICE DATA
  // ==========================================================

  const shop = invoice?.shop || {};
  const customer = invoice?.customer || {};
  const payment = invoice?.payment || {};
  const shipping = invoice?.shipping || {};
  const summary = invoice?.summary || {};

  const items = Array.isArray(invoice?.items) ? invoice.items : [];

  const currency = normalizeString(shop.currency, "BDT");

  const invoiceNumber = normalizeString(
    invoice?.invoiceNumber,
    "Invoice unavailable",
  );

  const orderNumber = normalizeString(invoice?.orderNumber, "N/A");

  const invoiceOrderId = normalizeString(invoice?.orderId, "N/A");

  const shopName = normalizeString(shop.name, "Mamun Biscuit Shop");

  const shopSlogan = normalizeString(shop.slogan);

  const customerName = normalizeString(customer.name, "Customer");

  const customerEmail = normalizeString(customer.email, "N/A");

  const customerPhone = normalizeString(customer.phone, "N/A");

  const customerAddress = normalizeString(customer.address, "N/A");

  const customerCity = normalizeString(customer.city);

  const customerZip = normalizeString(customer.zip);

  const paymentMethod = formatPaymentMethod(payment.method);

  const paymentStatus = formatStatus(payment.status, "Pending");

  /*
   * Your buildInvoice structure stores order status
   * inside shipping.status.
   */
  const orderStatus = formatStatus(shipping.status, "Pending");

  const shippingStatus = formatStatus(shipping.status, "Pending");

  const totalItems = toNumber(summary.totalItems, items.length);

  const totalQuantity = toNumber(
    summary.totalQuantity,
    items.reduce((total, item) => total + getProductQuantity(item), 0),
  );

  const subtotal = toNumber(
    summary.subtotal,
    items.reduce((total, item) => total + getProductSubtotal(item), 0),
  );

  const shippingCharge = toNumber(
    summary.shippingCharge ?? shipping.shippingCharge,
    0,
  );

  const tax = toNumber(summary.tax, 0);

  const discount = toNumber(summary.discount, 0);

  const grandTotal = toNumber(
    summary.grandTotal,
    subtotal + shippingCharge + tax - discount,
  );

  // ==========================================================
  // PDF BUTTON STATE
  // ==========================================================

  const isViewingPdf = pdfAction === "view";
  const isDownloadingPdf = pdfAction === "download";
  const isPdfBusy = Boolean(pdfAction);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="min-h-screen bg-base-200/40 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
          <div>
            <Link
              to="/dashboard/my-orders"
              className="btn btn-ghost btn-sm -ml-2 mb-3"
            >
              <FaArrowLeft />
              Back to My Orders
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FaReceipt className="text-xl" />
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Invoice</h1>

                <p className="text-sm text-base-content/60">{invoiceNumber}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* PRINT */}

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPdfBusy}
              className="btn btn-outline"
            >
              <FaPrint />
              Print
            </button>

            {/* VIEW PDF */}

            <button
              type="button"
              onClick={handleViewPDF}
              disabled={isPdfBusy}
              className="btn btn-outline"
            >
              {isViewingPdf ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFileInvoiceDollar />
              )}

              {isViewingPdf ? "Opening..." : "View PDF"}
            </button>

            {/* DOWNLOAD PDF */}

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isPdfBusy}
              className="btn btn-primary"
            >
              {isDownloadingPdf ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaCloudDownloadAlt />
              )}

              {isDownloadingPdf ? "Downloading..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* ==================================================
            FETCHING INDICATOR
        ================================================== */}

        {isFetching && !isLoading ? (
          <div className="mb-5 flex items-center justify-center gap-2 text-sm text-base-content/50 print:hidden">
            <FaSpinner className="animate-spin" />
            Updating invoice...
          </div>
        ) : null}

        {/* ==================================================
            INVOICE PAPER
        ================================================== */}

        <div className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          {/* ==================================================
              COMPANY HEADER
          ================================================== */}

          <div className="border-b border-base-300 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-content">
                    {shopName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold sm:text-3xl">
                      {shopName}
                    </h2>

                    {shopSlogan ? (
                      <p className="mt-1 text-sm text-base-content/60">
                        {shopSlogan}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 space-y-1 text-sm text-base-content/60">
                  {shop.address ? <p>{shop.address}</p> : null}

                  {shop.phone ? <p>{shop.phone}</p> : null}

                  {shop.email ? <p>{shop.email}</p> : null}

                  {shop.website ? <p>{shop.website}</p> : null}
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Invoice
                </p>

                <h3 className="mt-2 break-all text-2xl font-bold sm:text-3xl">
                  {invoiceNumber}
                </h3>

                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex gap-3 md:justify-end">
                    <span className="text-base-content/50">Order:</span>

                    <span className="font-semibold">{orderNumber}</span>
                  </div>

                  <div className="flex gap-3 md:justify-end">
                    <span className="text-base-content/50">Order ID:</span>

                    <span className="max-w-[260px] break-all font-mono text-xs font-medium">
                      {invoiceOrderId}
                    </span>
                  </div>

                  <div className="flex gap-3 md:justify-end">
                    <span className="text-base-content/50">Date:</span>

                    <span className="font-semibold">
                      {formatDate(invoice.orderDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              STATUS BAR
          ================================================== */}

          <div className="grid grid-cols-1 border-b border-base-300 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-5 sm:border-r sm:border-base-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FaShoppingBag />
              </div>

              <div>
                <p className="text-xs text-base-content/50">Order Status</p>

                <span
                  className={`badge badge-sm mt-1 ${getStatusClass(
                    shipping.status,
                  )}`}
                >
                  {orderStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-base-300 p-5 sm:border-t-0 sm:border-r">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <FaMoneyBillWave />
              </div>

              <div>
                <p className="text-xs text-base-content/50">Payment</p>

                <span
                  className={`badge badge-sm mt-1 ${getStatusClass(
                    payment.status,
                  )}`}
                >
                  {paymentStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-base-300 p-5 sm:border-t-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
                <FaTruck />
              </div>

              <div>
                <p className="text-xs text-base-content/50">Shipping</p>

                <span
                  className={`badge badge-sm mt-1 ${getStatusClass(
                    shipping.status,
                  )}`}
                >
                  {shippingStatus}
                </span>
              </div>
            </div>
          </div>

          {/* ==================================================
              CUSTOMER + PAYMENT
          ================================================== */}

          <div className="grid grid-cols-1 gap-6 border-b border-base-300 p-6 sm:p-8 lg:grid-cols-2 lg:p-10">
            {/* CUSTOMER */}

            <div className="rounded-2xl border border-base-300 p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FaUser />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                    Bill To
                  </p>

                  <h3 className="text-lg font-bold">{customerName}</h3>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <p className="break-all">{customerEmail}</p>

                <p className="flex items-start gap-2">
                  <FaPhone className="mt-1 shrink-0 text-base-content/40" />

                  <span>{customerPhone}</span>
                </p>

                <p className="flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-1 shrink-0 text-base-content/40" />

                  <span>
                    {customerAddress}

                    {customerCity ? `, ${customerCity}` : ""}

                    {customerZip ? ` - ${customerZip}` : ""}
                  </span>
                </p>
              </div>
            </div>

            {/* PAYMENT */}

            <div className="rounded-2xl border border-base-300 p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                  <FaMoneyBillWave />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                    Payment Information
                  </p>

                  <h3 className="text-lg font-bold">{paymentMethod}</h3>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base-content/50">Payment Status</span>

                  <span className={`badge ${getStatusClass(payment.status)}`}>
                    {paymentStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-base-content/50">Shipping Status</span>

                  <span className={`badge ${getStatusClass(shipping.status)}`}>
                    {shippingStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-base-content/50">Currency</span>

                  <span className="font-semibold">{currency}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-base-content/50">Shipping Charge</span>

                  <span className="font-semibold">
                    {formatMoney(shippingCharge, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              ORDER ITEMS
          ================================================== */}

          <div className="border-b border-base-300 p-6 sm:p-8 lg:p-10">
            <div className="mb-5">
              <h2 className="text-xl font-bold sm:text-2xl">Order Items</h2>

              <p className="mt-1 text-sm text-base-content/60">
                {totalItems} item
                {totalItems === 1 ? "" : "s"} · {totalQuantity} unit
                {totalQuantity === 1 ? "" : "s"}
              </p>
            </div>

            {items.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-base-300">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-200/60">
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => {
                      const image = getProductImage(item);

                      const name = getProductName(item);

                      const quantity = getProductQuantity(item);

                      const unitPrice = getProductPrice(item);

                      const itemDiscount = getProductDiscount(item);

                      const itemTotal = getProductSubtotal(item);

                      return (
                        <tr key={item?.productId || item?.sku || index}>
                          <td>
                            <div className="flex min-w-[220px] items-center gap-3">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-200">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={name}
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-base-content/30">
                                    <FaShoppingBag />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold">{name}</p>

                                {item?.brand ? (
                                  <p className="text-xs text-base-content/50">
                                    {item.brand}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="font-mono text-xs">
                              {normalizeString(item?.sku, "-")}
                            </span>
                          </td>

                          <td className="text-center font-semibold">
                            {quantity}
                          </td>

                          <td className="text-right">
                            {formatMoney(unitPrice, currency)}
                          </td>

                          <td className="text-right">
                            {itemDiscount > 0 ? `${itemDiscount}%` : "-"}
                          </td>

                          <td className="text-right font-bold">
                            {formatMoney(itemTotal, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-base-300 p-10 text-center">
                <FaShoppingBag className="mx-auto text-3xl text-base-content/30" />

                <p className="mt-3 font-semibold">No products found</p>
              </div>
            )}
          </div>

          {/* ==================================================
              SUMMARY
          ================================================== */}

          <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:p-10">
            <div>
              <h2 className="text-xl font-bold">Payment Summary</h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-base-content/60">
                Thank you for shopping with {shopName}. Please keep this invoice
                for your records.
              </p>

              <div className="mt-6 rounded-2xl bg-base-200/50 p-5">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="mt-1 shrink-0 text-success" />

                  <div>
                    <p className="font-semibold">
                      Invoice Generated Successfully
                    </p>

                    <p className="mt-1 text-sm text-base-content/60">
                      Invoice #{invoiceNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 p-5 sm:p-6">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-5">
                  <span className="text-base-content/60">Subtotal</span>

                  <span className="font-semibold">
                    {formatMoney(subtotal, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-5">
                  <span className="text-base-content/60">Shipping</span>

                  <span className="font-semibold">
                    {formatMoney(shippingCharge, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-5">
                  <span className="text-base-content/60">VAT / Tax</span>

                  <span className="font-semibold">
                    {formatMoney(tax, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-5">
                  <span className="text-base-content/60">Discount</span>

                  <span className="font-semibold text-success">
                    - {formatMoney(discount, currency)}
                  </span>
                </div>

                <div className="border-t border-base-300 pt-5">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <p className="text-sm text-base-content/60">
                        Grand Total
                      </p>

                      <p className="mt-1 text-2xl font-bold text-primary sm:text-3xl">
                        {formatMoney(grandTotal, currency)}
                      </p>
                    </div>

                    <span className="badge badge-primary">{currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="border-t border-base-300 bg-base-200/40 px-6 py-6 text-center sm:px-8">
            <p className="font-semibold">{shopName}</p>

            <p className="mt-1 text-sm text-base-content/60">
              Thank you for your business.
            </p>

            {shop.website ? (
              <p className="mt-2 text-xs text-base-content/50">
                {shop.website}
              </p>
            ) : null}
          </div>
        </div>

        {/* ==================================================
            BOTTOM ACTIONS
        ================================================== */}

        <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row print:hidden">
          <Link to="/dashboard/my-orders" className="btn btn-ghost">
            <FaArrowLeft />
            Back to My Orders
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPdfBusy}
              className="btn btn-outline"
            >
              <FaPrint />
              Print Invoice
            </button>

            <button
              type="button"
              onClick={handleViewPDF}
              disabled={isPdfBusy}
              className="btn btn-outline"
            >
              {isViewingPdf ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFileInvoiceDollar />
              )}

              {isViewingPdf ? "Opening..." : "View PDF"}
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isPdfBusy}
              className="btn btn-primary"
            >
              {isDownloadingPdf ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaCloudDownloadAlt />
              )}

              {isDownloadingPdf ? "Downloading..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          PRINT STYLES
      ====================================================== */}

      <style>{`
        @media print {
          body {
            background: white !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }

          .min-h-screen {
            min-height: auto !important;
          }

          table {
            break-inside: auto;
          }

          tr {
            break-inside: avoid;
            break-after: auto;
          }

          button,
          a {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </section>
  );
};

export default Invoice;
