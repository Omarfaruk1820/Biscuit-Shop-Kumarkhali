import PropTypes from "prop-types";
import { FaMoneyBillWave } from "react-icons/fa";

const PaymentMethod = ({ register, errors }) => {
  return (
    <div className="bg-base-100 rounded-2xl shadow-lg border border-base-200">
      {/* Header */}

      <div className="border-b border-base-200 px-6 py-5">
        <h2 className="text-2xl font-bold">Payment Method</h2>

        <p className="text-sm text-gray-500 mt-1">
          Select how you would like to pay.
        </p>
      </div>

      {/* Body */}

      <div className="p-6">
        <label className="flex items-start gap-4 border border-primary rounded-xl p-5 cursor-pointer hover:bg-base-200 transition">
          <input
            type="radio"
            value="cash_on_delivery"
            defaultChecked
            className="radio radio-primary mt-1"
            {...register("paymentMethod")}
          />

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <FaMoneyBillWave className="text-2xl text-primary" />

              <h3 className="font-bold text-lg">Cash on Delivery</h3>
            </div>

            <p className="text-gray-500 text-sm mt-2">
              Pay in cash when your order is delivered to your address.
            </p>

            <div className="mt-4">
              <span className="badge badge-success">Available</span>
            </div>
          </div>
        </label>

        {errors?.paymentMethod && (
          <p className="text-error text-sm mt-4">
            {errors.paymentMethod.message}
          </p>
        )}

        {/* Future Payment Gateways */}

        <div className="mt-8">
          <h4 className="font-semibold mb-3">Coming Soon</h4>

          <div className="grid grid-cols-1 gap-3">
            <div className="border rounded-xl p-4 opacity-50 cursor-not-allowed">
              SSLCommerz
            </div>

            <div className="border rounded-xl p-4 opacity-50 cursor-not-allowed">
              bKash
            </div>

            <div className="border rounded-xl p-4 opacity-50 cursor-not-allowed">
              Nagad
            </div>

            <div className="border rounded-xl p-4 opacity-50 cursor-not-allowed">
              Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PaymentMethod.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
};

export default PaymentMethod;
