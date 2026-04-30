import React, { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastProvider";
import { FaTrash, FaEdit } from "react-icons/fa";

const OwnProduct = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH =================
  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5173/products/my",
        {
          withCredentials: true,
        }
      );

      setProducts(res.data.data || []);
    } catch (error) {
      addToast("Failed to load products ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete?")) return;

    try {
      await axios.delete(
        `http://localhost:5173/products/${id}`,
        {
          withCredentials: true,
        }
      );

      addToast("Product deleted 🗑️", "success");

      // remove from UI
      setProducts(products.filter((p) => p._id !== id));

    } catch (error) {
      addToast("Delete failed ❌", "error");
    }
  };

  // ================= UPDATE =================
  const handleUpdate = (id) => {
    // 👉 you can route to update page later
    window.location.href = `/update-product/${id}`;
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            🍪 My Added Products
          </h2>
          <p className="text-gray-500 text-sm">
            Manage your biscuits (Admin only)
          </p>
        </div>

        {/* LOADING */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">
            No products found 😢
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden"
              >

                {/* IMAGE */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-48 w-full object-cover"
                />

                {/* CONTENT */}
                <div className="p-4 space-y-2">

                  <h3 className="font-bold text-lg text-gray-800">
                    {product.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {product.brand}
                  </p>

                  <div className="flex justify-between text-sm mt-2">
                    <span className="font-semibold text-amber-600">
                      ৳{product.price}
                    </span>
                    <span>Stock: {product.stock}</span>
                  </div>

                  <div className="text-xs text-gray-400">
                    ⭐ {product.rating} | {product.reviews} reviews
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-3 mt-4">

                    <button
                      onClick={() => handleUpdate(product._id)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <FaEdit />
                      Update
                    </button>

                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <FaTrash />
                      Delete
                    </button>

                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
};

export default OwnProduct;