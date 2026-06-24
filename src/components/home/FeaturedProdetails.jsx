import React, { useContext } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaCartPlus,
  FaStar,
  FaTag,
  FaBoxOpen,
  FaWeightHanging,
  FaCheckCircle,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const FeaturedProdetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // ================= FETCH PRODUCT =================
  const fetchProduct = async () => {
    const res = await axios.get(`${API}/products/${id}`);
    return res.data.data;
  };

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: fetchProduct,
  });

  // ================= ADD TO CART =================
  const handleAddToCart = async () => {
    try {
      const payload = {
        productId: product._id,
        quantity: 1,
      };

      const { data } = await axios.post(`${API}/carts`, payload, {
        withCredentials: true,
      });

      if (data.success) {
        addToast(`🛒 ${product.name} added to cart`, "success");

        queryClient.invalidateQueries({
          queryKey: ["cart", user?.email],
        });
      }
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to add cart", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 grid md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-[400px] bg-gray-200 rounded-xl"></div>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 w-2/3 rounded"></div>
          <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
          <div className="h-10 bg-gray-200 w-full rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <p className="text-center text-red-500 mt-10">Product not found ❌</p>
    );
  }
  const price = Number(product.price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = price - (price * discount) / 100;
  const saveAmount = price - finalPrice;

  const imageUrl = product.image?.replace(/\[|\]|\(|\)/g, "");

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        {/* ================= IMAGE ================= */}
        <div className="bg-white rounded-2xl shadow p-6 sticky top-20 h-fit">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-[350px] object-contain"
          />

          {discount > 10 && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <FaCheckCircle />
              <span className="font-semibold">Hot Deal Available</span>
            </div>
          )}
        </div>

        {/* ================= DETAILS ================= */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {product.name}
          </h1>

          {/* RATING */}
          <div className="flex items-center gap-2 mt-3 text-sm">
            <FaStar className="text-yellow-500" />
            <span>{Number(product.rating || 0).toFixed(1)}</span>
            <span className="text-gray-400">
              ({product.reviews || 0} reviews)
            </span>
          </div>

          {/* PRICE BOX */}
          <div className="mt-6 bg-amber-50 border p-4 rounded-xl">
            <p className="text-3xl font-bold text-amber-600">
              ৳{finalPrice.toFixed(2)}
            </p>

            {discount > 0 && (
              <>
                <p className="line-through text-gray-400">৳{price}</p>

                <p className="text-green-600 font-semibold">
                  You save ৳{saveAmount.toFixed(2)} ({discount}% OFF)
                </p>
              </>
            )}
          </div>

          {/* STOCK */}
          <p className="mt-4 text-red-500 font-semibold">
            Only {product.stock || 0} left in stock
          </p>

          {/* INFO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <FaTag className="text-amber-500" />
              Brand: {product.brand || "No Brand"}
            </div>

            <div className="flex items-center gap-2">
              <FaBoxOpen className="text-amber-500" />
              Category: {product.category}
            </div>

            <div className="flex items-center gap-2">
              <FaWeightHanging className="text-amber-500" />
              Weight: {product.weight || "N/A"}
            </div>
          </div>
          {/* DESCRIPTION */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-2">Product Description</h3>

            <p className="text-gray-600 leading-7">{product.description}</p>
          </div>

          {/* EXTRA INFO */}
          <div className="mt-6 text-sm text-gray-600 space-y-1">
            <p>
              <b>Ingredients:</b> {product.ingredients || "N/A"}
            </p>
            <p>
              <b>Expiry:</b> {product.expiry || "N/A"}
            </p>
          </div>

          {/* ADD TO CART BUTTON */}
          <button
            onClick={handleAddToCart}
            className="mt-8 w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg transition"
          >
            <FaCartPlus />
            Add To Cart
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProdetails;
