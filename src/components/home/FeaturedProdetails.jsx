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
  const fetchProduct = async () => {
    const res = await axios.get(`${API}/products/${id}`);

    if (!res.data.success) {
      throw new Error("Product not found");
    }

    return res.data.data;
  };

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: fetchProduct,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const handleAddToCart = async () => {
    if (!user) {
      addToast("Please login first", "error");
      return;
    }

    try {
      const { data } = await axios.post(
        `${API}/carts`,
        {
          productId: product._id,
          quantity: 1,
        },
        {
          withCredentials: true,
        },
      );
      

      if (data.success) {
        addToast(`🛒 ${product.name} added to cart`, "success");

        queryClient.invalidateQueries({
          queryKey: ["cart", user.email],
        });
      }
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to add cart", "error");
    }
  };
  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="h-[450px] bg-gray-200 rounded-2xl animate-pulse"></div>

          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>

            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>

            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>

            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  if (isError || !product) {
    return (
      <section className="text-center py-20">
        <h2 className="text-2xl font-bold text-red-500">
          Product not found ❌
        </h2>

        <button
          onClick={() => refetch()}
          className="mt-5 px-6 py-3 bg-amber-500 text-white rounded-xl"
        >
          Try Again
        </button>
      </section>
    );
  }

  const price = Number(product.price || 0);

  const discount = Number(product.discount || 0);

  const finalPrice = price - (price * discount) / 100;

  const saveAmount = price - finalPrice;

  const imageUrl = product.image?.replace(/\[|\]|\(|\)/g, "").trim();

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10 bg-white rounded-3xl shadow-lg p-6 md:p-10">
        {/* IMAGE */}
        <div>
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full rounded-2xl object-contain bg-gray-50 p-6"
          />

          {discount > 10 && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <FaCheckCircle />
              <span className="font-semibold">Hot Deal Available</span>
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>

          <div className="flex items-center gap-2 mt-3">
            <FaStar className="text-yellow-500" />

            <span>{Number(product.rating || 0).toFixed(1)}</span>

            <span className="text-gray-400">
              ({product.reviews || 0} reviews)
            </span>
          </div>

          <div className="mt-6 bg-amber-50 border rounded-xl p-5">
            <h2 className="text-4xl font-bold text-amber-600">
              ৳{finalPrice.toFixed(2)}
            </h2>

            {discount > 0 && (
              <>
                <p className="line-through text-gray-400">৳{price}</p>

                <p className="text-green-600 font-semibold">
                  Save ৳{saveAmount.toFixed(2)}({discount}% OFF)
                </p>
              </>
            )}
          </div>

          <p className="mt-4 text-red-500 font-semibold">
            Only {product.stock || 0} left in stock
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <FaTag className="text-amber-500" />
              {product.brand || "No Brand"}
            </div>

            <div className="flex items-center gap-2">
              <FaBoxOpen className="text-amber-500" />
              {product.category}
            </div>

            <div className="flex items-center gap-2">
              <FaWeightHanging className="text-amber-500" />
              {product.weight || "N/A"}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-bold text-lg mb-2">Product Description</h3>

            <p className="text-gray-600 leading-7">
              {product.description || "No description available"}
            </p>
          </div>

          <div className="mt-6 space-y-2 text-gray-600">
            <p>
              <strong>Ingredients:</strong> {product.ingredients || "N/A"}
            </p>

            <p>
              <strong>Expiry:</strong> {product.expiry || "N/A"}
            </p>
          </div>

          <button
            disabled={product.stock === 0}
            onClick={handleAddToCart}
            className={`mt-8 w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition

            ${
              product.stock > 0
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-gray-400 cursor-not-allowed"
            }
            `}
          >
            <FaCartPlus />

            {product.stock > 0 ? "Add To Cart" : "Out Of Stock"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProdetails;
