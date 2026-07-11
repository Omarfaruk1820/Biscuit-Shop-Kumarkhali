import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FaArrowLeft,
  FaDownload,
  FaPrint,
  FaReceipt,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaTimesCircle,
} from "react-icons/fa";

import useAxiosSecure from "../../hooks/axiosSecure";

const Invoice = () => {
  // ======================================================
  // ROUTER
  // ======================================================

  const { id } = useParams();

  // ======================================================
  // AXIOS
  // ======================================================

  const axiosSecure = useAxiosSecure();

  // ======================================================
  // FETCH INVOICE
  // GET /orders/invoice/:id
  // ======================================================

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["invoice", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await axiosSecure.get(`/orders/invoice/${id}`);
      return res.data.invoice;
    },
  });

  console.log("Invoice ID:", id);

console.log("Error:", error);

console.log("Response:", error?.response?.data);



  const invoice = data;

  // ======================================================
  // FORMAT MONEY
  // ======================================================

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(Number(value));

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ======================================================
  // PAYMENT BADGE
  // ======================================================

  const paymentBadge = (status = "") => {
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

  // ======================================================
  // SHIPPING BADGE
  // ======================================================

  const shippingBadge = (status = "") => {
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
        return "badge";
    }
  };

  // ======================================================
  // SHIPPING ICON
  // ======================================================

  const shippingIcon = (status = "") => {
    switch (status.toLowerCase()) {
      case "pending":
        return <FaClock />;

      case "processing":
        return <FaClock />;

      case "shipped":
        return <FaTruck />;

      case "delivered":
        return <FaCheckCircle />;

      default:
        return <FaTimesCircle />;
    }
  };

  // ======================================================
  // TOTAL PRODUCTS
  // ======================================================

  const totalProducts = useMemo(() => {
    if (!invoice?.items) return 0;

    return invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [invoice]);

  // ======================================================
  // DOWNLOAD PDF
  // GET /orders/invoice/pdf/:id
  // ======================================================

  const handleDownloadPDF = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/orders/invoice/pdf/${id}`,
      "_blank",
    );
  };

  // ======================================================
  // PRINT
  // ======================================================

  const handlePrint = () => {
    window.print();
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (isError || !invoice) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-base-200 px-4">
        <div className="card bg-base-100 shadow-xl p-10 text-center max-w-md w-full">
          <FaReceipt className="mx-auto text-6xl text-error mb-5" />

          <h2 className="text-3xl font-bold">Failed to Load Invoice</h2>

          <p className="mt-4 text-gray-500">
            {error?.response?.data?.message || "Invoice not found."}
          </p>

          <Link to="/dashboard/my-orders" className="btn btn-primary mt-8">
            <FaArrowLeft />
            Back To Orders
          </Link>
        </div>
      </div>
    );
  }

  // ======================================================
  // MAIN JSX STARTS HERE
  // ======================================================

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ====================================================== */}
        {/* Top Action Bar */}
        {/* ====================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/my-orders" className="btn btn-outline">
              <FaArrowLeft />
              Back
            </Link>

            <div>
              <h1 className="text-3xl font-bold">Invoice</h1>

              <p className="text-gray-500 mt-1">Order Invoice Details</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={handlePrint} className="btn btn-outline">
              <FaPrint />
              Print
            </button>

            <button onClick={handleDownloadPDF} className="btn btn-primary">
              <FaDownload />
              Download PDF
            </button>
          </div>
        </div>

        {/* ====================================================== */}
        {/* Invoice Card */}
        {/* ====================================================== */}

        <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden">
          {/* ====================================================== */}
          {/* Company + Invoice Header */}
          {/* ====================================================== */}

          <div className="bg-primary text-primary-content p-8">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              {/* Company Information */}

              <div>
                <h2 className="text-4xl font-extrabold">Biscuit Shop</h2>

                <p className="mt-2 opacity-90">
                  Premium Biscuit & Snacks Store
                </p>

                <div className="mt-6 space-y-2 text-sm">
                  <p>📍 Dhaka, Bangladesh</p>

                  <p>📞 +880 1700-000000</p>

                  <p>✉ support@biscuitshop.com</p>

                  <p>🌐 www.biscuitshop.com</p>
                </div>
              </div>

              {/* Invoice Information */}

              <div className="text-left lg:text-right">
                <h2 className="text-5xl font-black">INVOICE</h2>

                <div className="mt-6 space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Invoice No :</span>{" "}
                    {invoice.invoiceNumber}
                  </p>

                  <p>
                    <span className="font-semibold">Order No :</span>{" "}
                    {invoice.orderNumber}
                  </p>

                  <p>
                    <span className="font-semibold">Order Date :</span>{" "}
                    {formatDate(invoice.orderDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* Customer + Payment */}
          {/* ====================================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Customer */}

            <div>
              <h3 className="text-lg font-bold mb-4">Customer Information</h3>

              <div className="space-y-2">
                <p>
                  <strong>Name :</strong> {invoice.customer?.name}
                </p>

                <p>
                  <strong>Email :</strong> {invoice.customer?.email}
                </p>

                <p>
                  <strong>Phone :</strong> {invoice.customer?.phone}
                </p>

                <p>
                  <strong>Address :</strong> {invoice.customer?.address}
                </p>

                <p>
                  <strong>City :</strong> {invoice.customer?.city}
                </p>

                <p>
                  <strong>ZIP :</strong> {invoice.customer?.zip}
                </p>
              </div>
            </div>

            {/* Payment */}

            <div>
              <h3 className="text-lg font-bold mb-4">Payment Information</h3>

              <div className="space-y-3">
                <p>
                  <strong>Method :</strong>{" "}
                  {invoice.payment?.method?.toUpperCase()}
                </p>

                <div className="flex items-center gap-2">
                  <strong>Status :</strong>

                  <span className={paymentBadge(invoice.payment?.status)}>
                    {invoice.payment?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping */}

            <div>
              <h3 className="text-lg font-bold mb-4">Shipping Information</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {shippingIcon(invoice.shipping?.status)}

                  <span className={shippingBadge(invoice.shipping?.status)}>
                    {invoice.shipping?.status}
                  </span>
                </div>

                <p>
                  <strong>Total Products :</strong> {totalProducts}
                </p>

                <p>
                  <strong>Total Items :</strong> {invoice.summary?.totalItems}
                </p>
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* Part 3 Starts Here */}
          {/* ====================================================== */}
          {/* ====================================================== */}
          {/* Desktop Product Table */}
          {/* ====================================================== */}

          <div className="hidden lg:block px-8 pb-8 overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>Image</th>

                  <th>SKU</th>

                  <th>Product</th>

                  <th className="text-center">Qty</th>

                  <th className="text-right">Unit Price</th>

                  <th className="text-right">Discount</th>

                  <th className="text-right">Final Price</th>

                  <th className="text-right">Line Total</th>
                </tr>
              </thead>

              <tbody>
                {invoice.items?.map((item) => (
                  <tr key={item.productId || item._id}>
                    {/* Image */}

                    <td>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    </td>

                    {/* SKU */}

                    <td>{item.sku || "-"}</td>

                    {/* Product */}

                    <td>
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                      </div>
                    </td>

                    {/* Quantity */}

                    <td className="text-center">{item.quantity}</td>

                    {/* Unit Price */}

                    <td className="text-right">{formatCurrency(item.price)}</td>

                    {/* Discount */}

                    <td className="text-right">{item.discount}%</td>

                    {/* Final Price */}

                    <td className="text-right">
                      {formatCurrency(item.finalPrice)}
                    </td>

                    {/* Line Total */}

                    <td className="text-right font-bold">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ====================================================== */}
          {/* Mobile Product Cards */}
          {/* ====================================================== */}

          <div className="lg:hidden px-4 pb-6 space-y-5">
            {invoice.items?.map((item) => (
              <div
                key={item.productId || item._id}
                className="bg-base-100 border rounded-xl shadow-md p-4"
              >
                <div className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover border"
                  />

                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.name}</h3>

                    <p className="text-sm text-gray-500 mt-1">
                      SKU : {item.sku || "-"}
                    </p>
                  </div>
                </div>

                <div className="divider my-4"></div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Quantity</span>

                    <p>{item.quantity}</p>
                  </div>

                  <div>
                    <span className="font-semibold">Unit Price</span>

                    <p>{formatCurrency(item.price)}</p>
                  </div>

                  <div>
                    <span className="font-semibold">Discount</span>

                    <p>{item.discount}%</p>
                  </div>

                  <div>
                    <span className="font-semibold">Final Price</span>

                    <p>{formatCurrency(item.finalPrice)}</p>
                  </div>
                </div>

                <div className="divider my-4"></div>

                <div className="flex justify-between items-center">
                  <span className="font-bold">Line Total</span>

                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ====================================================== */}
          {/* Part 4 Starts Here */}
          {/* ====================================================== */}
          {/* ====================================================== */}
          {/* Order Summary + Status Cards */}
          {/* ====================================================== */}

          <div className="px-4 lg:px-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ====================================================== */}
              {/* Order Summary */}
              {/* ====================================================== */}

              <div className="lg:col-span-2">
                <div className="card bg-base-100 border shadow-lg">
                  <div className="card-body">
                    <h2 className="card-title text-2xl mb-5">Order Summary</h2>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Items</span>

                        <span className="font-semibold">
                          {invoice.summary?.totalItems}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Quantity</span>

                        <span className="font-semibold">
                          {invoice.summary?.totalQuantity}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>

                        <span className="font-semibold">
                          {formatCurrency(invoice.summary?.subtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Shipping Charge</span>

                        <span className="font-semibold">
                          {invoice.summary?.shippingCharge > 0
                            ? formatCurrency(invoice.summary.shippingCharge)
                            : "Free"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">VAT / Tax</span>

                        <span className="font-semibold">
                          {formatCurrency(invoice.summary?.tax)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Discount</span>

                        <span className="font-semibold text-success">
                          - {formatCurrency(invoice.summary?.discount)}
                        </span>
                      </div>

                      <div className="divider my-2"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Grand Total</span>

                        <span className="text-2xl font-extrabold text-primary">
                          {formatCurrency(invoice.summary?.grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ====================================================== */}
              {/* Status Cards */}
              {/* ====================================================== */}

              <div className="space-y-5">
                {/* Payment Status */}

                <div className="card bg-base-100 border shadow-lg">
                  <div className="card-body">
                    <h3 className="font-bold text-lg mb-4">Payment Status</h3>

                    <span
                      className={`${paymentBadge(
                        invoice.payment?.status,
                      )} badge-lg`}
                    >
                      {invoice.payment?.status?.toUpperCase()}
                    </span>

                    <div className="mt-5 text-sm text-gray-500">
                      <p>
                        <strong>Method :</strong>{" "}
                        {invoice.payment?.method?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Status */}

                <div className="card bg-base-100 border shadow-lg">
                  <div className="card-body">
                    <h3 className="font-bold text-lg mb-4">Shipping Status</h3>

                    <div className="flex items-center gap-3">
                      {shippingIcon(invoice.shipping?.status)}

                      <span
                        className={`${shippingBadge(
                          invoice.shipping?.status,
                        )} badge-lg`}
                      >
                        {invoice.shipping?.status?.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-5 text-sm text-gray-500">
                      <p>
                        Your order is currently
                        <span className="font-semibold">
                          {" "}
                          {invoice.shipping?.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* Part 5 Starts Here */}
          {/* ====================================================== */}
          {/* ====================================================== */}
          {/* Thank You Section */}
          {/* ====================================================== */}

          <div className="px-4 lg:px-8 pb-8">
            <div className="bg-primary text-primary-content rounded-2xl p-8 text-center shadow-lg">
              <h2 className="text-3xl font-bold">
                🎉 Thank You For Your Order!
              </h2>

              <p className="mt-4 max-w-3xl mx-auto opacity-90 leading-7">
                Thank you for shopping with <strong>Biscuit Shop</strong>. We
                sincerely appreciate your trust in us. Your order has been
                received successfully and our team is working to process it as
                quickly as possible.
              </p>
            </div>
          </div>

          {/* ====================================================== */}
          {/* Support Information */}
          {/* ====================================================== */}

          <div className="px-4 lg:px-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Support */}

              <div className="card bg-base-100 border shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">Shop Support</h2>

                  <div className="space-y-3 mt-4">
                    <p>
                      <strong>Shop:</strong> Biscuit Shop
                    </p>

                    <p>
                      <strong>Email:</strong> support@biscuitshop.com
                    </p>

                    <p>
                      <strong>Phone:</strong> +880 1700-000000
                    </p>

                    <p>
                      <strong>Website:</strong> www.biscuitshop.com
                    </p>

                    <p>
                      <strong>Address:</strong> Dhaka, Bangladesh
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}

              <div className="card bg-base-100 border shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">Terms & Conditions</h2>

                  <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-gray-600">
                    <li>
                      Please keep this invoice for warranty and future
                      reference.
                    </li>

                    <li>
                      Products can only be returned according to our return
                      policy.
                    </li>

                    <li>
                      Refunds are processed after successful product inspection.
                    </li>

                    <li>Shipping dates may vary depending on your location.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* Signature */}
          {/* ====================================================== */}

          <div className="px-4 lg:px-8 pb-8">
            <div className="flex justify-end">
              <div className="text-center">
                <div className="border-b-2 border-gray-500 w-52 mb-2"></div>

                <p className="font-semibold">Authorized Signature</p>
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* Footer */}
          {/* ====================================================== */}

          <footer className="bg-base-300 border-t">
            <div className="max-w-7xl mx-auto px-6 py-8 text-center">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Biscuit Shop. All Rights Reserved.
              </p>

              <p className="text-xs text-gray-400 mt-2">
                This invoice is generated electronically and does not require a
                physical signature.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
