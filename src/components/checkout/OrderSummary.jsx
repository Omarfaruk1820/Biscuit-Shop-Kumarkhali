import { FaBoxOpen } from "react-icons/fa";

const OrderSummary = ({ cart, isSubmitting = false }) => {
  // ============================================================
  // HELPERS
  // ============================================================

  const toNumber = (value, fallback = 0) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  };

  const formatPrice = (value) => {
    return toNumber(value).toFixed(2);
  };

  const getProductId = (productId, index) => {
    if (productId === null || productId === undefined) {
      return `cart-item-${index}`;
    }

    return String(productId);
  };

  const getImage = (image) => {
    return typeof image === "string" && image.trim() ? image.trim() : "";
  };

  // ============================================================
  // CART DATA
  // ============================================================

  const items = Array.isArray(cart?.items) ? cart.items : [];

  const totalItems = toNumber(cart?.totalItems);
  const totalQuantity = toNumber(cart?.totalQuantity);
  const subtotal = toNumber(cart?.subtotal);
  const totalDiscount = toNumber(cart?.totalDiscount);
  const shipping = toNumber(cart?.shipping);
  const tax = toNumber(cart?.tax);
  const grandTotal = toNumber(cart?.grandTotal);

  return (
    <div className="bg-base-100 rounded-2xl shadow-lg border border-base-200 sticky top-24 overflow-hidden">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="px-6 py-5 border-b border-base-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FaBoxOpen className="text-xl" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">Order Summary</h2>

            <p className="text-sm text-gray-500 mt-1">
              Review your selected products.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          CART ITEMS
      ====================================================== */}

      <div className="max-h-[500px] overflow-y-auto">
        {items.length > 0 ? (
          items.map((item, index) => {
            const price = toNumber(item?.price);
            const discount = toNumber(item?.discount);
            const finalPrice = toNumber(item?.finalPrice, price);

            const quantity = Math.max(1, toNumber(item?.quantity, 1));

            const itemSubtotal = toNumber(
              item?.subtotal,
              finalPrice * quantity,
            );

            const image = getImage(item?.image);

            return (
              <div
                key={getProductId(item?.productId, index)}
                className="p-5 border-b border-base-200"
              >
                <div className="flex gap-4">
                  {/* Product Image */}

                  <div className="w-20 h-20 rounded-xl overflow-hidden border bg-base-200 flex-shrink-0">
                    {image ? (
                      <img
                        src={image}
                        alt={item?.name || "Product"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FaBoxOpen className="text-2xl" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base line-clamp-2">
                      {item?.name || "Unknown Product"}
                    </h3>

                    {item?.brand && (
                      <p className="text-sm text-gray-500 mt-1">{item.brand}</p>
                    )}

                    {item?.category && (
                      <span className="badge badge-outline badge-sm mt-2">
                        {item.category}
                      </span>
                    )}

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-primary">
                        ৳{formatPrice(finalPrice)}
                      </span>

                      {discount > 0 && price > finalPrice && (
                        <span className="text-sm line-through text-gray-400">
                          ৳{formatPrice(price)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Quantity:</span>

                      <span className="font-semibold ml-2">{quantity}</span>
                    </div>

                    <div className="mt-2 flex justify-between items-center gap-4">
                      <span className="text-sm text-gray-500">Subtotal</span>

                      <span className="font-bold text-lg">
                        ৳{formatPrice(itemSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <FaBoxOpen className="text-4xl text-gray-400 mx-auto mb-3" />

            <p className="font-semibold">No products found.</p>

            <p className="text-sm text-gray-500 mt-1">
              Your cart is currently empty.
            </p>
          </div>
        )}
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Items</span>

            <span className="font-semibold">{totalItems}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Quantity</span>

            <span className="font-semibold">{totalQuantity}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal</span>

            <span className="font-semibold">৳{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Discount</span>

            <span className="font-semibold text-success">
              - ৳{formatPrice(totalDiscount)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Shipping</span>

            <span className="font-semibold">
              {shipping === 0 ? "Free" : `৳${formatPrice(shipping)}`}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Tax</span>

            <span className="font-semibold">৳{formatPrice(tax)}</span>
          </div>

          <div className="divider my-2"></div>

          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Grand Total</span>

            <span className="text-2xl font-bold text-primary">
              ৳{formatPrice(grandTotal)}
            </span>
          </div>
        </div>

        {/* ======================================================
            PLACE ORDER BUTTON
        ====================================================== */}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-lg w-full mt-8"
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Processing Order...
            </>
          ) : (
            "Place Order"
          )}
        </button>

        {/* ======================================================
            TERMS
        ====================================================== */}

        <p className="text-xs text-center text-gray-500 mt-4 leading-6">
          By placing your order, you agree to our Terms & Conditions and confirm
          that your shipping information is correct.
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
