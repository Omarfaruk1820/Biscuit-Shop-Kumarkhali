import PropTypes from "prop-types";
import { FaTag, FaShoppingBasket } from "react-icons/fa";

const CheckoutProductCard = ({ item }) => {
  return (
    <div className="bg-base-100 border border-base-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
      <div className="flex gap-4">
        {/* ================================= */}
        {/* Product Image */}
        {/* ================================= */}

        <div className="w-24 h-24 rounded-xl overflow-hidden border bg-base-200 flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* ================================= */}
        {/* Product Information */}
        {/* ================================= */}

        <div className="flex-1">
          <h3 className="font-bold text-base line-clamp-2">{item.name}</h3>

          <div className="mt-2 flex flex-wrap gap-2">
            {item.brand && (
              <span className="badge badge-outline">{item.brand}</span>
            )}

            {item.category && (
              <span className="badge badge-primary badge-outline">
                {item.category}
              </span>
            )}
          </div>

          {/* ============================== */}
          {/* Price */}
          {/* ============================== */}

          <div className="mt-4 flex items-center gap-2">
            <span className="text-xl font-bold text-primary">
              ৳{item.finalPrice.toFixed(2)}
            </span>

            {item.discount > 0 && (
              <>
                <span className="line-through text-gray-400">
                  ৳{item.price.toFixed(2)}
                </span>

                <span className="badge badge-success gap-1">
                  <FaTag />
                  {item.discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* ============================== */}
          {/* Quantity & Subtotal */}
          {/* ============================== */}

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-600">
              <FaShoppingBasket />

              <span>
                Qty :<strong className="ml-1">{item.quantity}</strong>
              </span>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Item Total</p>

              <p className="text-lg font-bold text-success">
                ৳{item.subtotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

CheckoutProductCard.propTypes = {
  item: PropTypes.shape({
    productId: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
      .isRequired,

    name: PropTypes.string.isRequired,

    image: PropTypes.string,

    brand: PropTypes.string,

    category: PropTypes.string,

    quantity: PropTypes.number.isRequired,

    price: PropTypes.number.isRequired,

    discount: PropTypes.number.isRequired,

    finalPrice: PropTypes.number.isRequired,

    subtotal: PropTypes.number.isRequired,
  }).isRequired,
};

export default CheckoutProductCard;
