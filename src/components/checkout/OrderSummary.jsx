import { FaBoxOpen } from "react-icons/fa";

const OrderSummary = ({ cart }) => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-base-100 rounded-2xl shadow-lg border border-base-200 sticky top-24">
        <div className="px-6 py-5 border-b border-base-200">
          <h2 className="text-2xl font-bold">Order Summary</h2>

          <p className="text-sm text-gray-500 mt-1">
            Review your selected products.
          </p>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {cart?.items?.map((item) => (
            <div
              key={item.productId.toString()}
              className="p-5 border-b border-base-200"
            >
              <div className="flex gap-4">
                {/* Product Image */}

                <div className="w-20 h-20 rounded-xl overflow-hidden border bg-base-200 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Information */}

                <div className="flex-1">
                  <h3 className="font-semibold text-base line-clamp-2">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">{item.brand}</p>

                  <span className="badge badge-outline badge-sm mt-2">
                    {item.category}
                  </span>

                  {/* ========================== */}
                  {/* Price */}
                  {/* ========================== */}

                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-bold text-primary">
                      ৳{item.finalPrice.toFixed(2)}
                    </span>

                    {item.discount > 0 && (
                      <span className="text-sm line-through text-gray-400">
                        ৳{item.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* ========================== */}
                  {/* Quantity */}
                  {/* ========================== */}

                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Quantity :</span>

                    <span className="font-semibold ml-2">{item.quantity}</span>
                  </div>

                  {/* ========================== */}
                  {/* Item Subtotal */}
                  {/* ========================== */}

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Subtotal</span>

                    <span className="font-bold text-lg">
                      ৳{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Total Items */}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Items</span>

              <span className="font-semibold">{cart.totalItems}</span>
            </div>

            {/* Total Quantity */}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Quantity</span>

              <span className="font-semibold">{cart.totalQuantity}</span>
            </div>

            {/* Subtotal */}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>

              <span className="font-semibold">৳{cart.subtotal.toFixed(2)}</span>
            </div>

            {/* Discount */}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Discount</span>

              <span className="font-semibold text-success">
                - ৳{cart.totalDiscount.toFixed(2)}
              </span>
            </div>

            {/* Shipping */}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Shipping</span>

              <span className="font-semibold">
                {cart.shipping === 0 ? "Free" : `৳${cart.shipping.toFixed(2)}`}
              </span>
            </div>

            {/* Tax */}

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax</span>

              <span className="font-semibold">৳{cart.tax.toFixed(2)}</span>
            </div>

            <div className="divider my-2"></div>

            {/* Grand Total */}

            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Grand Total</span>

              <span className="text-2xl font-bold text-primary">
                ৳{cart.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* ========================================= */}
          {/* Place Order Button */}
          {/* ========================================= */}

          <button type="submit" className="btn btn-primary btn-lg w-full mt-8">
            Place Order
          </button>

          <p className="text-xs text-center text-gray-500 mt-4 leading-6">
            By placing your order, you agree to our Terms & Conditions and
            confirm that your shipping information is correct.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
