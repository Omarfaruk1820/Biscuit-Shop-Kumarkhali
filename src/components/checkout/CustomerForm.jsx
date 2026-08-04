import {
  FaUser,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCity,
  FaMapSigns,
} from "react-icons/fa";

const CustomerForm = ({ register, errors, validation }) => {
  return (
    <div className="lg:col-span-2">
      {/* ========================================= */}
      {/* Customer Information */}
      {/* ========================================= */}

      <div className="bg-base-100 rounded-2xl shadow-lg border border-base-200">
        {/* Header */}

        <div className="border-b border-base-200 px-6 py-5">
          <h2 className="text-2xl font-bold">Customer Information</h2>

          <p className="text-sm text-gray-500 mt-1">
            Enter your shipping information carefully.
          </p>
        </div>

        {/* Body */}

        <div className="p-6 space-y-6">
          {/* ========================================= */}
          {/* Full Name */}
          {/* ========================================= */}

          <div>
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <FaUser className="text-primary" />
                Full Name
              </span>
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              className={`input input-bordered w-full ${
                errors.name ? "input-error" : ""
              }`}
              {...register("name", validation.name)}
            />

            {errors.name && (
              <p className="text-error text-sm mt-2">{errors.name.message}</p>
            )}
          </div>

          {/* ========================================= */}
          {/* Phone */}
          {/* ========================================= */}

          <div>
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <FaPhoneAlt className="text-primary" />
                Phone Number
              </span>
            </label>

            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              className={`input input-bordered w-full ${
                errors.phone ? "input-error" : ""
              }`}
              {...register("phone", validation.phone)}
            />

            {errors.phone && (
              <p className="text-error text-sm mt-2">{errors.phone.message}</p>
            )}
          </div>

          {/* ========================================= */}
          {/* Shipping Address */}
          {/* ========================================= */}

          <div>
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary" />
                Shipping Address
              </span>
            </label>

            <textarea
              rows={4}
              placeholder="House No, Road No, Village, Area..."
              className={`textarea textarea-bordered w-full ${
                errors.address ? "textarea-error" : ""
              }`}
              {...register("address", validation.address)}
            />

            {errors.address && (
              <p className="text-error text-sm mt-2">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* ========================================= */}
          {/* City & Area */}
          {/* ========================================= */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* City */}

            <div>
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <FaCity className="text-primary" />
                  City
                </span>
              </label>

              <input
                type="text"
                placeholder="Dhaka"
                className={`input input-bordered w-full ${
                  errors.city ? "input-error" : ""
                }`}
                {...register("city", validation.city)}
              />

              {errors.city && (
                <p className="text-error text-sm mt-2">{errors.city.message}</p>
              )}
            </div>

            {/* Area */}

            <div>
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <FaMapSigns className="text-primary" />
                  Area
                </span>
              </label>

              <input
                type="text"
                placeholder="Mirpur / Dhanmondi / Uttara"
                className={`input input-bordered w-full ${
                  errors.area ? "input-error" : ""
                }`}
                {...register("area", validation.area)}
              />

              {errors.area && (
                <p className="text-error text-sm mt-2">{errors.area.message}</p>
              )}
            </div>
          </div>

          {/* ===================================================== */}
          {/* CustomerForm Part 2 starts from here */}
          {/* Order Notes */}
          {/* Payment Method */}
          {/* Terms & Conditions */}
          {/* ===================================================== */}
          {/* ========================================= */}
          {/* Order Notes */}
          {/* ========================================= */}

          <div>
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <FaStickyNote className="text-primary" />
                Order Notes (Optional)
              </span>
            </label>

            <textarea
              rows={4}
              placeholder="Write any delivery instructions..."
              className={`textarea textarea-bordered w-full ${
                errors.note ? "textarea-error" : ""
              }`}
              {...register("note", validation.note)}
            />

            {errors.note && (
              <p className="text-error text-sm mt-2">{errors.note.message}</p>
            )}
          </div>

          {/* ========================================= */}
          {/* Payment Method */}
          {/* ========================================= */}

          <div>
            <label className="label">
              <span className="label-text font-semibold">Payment Method</span>
            </label>

            <div className="border rounded-xl p-5 bg-base-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="cash_on_delivery"
                  className="radio radio-primary"
                  {...register("paymentMethod")}
                  defaultChecked
                />

                <div>
                  <h3 className="font-semibold">Cash on Delivery</h3>

                  <p className="text-sm text-gray-500">
                    Pay when your order is delivered.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ========================================= */}
          {/* Terms & Conditions */}
          {/* ========================================= */}

          <div className="border rounded-xl p-5 bg-base-100">
            <label className="cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary mt-1"
                {...register("agree", validation.agree)}
              />

              <span className="text-sm leading-6">
                I agree to the Terms & Conditions and understand that my order
                will be processed according to the store policy.
              </span>
            </label>

            {errors.agree && (
              <p className="text-error text-sm mt-3">{errors.agree.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
