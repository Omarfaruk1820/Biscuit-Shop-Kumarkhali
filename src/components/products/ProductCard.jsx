import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FaCartPlus, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// ================= FETCH =================
const fetchProducts = async () => {
  const res = await axios.get("http://localhost:5000/products");

  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data)) return res.data;

  return [];
};

const ProductCard = () => {
  const navigate = useNavigate();

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  // ================= SKELETON =================
  const Skeleton = () => (
    <div className="animate-pulse bg-white rounded-xl shadow p-3 sm:p-4">
      <div className="h-28 sm:h-32 md:h-40 bg-gray-200 rounded-lg mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="flex justify-between mt-4">
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {Array(8).fill(0).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  // ================= ERROR =================
  if (isError) {
    return (
      <div className="text-center py-20 text-red-500">
        Failed to load products
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 :px-4 py-8 sm:py-10">

      {/* HEADER */}
      <div className="text-center mb-8 mt-10 sm sm:mb-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
          🍪 Biscuit Collection
        </h2>
        <p className="text-gray-500 mt-2 text-xs sm:text-sm md:text-base">
          Fresh, crispy & delicious biscuits
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">

        {products.length > 0 ? (
          products.map((product) => {
            const price = Number(product.price) || 0;
            const discount = Number(product.discount) || 0;
            const finalPrice = price - (price * discount) / 100;

            return (
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product._id}`)}
                className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow hover:shadow-xl transition duration-300 cursor-pointer overflow-hidden group"
              >

                {/* IMAGE */}
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-28 sm:h-32 md:h-40 lg:h-44 w-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* DISCOUNT */}
                  {discount > 0 && (
                    <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded">
                      -{discount}%
                    </span>
                  )}

                  {/* STOCK */}
                  {product.stock === 0 && (
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-gray-800 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded">
                      Out
                    </span>
                  )}
                </div>

                {/* CONTENT */}
                <div className="p-2 sm:p-3">

                  {/* NAME */}
                  <h3 className="text-xs sm:text-sm font-semibold line-clamp-1">
                    {product.name}
                  </h3>

                  {/* RATING */}
                  <div className="flex items-center gap-1 text-yellow-400 text-[10px] sm:text-xs mt-1">
                    <FaStar />
                    <span>{product.rating || 0}</span>
                    <span className="text-gray-400">
                      ({product.reviews || 0})
                    </span>
                  </div>

                  {/* PRICE */}
                  <div className="flex justify-between items-center mt-2 sm:mt-3">

                    <div>
                      <p className="font-bold text-amber-600 text-xs sm:text-sm">
                        ৳{finalPrice.toFixed(2)}
                      </p>

                      {discount > 0 && (
                        <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                          ৳{price}
                        </p>
                      )}
                    </div>

                    {/* CART BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Add to cart");
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white p-1.5 sm:p-2 rounded-md sm:rounded-lg"
                    >
                      <FaCartPlus size={12} className="sm:w-4 sm:h-4" />
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
    </div>
  );
};

export default ProductCard;