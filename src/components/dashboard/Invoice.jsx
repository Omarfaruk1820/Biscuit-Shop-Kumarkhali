import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaCloudDownloadAlt,
  FaFileInvoiceDollar,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPhone,
  FaPrint,
  FaReceipt,
  FaShoppingBag,
  FaSpinner,
  FaTruck,
  FaUser,
} from "react-icons/fa";

import axiosSecure from "../../hooks/axiosSecure";

// ============================================================
// HELPERS
// ============================================================

const normalizeString = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim();

  return normalized || fallback;
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
  const normalized = normalizeString(value, fallback);

  return normalized
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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
  const finalPrice = item?.finalPrice;

  if (finalPrice !== undefined && finalPrice !== null) {
    return toNumber(finalPrice, getProductPrice(item));
  }

  const price = getProductPrice(item);
  const discount = getProductDiscount(item);

  return price - (price * discount) / 100;
};

const getProductSubtotal = (item) => {
  const subtotal = item?.subtotal;

  if (subtotal !== undefined && subtotal !== null) {
    return toNumber(subtotal);
  }

  return getProductFinalPrice(item) * getProductQuantity(item);
};

// ============================================================
// COMPONENT
// ============================================================

const Invoice = () => {
  const { id } = useParams();

  const {
    data: invoice,
    isLoading,
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

    staleTime: 1000 * 60 * 5,

    gcTime: 1000 * 60 * 10,

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
  // DOWNLOAD PDF
  // ==========================================================

  const handleDownloadPDF = () => {
    if (!id) {
      return;
    }

    const apiUrl = normalizeString(import.meta.env.VITE_API_URL);

    if (!apiUrl) {
      return;
    }

    const pdfUrl = `${apiUrl.replace(/\/+$/, "")}/invoices/invoice/pdf/${id}`;

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  // ==========================================================
  // OPEN PDF PREVIEW
  // ==========================================================

  const handleViewPDF = () => {
    if (!id) {
      return;
    }

    const apiUrl = normalizeString(import.meta.env.VITE_API_URL);

    if (!apiUrl) {
      return;
    }

    const pdfUrl = `${apiUrl.replace(/\/+$/, "")}/invoices/invoice/view/${id}`;

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

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
    const statusCode = error?.response?.status;

    let errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "We could not load this invoice.";

    if (statusCode === 401) {
      errorMessage = "Your session has expired. Please sign in again.";
    }

    if (statusCode === 403) {
      errorMessage = "You are not allowed to access this invoice.";
    }

    if (statusCode === 404) {
      errorMessage = "The requested invoice could not be found.";
    }

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

  const orderId = normalizeString(invoice?.orderId, "N/A");

  const shopName = normalizeString(shop.name, "Your Store");

  const shopSlogan = normalizeString(shop.slogan);

  const customerName = normalizeString(customer.name, "Customer");

  const customerEmail = normalizeString(customer.email, "N/A");

  const customerPhone = normalizeString(customer.phone, "N/A");

  const customerAddress = normalizeString(customer.address, "N/A");

  const customerCity = normalizeString(customer.city);

  const customerZip = normalizeString(customer.zip);

  const paymentMethod = formatStatus(payment.method, "Cash on Delivery");

  const paymentStatus = formatStatus(payment.status, "Pending");

  const orderStatus = formatStatus(invoice?.status, "Pending");

  const shippingStatus = formatStatus(shipping.status, "Pending");

  const totalItems = toNumber(
    summary.totalItems ?? invoice.totalItems,
    items.length,
  );

  const totalQuantity = toNumber(
    summary.totalQuantity ?? invoice.totalQuantity,
    items.reduce((total, item) => total + getProductQuantity(item), 0),
  );

  const subtotal = toNumber(
    summary.subtotal ?? invoice.subtotal,
    items.reduce((total, item) => total + getProductSubtotal(item), 0),
  );

  const shippingCharge = toNumber(
    summary.shippingCharge ?? invoice.shipping,
    shipping.shippingCharge ?? 0,
  );

  const tax = toNumber(summary.tax ?? invoice.tax, 0);

  const discount = toNumber(summary.discount ?? invoice.totalDiscount, 0);

  const grandTotal = toNumber(
    summary.grandTotal ?? invoice.grandTotal,
    subtotal + shippingCharge + tax - discount,
  );

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
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-outline"
            >
              <FaPrint />
              Print
            </button>

            <button
              type="button"
              onClick={handleViewPDF}
              className="btn btn-outline"
            >
              <FaFileInvoiceDollar />
              View PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="btn btn-primary"
            >
              <FaCloudDownloadAlt />
              Download PDF
            </button>
          </div>
        </div>

        {/* ==================================================
            INVOICE PAPER
        ================================================== */}

        <div className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          {/* =================================================
              COMPANY HEADER
          ================================================= */}

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
                      {orderId}
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

          {/* =================================================
              STATUS STRIP
          ================================================= */}

          <div className="grid grid-cols-1 border-b border-base-300 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-5 sm:border-r sm:border-base-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FaShoppingBag />
              </div>

              <div>
                <p className="text-xs text-base-content/50">Order Status</p>

                <span
                  className={`badge badge-sm mt-1 ${getStatusClass(
                    invoice?.status,
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

          {/* =================================================
              CUSTOMER + PAYMENT
          ================================================= */}

          <div className="grid grid-cols-1 gap-6 border-b border-base-300 p-6 sm:p-8 lg:grid-cols-2 lg:p-10">
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

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <div className="border-b border-base-300 p-6 sm:p-8 lg:p-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">Order Items</h2>

                <p className="mt-1 text-sm text-base-content/60">
                  {totalItems} item{totalItems === 1 ? "" : "s"} ·{" "}
                  {totalQuantity} unit
                  {totalQuantity === 1 ? "" : "s"}
                </p>
              </div>
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

          {/* =================================================
              SUMMARY
          ================================================= */}

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

          {/* =================================================
              FOOTER
          ================================================= */}

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
            BACK / ACTIONS
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
              className="btn btn-outline"
            >
              <FaPrint />
              Print Invoice
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="btn btn-primary"
            >
              <FaCloudDownloadAlt />
              Download PDF
            </button>
          </div>
        </div>

        {/* ==================================================
            BACKGROUND FETCH INDICATOR
        ================================================== */}

        {isFetching && !isLoading ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-base-content/50 print:hidden">
            <FaSpinner className="animate-spin" />
            Updating invoice...
          </div>
        ) : null}
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

          button,
          a {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          table {
            break-inside: auto;
          }

          tr {
            break-inside: avoid;
            break-after: auto;
          }
        }
      `}</style>
    </section>
  );
};

export default Invoice;
