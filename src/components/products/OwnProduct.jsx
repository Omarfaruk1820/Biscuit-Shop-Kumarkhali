import React, { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastProvider";
import { FaTrash, FaEdit } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

const OwnProduct = () => {
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ================= FETCH MY PRODUCTS =================
  const fetchMyProducts = async (currentPage = 1) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API}/products/my?page=${currentPage}&limit=6`,
        {
          withCredentials: true,
        }
      );

      setProducts(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
      setPage(res.data?.page || 1);

    } catch (error) {
      console.error(error);
      addToast(
        error.response?.data?.message || "Failed to load products ❌",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts(1);
  }, []);

  // ================= DELETE PRODUCT =================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure to delete?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/products/${id}`, {
        withCredentials: true,
      });

      setProducts((prev) => prev.filter((p) => p._id !== id));
      addToast("Product deleted 🗑️", "success");

    } catch (error) {
      addToast(
        error.response?.data?.message || "Delete failed ❌",
        "error"
      );
    }
  };

  // ================= UPDATE (redirect) =================
  const handleUpdate = (id) => {
    window.location.href = `/update-product/${id}`;
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Loading your products...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            🍪 My Added Products
          </h2>
          <p className="text-gray-500 text-sm">
            Manage your own biscuits
          </p>
        </div>

        {/* EMPTY */}
        {products.length === 0 ? (
          <p className="text-center text-gray-500">
            You have not added any products yet 😢
          </p>
        ) : (
          <>
            {/* GRID */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl shadow hover:shadow-xl transition overflow-hidden"
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
                      {product.brand || "No brand"}
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

                    {/* BUTTONS */}
                    <div className="flex gap-3 mt-4">

                      <button
                        onClick={() => handleUpdate(product._id)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        <FaEdit />
                        Edit
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

            {/* PAGINATION */}
            <div className="flex justify-center mt-10 gap-2">

              <button
                disabled={page === 1}
                onClick={() => fetchMyProducts(page - 1)}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchMyProducts(i + 1)}
                  className={`px-4 py-2 border rounded ${
                    page === i + 1 ? "bg-amber-500 text-white" : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => fetchMyProducts(page + 1)}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>

            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default OwnProduct;