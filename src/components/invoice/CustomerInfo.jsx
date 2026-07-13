// import PropTypes from "prop-types";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaTruck,
} from "react-icons/fa";

const CustomerInfo = ({ invoice }) => {
  const customer = invoice?.customer || {};
  const payment = invoice?.payment || {};
  const shipping = invoice?.shipping || {};
  const summary = invoice?.summary || {};

  const paymentBadge = (status = "") => {
    switch (status.toLowerCase()) {
      case "paid":
        return "badge badge-success";

      case "unpaid":
        return "badge badge-error";

      default:
        return "badge badge-warning";
    }
  };

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Customer */}

      <div className="card bg-base-100 shadow border">
        <div className="card-body">
          <h2 className="card-title">
            <FaUser className="text-primary" />
            Customer Information
          </h2>

          <div className="space-y-3 mt-4">
            <p>
              <strong>Name:</strong> {customer.name || "-"}
            </p>

            <p className="flex items-center gap-2">
              <FaEnvelope />
              {customer.email || "-"}
            </p>

            <p className="flex items-center gap-2">
              <FaPhone />
              {customer.phone || "-"}
            </p>

            <p className="flex items-start gap-2">
              <FaMapMarkerAlt className="mt-1" />

              <span>
                {customer.address || "-"}
                <br />
                {customer.city || "-"} {customer.zip || ""}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Payment */}

      <div className="card bg-base-100 shadow border">
        <div className="card-body">
          <h2 className="card-title">
            <FaMoneyBillWave className="text-success" />
            Payment Information
          </h2>

          <div className="space-y-4 mt-4">
            <p>
              <strong>Method:</strong> {(payment.method || "COD").toUpperCase()}
            </p>

            <div className="flex items-center gap-3">
              <strong>Status:</strong>

              <span className={paymentBadge(payment.status)}>
                {(payment.status || "unpaid").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping */}

      <div className="card bg-base-100 shadow border">
        <div className="card-body">
          <h2 className="card-title">
            <FaTruck className="text-info" />
            Shipping Information
          </h2>

          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <strong>Status:</strong>

              <span className={shippingBadge(shipping.status)}>
                {(shipping.status || "pending").toUpperCase()}
              </span>
            </div>

            <p>
              <strong>Total Items:</strong> {summary.totalItems ?? 0}
            </p>

            <p>
              <strong>Total Quantity:</strong> {summary.totalQuantity ?? 0}
            </p>

            <p>
              <strong>Shipping Charge:</strong> ৳{summary.shippingCharge ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// CustomerInfo.propTypes = {
//   invoice: PropTypes.object.isRequired,
// };

export default CustomerInfo;
