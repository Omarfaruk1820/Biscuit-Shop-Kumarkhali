import { formatCurrency } from "../../utils/helpers.js";

const OrderSummary = ({ invoice }) => {
  const summary = invoice?.summary || {};
  const payment = invoice?.payment || {};
  const currency = invoice?.shop?.currency || "BDT";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Order Summary */}
      <div className="lg:col-span-2">
        <div className="card bg-base-100 shadow-lg border">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-5">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Items</span>
                <span className="font-semibold">{summary.totalItems}</span>
              </div>

              <div className="flex justify-between">
                <span>Total Quantity</span>
                <span className="font-semibold">{summary.totalQuantity}</span>
              </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">
                  {formatCurrency(summary.subtotal, currency)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Shipping Charge</span>

                <span className="font-semibold">
                  {summary.shippingCharge > 0
                    ? formatCurrency(summary.shippingCharge, currency)
                    : "Free"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>VAT / Tax</span>

                <span className="font-semibold">
                  {formatCurrency(summary.tax, currency)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Discount</span>

                <span className="font-semibold text-success">
                  - {formatCurrency(summary.discount, currency)}
                </span>
              </div>

              <div className="divider"></div>

              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Grand Total</span>

                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(summary.grandTotal, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div>
        <div className="card bg-base-100 shadow-lg border">
          <div className="card-body">
            <h2 className="card-title">Payment Summary</h2>

            <div className="space-y-4 mt-4">
              <div className="flex justify-between">
                <span>Method</span>

                <span className="font-semibold uppercase">
                  {payment.method || "COD"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Status</span>

                <span
                  className={`badge ${
                    payment.status === "paid" ? "badge-success" : "badge-error"
                  }`}
                >
                  {(payment.status || "unpaid").toUpperCase()}
                </span>
              </div>

              <div className="divider"></div>

              <div className="text-sm text-gray-500 space-y-2">
                <p>This invoice is generated automatically by the system.</p>

                <p>
                  Please keep this invoice for warranty and future reference.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
