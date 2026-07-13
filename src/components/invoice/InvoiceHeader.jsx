import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaDownload,
  FaPrint,
} from "react-icons/fa";

const InvoiceHeader = ({
  onPrint,
  onDownloadPDF,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
      {/* Left */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/my-orders"
          className="btn btn-outline btn-circle"
          title="Back"
        >
          <FaArrowLeft />
        </Link>

        <div>
          <h1 className="text-3xl lg:text-4xl font-bold">
            Invoice
          </h1>

          <p className="text-base-content/70 mt-1">
            View and download your order invoice.
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onPrint}
          className="btn btn-outline"
        >
          <FaPrint />
          Print
        </button>

        <button
          onClick={onDownloadPDF}
          className="btn btn-primary"
        >
          <FaDownload />
          Download PDF
        </button>
      </div>
    </div>
  );
};

InvoiceHeader.propTypes = {
  onPrint: PropTypes.func.isRequired,
  onDownloadPDF: PropTypes.func.isRequired,
};

export default InvoiceHeader;