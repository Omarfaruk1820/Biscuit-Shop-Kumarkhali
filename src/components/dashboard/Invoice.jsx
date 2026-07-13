import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../../hooks/axiosSecure";

import InvoiceHeader from "../invoice/InvoiceHeader";
import CustomerInfo from "../invoice/CustomerInfo";
import ProductTable from "../invoice/ProductTable";
import OrderSummary from "../invoice/OrderSummary";

const Invoice = () => {
  const { id } = useParams();

  const axiosSecure = useAxiosSecure();

  const {
    data: invoice,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["invoice", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await axiosSecure.get(`/orders/invoice/${id}`);
      return res.data.invoice;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/orders/invoice/pdf/${id}`,
      "_blank",
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold">Failed to Load Invoice</h2>

        <p className="mt-4">
          {error?.response?.data?.message || "Invoice not found"}
        </p>

        <Link to="/dashboard/my-orders" className="btn btn-primary mt-6">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <InvoiceHeader
        invoice={invoice}
        onPrint={handlePrint}
        onDownload={handleDownloadPDF}
      />

      {/* Customer Section */}
      <CustomerInfo invoice={invoice} />
      {/* Product Table */}
      <ProductTable invoice={invoice} />
      {/* Order Summary */}
      <OrderSummary invoice={invoice} />
      {/* Payment */}

      {/* Footer */}
    </div>
  );
};

export default Invoice;
