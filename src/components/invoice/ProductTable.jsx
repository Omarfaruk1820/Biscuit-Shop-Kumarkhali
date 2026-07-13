import { formatCurrency } from "../../utils/helpers.js";

const ProductTable = ({ invoice }) => {
  const items = invoice?.items || [];
  const currency = invoice?.shop?.currency || "BDT";

  if (!items.length) {
    return (
      <div className="card bg-base-100 shadow border">
        <div className="card-body text-center">
          <h2 className="text-xl font-semibold">No Products Found</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}

      <div className="hidden lg:block overflow-x-auto bg-base-100 rounded-xl shadow border">
        <table className="table table-zebra">
          <thead className="bg-base-200">
            <tr>
              <th>Image</th>
              <th>SKU</th>
              <th>Product</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Discount</th>
              <th className="text-right">Final Price</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={item.productId || index}>
                <td>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover border"
                  />
                </td>

                <td>{item.sku || "-"}</td>

                <td>
                  <h3 className="font-semibold">
                    {item.name}
                  </h3>
                </td>

                <td className="text-center">
                  {item.quantity}
                </td>

                <td className="text-right">
                  {formatCurrency(item.unitPrice ?? item.price, currency)}
                </td>

                <td className="text-right">
                  {item.discount ?? 0}%
                </td>

                <td className="text-right">
                  {formatCurrency(item.finalPrice, currency)}
                </td>

                <td className="text-right font-bold">
                  {formatCurrency(item.subtotal, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}

      <div className="lg:hidden space-y-4">
        {items.map((item, index) => (
          <div
            key={item.productId || index}
            className="card bg-base-100 shadow border"
          >
            <div className="card-body">

              <div className="flex gap-4">

                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 rounded-lg object-cover border"
                />

                <div className="flex-1">
                  <h2 className="font-bold text-lg">
                    {item.name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    SKU: {item.sku || "-"}
                  </p>
                </div>

              </div>

              <div className="divider my-3"></div>

              <div className="grid grid-cols-2 gap-3 text-sm">

                <div>
                  <p className="font-semibold">
                    Quantity
                  </p>

                  <p>{item.quantity}</p>
                </div>

                <div>
                  <p className="font-semibold">
                    Unit Price
                  </p>

                  <p>
                    {formatCurrency(
                      item.unitPrice ?? item.price,
                      currency
                    )}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">
                    Discount
                  </p>

                  <p>{item.discount ?? 0}%</p>
                </div>

                <div>
                  <p className="font-semibold">
                    Final Price
                  </p>

                  <p>
                    {formatCurrency(
                      item.finalPrice,
                      currency
                    )}
                  </p>
                </div>

              </div>

              <div className="divider my-3"></div>

              <div className="flex justify-between items-center">

                <span className="font-bold">
                  Line Total
                </span>

                <span className="text-lg font-bold text-primary">
                  {formatCurrency(
                    item.subtotal,
                    currency
                  )}
                </span>

              </div>

            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductTable;