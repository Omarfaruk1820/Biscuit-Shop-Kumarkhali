import React, { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FaCartPlus, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const ProductCard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    const res = await axios.get(`${API}/products`, {
      params: {
        page: currentPage,
        limit: 8,
      },
    });

    return res.data;
  };

  // ================= QUERY =================
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: fetchProducts,
    keepPreviousData: true,
  });

  const products = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  // ================= ADD TO CART (DB VERSION) =================
  const handleAddToCart = async (product, e) => {
    e.stopPropagation(); // prevent navigation

    try {
      const payload = {
        productId: product._id,
        name: product.name,
        price: product.price,
        discount: product.discount || 0,
        image: product.image,
        quantity: 1,
      };

      const res = await axios.post(
        `${API}/carts`,
        payload,
        {
          withCredentials: true,
        }
      );

      if (res.data?.success) {
        addToast("Added to cart 🛒", "success");
      } else {
        addToast(res.data?.message || "Failed to add", "error");
      }
    } catch (error) {
      console.log(error);
      addToast("Server error ❌", "error");
    }
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading products...
      </div>
    );
  }

  // ================= ERROR =================
  if (isError) {
    return (
      <div className="text-center py-20 text-red-500">
        Failed to load products ❌
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">
          🍪 Biscuit Collection
        </h2>
        <p className="text-gray-500 mt-2">
          Fresh, crispy & delicious biscuits
        </p>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

        {products.length > 0 ? (
          products.map((product) => {
            const price = Number(product.price) || 0;
            const discount = Number(product.discount) || 0;

            const finalPrice = Math.max(
              0,
              price - (price * discount) / 100
            );

            return (
              <div
                key={product._id}
                onClick={() =>
                  navigate(`/product/${product._id}`)
                }
                className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
              >

                {/* IMAGE */}
                <img
                  src={
                    product.image ||
                    "https://via.placeholder.com/300"
                  }
                  alt={product.name}
                  className="h-40 w-full object-cover"
                />

                {/* CONTENT */}
                <div className="p-3">

                  {/* NAME */}
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {product.name}
                  </h3>

                  {/* RATING */}
                  <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
                    <FaStar />
                    <span>{product.rating || 0}</span>
                    <span className="text-gray-400">
                      ({product.reviews || 0})
                    </span>
                  </div>

                  {/* PRICE + CART */}
                  <div className="flex justify-between items-center mt-3">

                    <div>
                      <p className="font-bold text-amber-600 text-sm">
                        ৳{finalPrice.toFixed(2)}
                      </p>

                      {discount > 0 && (
                        <p className="text-xs text-gray-400 line-through">
                          ৳{price}
                        </p>
                      )}
                    </div>

                    {/* CART BUTTON (DB ADD) */}
                    <button
                      onClick={(e) =>
                        handleAddToCart(product, e)
                      }
                      className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded"
                    >
                      <FaCartPlus />
                    </button>

                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No products found
          </p>
        )}

      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-8 gap-2 flex-wrap">

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded transition ${
              currentPage === i + 1
                ? "bg-amber-500 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

      </div>

    </div>
  );
};

export default ProductCard;