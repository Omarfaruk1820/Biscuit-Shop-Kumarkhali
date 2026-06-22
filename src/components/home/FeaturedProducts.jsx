import React, { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FaCartPlus, FaCookieBite, FaStar } from "react-icons/fa";
import { useToast } from "../../context/ToastProvider";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const FeaturedProducts = () => {
  const { addToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async ({ queryKey }) => {
    const [, page] = queryKey;

    const res = await axios.get(`${API}/products`, {
      params: {
        page,
        limit: 8,
      },
    });

    return res.data;
  };

  // ================= REACT QUERY =================
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["products", currentPage],
    queryFn: fetchProducts,
    placeholderData: (previousData) => previousData,
  });

  const products = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  // ================= ADD TO CART =================
  // const handleAddToCart = async (product) => {
  //   try {
  //     const payload = {
  //       productId: product._id,
  //       name: product.name,
  //       image: product.image,
  //       price: product.price,
  //       discount: product.discount || 0,
  //       quantity: 1,
  //     };

  //     const res = await axios.post(`${API}/carts`, payload, {
  //       withCredentials: true,
  //     });

  //     if (res.data?.success) {
  //       addToast("Added to cart 🛒", "success");
  //     } else {
  //       addToast(res.data?.message || "Failed ❌", "error");
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     addToast("Server Error ❌", "error");
  //   }
  // };

  const handleAddToCart = async (product) => {
    try {
      const payload = {
        productId: product._id,
        quantity: 1,
      };

      const { data } = await axios.post(`${API}/carts`, payload, {
        withCredentials: true,
      });

      if (data.success) {
        addToast(data.message, "success");
      }
    } catch (error) {
      console.log(error.response);

      addToast(error.response?.data?.message || "Failed to add cart", "error");
    }
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow animate-pulse overflow-hidden"
            >
              <div className="h-52 bg-gray-200"></div>

              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>

                <div className="h-4 w-20 bg-gray-200 rounded"></div>

                <div className="h-5 w-28 bg-gray-200 rounded"></div>

                <div className="h-10 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
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
    <section className="max-w-7xl mx-auto px-4 py-10">
      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="flex justify-center items-center gap-2 text-amber-600 text-xl md:text-2xl font-bold">
          <FaCookieBite />
          Fresh Biscuit Collection
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mt-2">
          Delicious Biscuits 🍪
        </h2>

        <p className="text-gray-500 mt-2">
          Handpicked premium biscuits just for you
        </p>
      </div>

      {/* PRODUCTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products.map((product) => {
          const price = Number(product.price) || 0;
          const discount = Number(product.discount) || 0;

          const finalPrice = price - (price * discount) / 100;

          return (
            <div
              key={product._id}
              className="
              group
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              hover:shadow-xl
              hover:-translate-y-1
              transition-all
              duration-300
              overflow-hidden
              "
            >
              {/* IMAGE */}
              <div className="relative">
                {discount > 0 && (
                  <span className="absolute top-3 left-3 z-10 bg-green-500 text-white px-2 py-1 rounded-lg text-xs">
                    -{discount}%
                  </span>
                )}

                <div className="h-44 md:h-52 bg-gray-50 flex items-center justify-center p-4">
                  <Link to={`/product/${product._id}`}>
                    <div className="h-44 md:h-52 bg-gray-50 flex items-center justify-center p-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="
      max-h-full
      max-w-full
      object-contain
      group-hover:scale-105
      transition
      cursor-pointer
      "
                      />
                    </div>
                  </Link>
                </div>
              </div>

              {/* BODY */}
              <div className="p-4 flex flex-col">
                {/* NAME */}
                <h3 className="font-semibold text-sm md:text-base line-clamp-2 min-h-[48px]">
                  {product.name}
                </h3>

                {/* RATING */}
                <div className="flex items-center gap-1 text-yellow-500 mt-2 text-sm">
                  <FaStar />
                  <span>{Number(product.rating || 0).toFixed(1)}</span>
                </div>

                {/* PRICE */}
                <div className="mt-3">
                  <p className="text-lg font-bold text-amber-600">
                    ৳{finalPrice.toFixed(2)}
                  </p>

                  {discount > 0 && (
                    <div className="flex gap-2 text-xs mt-1">
                      <span className="line-through text-gray-400">
                        ৳{price}
                      </span>

                      <span className="text-green-600 font-semibold">
                        SAVE {discount}%
                      </span>
                    </div>
                  )}
                </div>

                {/* BUTTON */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="
                  mt-4
                  w-full
                  bg-amber-500
                  hover:bg-amber-600
                  text-white
                  py-2.5
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  gap-2
                  font-medium
                  transition
                  "
                >
                  <FaCartPlus />
                  Add To Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-2 mt-10 flex-wrap">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-4 py-2 rounded-lg border transition ${
              currentPage === i + 1
                ? "bg-amber-500 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* FETCHING INDICATOR */}
      {isFetching && (
        <p className="text-center text-gray-400 mt-4 text-sm">Updating...</p>
      )}
    </section>
  );
};

export default FeaturedProducts;
