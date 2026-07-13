import PropTypes from "prop-types";

const InvoiceFooter = ({ shop }) => {
  return (
    <div className="space-y-6">
      {/* Thank You */}
      <div className="bg-primary text-primary-content rounded-2xl p-8 text-center shadow-lg">
        <h2 className="text-3xl font-bold">
          🎉 Thank You For Your Order!
        </h2>

        <p className="mt-4 max-w-3xl mx-auto opacity-90 leading-7">
          Thank you for shopping with{" "}
          <strong>{shop?.name || "Biscuit Shop"}</strong>.
          We appreciate your trust and support.
          Your order has been received successfully and our team
          is processing it as quickly as possible.
        </p>
      </div>

      {/* Support + Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support */}
        <div className="card bg-base-100 border shadow-lg">
          <div className="card-body">
            <h2 className="card-title">
              Shop Support
            </h2>

            <div className="space-y-3 mt-4">
              <p>
                <strong>Shop:</strong>{" "}
                {shop?.name || "Biscuit Shop"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {shop?.email || "support@biscuitshop.com"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {shop?.phone || "+880 1700-000000"}
              </p>

              <p>
                <strong>Website:</strong>{" "}
                {shop?.website || "www.biscuitshop.com"}
              </p>

              <p>
                <strong>Address:</strong>{" "}
                {shop?.address || "Dhaka, Bangladesh"}
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="card bg-base-100 border shadow-lg">
          <div className="card-body">
            <h2 className="card-title">
              Terms & Conditions
            </h2>

            <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-gray-600">
              <li>
                Please keep this invoice for warranty
                and future reference.
              </li>

              <li>
                Products can only be returned according
                to our return policy.
              </li>

              <li>
                Refunds are processed after successful
                product inspection.
              </li>

              <li>
                Shipping dates may vary depending on
                your location.
              </li>

              <li>
                This invoice is generated electronically.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="flex justify-end">
        <div className="text-center">
          <div className="border-b-2 border-gray-500 w-52 mb-2"></div>

          <p className="font-semibold">
            Authorized Signature
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-base-300 border rounded-xl">
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()}{" "}
            {shop?.name || "Biscuit Shop"}.
            All Rights Reserved.
          </p>

          <p className="text-xs text-gray-400 mt-2">
            This invoice is generated electronically
            and does not require a physical signature.
          </p>
        </div>
      </footer>
    </div>
  );
};

InvoiceFooter.propTypes = {
  shop: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    website: PropTypes.string,
    address: PropTypes.string,
  }),
};

export default InvoiceFooter;