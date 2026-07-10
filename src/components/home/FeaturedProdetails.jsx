import React, { useContext, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  FaArrowLeft,
  FaCartPlus,
  FaBolt,
  FaStar,
  FaTag,
  FaBoxOpen,
  FaWeightHanging,
  FaTruck,
  FaUndoAlt,
  FaShieldAlt,
  FaCheckCircle,
} from "react-icons/fa";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

const FeaturedProdetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const { addToast } = useToast();

  const queryClient = useQueryClient();

  const [addingCart, setAddingCart] = useState(false);

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
      setAddingCart(true);

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
        addToast(`🛒 ${product.name} added to cart successfully`, "success");

        queryClient.invalidateQueries({
          queryKey: ["cart", user.email],
        });
      }
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to add cart", "error");
    } finally {
      setAddingCart(false);
    }
  };

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-5 py-16">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="h-[500px] rounded-3xl bg-gray-200 animate-pulse"></div>

          <div className="space-y-5">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-14 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  if (isError || !product) {
    return (
      <section className="min-h-[60vh] flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold text-red-500">Product Not Found</h2>

        <button
          onClick={() => refetch()}
          className="mt-6 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl"
        >
          Try Again
        </button>
      </section>
    );
  }

  const imageUrl = product.image?.replace(/[\[\]\(\)]/g, "").trim();

  const price = Number(product.price || 0);

  const discount = Number(product.discount || 0);

  const finalPrice = price - (price * discount) / 100;

  const saveAmount = price - finalPrice;
  return (
    <section className="bg-gradient-to-b from-amber-50 via-white to-white py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Back Button */}

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-xl border bg-white hover:bg-amber-50 hover:border-amber-500 transition shadow-sm"
        >
          <FaArrowLeft />
          Back
        </button>

        {/* Breadcrumb */}

        <div className="text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-amber-500">
            Home
          </Link>

          <span className="mx-2">/</span>

          <span className="capitalize">{product.category}</span>

          <span className="mx-2">/</span>

          <span className="font-semibold text-gray-700">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-14 items-start">
          {/* LEFT */}

          <div className="sticky top-24">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl">
              {discount > 0 && (
                <div className="absolute top-5 left-5 z-20 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  {discount}% OFF
                </div>
              )}

              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-[520px] object-cover transition duration-500 hover:scale-110"
              />
            </div>
          </div>

          {/* RIGHT */}

          <div>
            <span className="inline-block bg-amber-100 text-amber-700 font-semibold px-4 py-2 rounded-full text-sm">
              {product.brand}
            </span>

            <h1 className="mt-5 text-4xl font-extrabold text-gray-800 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}

            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center gap-1 text-yellow-500">
                <FaStar />

                <span className="font-semibold">
                  {Number(product.rating || 0).toFixed(1)}
                </span>
              </div>

              <span className="text-gray-400">({product.reviews} Reviews)</span>
            </div>

            {/* Price */}

            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-5xl font-extrabold text-amber-600">
                ৳{finalPrice.toFixed(2)}
              </h2>

              {discount > 0 && (
                <>
                  <p className="mt-2 text-gray-400 line-through text-xl">
                    ৳{price}
                  </p>

                  <p className="mt-2 text-green-600 font-bold text-lg">
                    Save ৳{saveAmount.toFixed(2)}
                  </p>
                </>
              )}
            </div>

            {/* Stock */}

            <div className="mt-6">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                  <FaCheckCircle />
                  In Stock ({product.stock})
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold">
                  Out Of Stock
                </span>
              )}
            </div>

            {/* Product Information */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="rounded-2xl border p-5 bg-white shadow-sm">
                <FaTag className="text-amber-500 text-2xl mb-3" />

                <h3 className="font-semibold text-gray-500">Brand</h3>

                <p className="font-bold text-lg">{product.brand}</p>
              </div>

              <div className="rounded-2xl border p-5 bg-white shadow-sm">
                <FaBoxOpen className="text-amber-500 text-2xl mb-3" />

                <h3 className="font-semibold text-gray-500">Category</h3>

                <p className="font-bold text-lg capitalize">
                  {product.category}
                </p>
              </div>

              <div className="rounded-2xl border p-5 bg-white shadow-sm">
                <FaWeightHanging className="text-amber-500 text-2xl mb-3" />

                <h3 className="font-semibold text-gray-500">Weight</h3>

                <p className="font-bold text-lg">{product.weight || "N/A"}</p>
              </div>
            </div>

            {/* Description */}

            <div className="mt-10">
              <h2 className="text-2xl font-bold mb-4">Product Description</h2>

              <p className="leading-8 text-gray-600">
                {product.description || "No description available."}
              </p>
            </div>

            {/* Ingredients & Expiry */}

            <div className="grid sm:grid-cols-2 gap-5 mt-10">
              <div className="rounded-2xl border bg-gray-50 p-6">
                <h3 className="font-bold text-lg mb-3">Ingredients</h3>

                <p className="text-gray-600">{product.ingredients || "N/A"}</p>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-6">
                <h3 className="font-bold text-lg mb-3">Expiry</h3>

                <p className="text-gray-600">{product.expiry || "N/A"}</p>
              </div>
            </div>
            {/* Service Cards */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
              {/* Delivery */}

              <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <FaTruck className="text-2xl text-amber-600" />
                </div>

                <h3 className="font-bold text-lg">Free Delivery</h3>

                <p className="text-gray-500 mt-2 leading-7">
                  Free home delivery on eligible orders. Estimated delivery
                  within 2–4 business days.
                </p>
              </div>

              {/* Secure Payment */}

              <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <FaShieldAlt className="text-2xl text-green-600" />
                </div>

                <h3 className="font-bold text-lg">Secure Payment</h3>

                <p className="text-gray-500 mt-2 leading-7">
                  Your payment is protected with industry-standard security and
                  encrypted checkout.
                </p>
              </div>

              {/* Return */}

              <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <FaUndoAlt className="text-2xl text-blue-600" />
                </div>

                <h3 className="font-bold text-lg">Easy Return</h3>

                <p className="text-gray-500 mt-2 leading-7">
                  Enjoy a hassle-free 7-day return policy for eligible products.
                </p>
              </div>
            </div>

            {/* Action Buttons */}

            <div className="grid sm:grid-cols-2 gap-5 mt-12">
              {/* Add To Cart */}

              <button
                onClick={handleAddToCart}
                disabled={addingCart || product.stock === 0}
                className={`h-14 rounded-xl font-semibold text-lg text-white transition duration-300 flex items-center justify-center gap-3

              ${
                product.stock > 0
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-gray-400 cursor-not-allowed"
              }

              ${addingCart ? "opacity-80 cursor-wait" : ""}
              `}
              >
                {addingCart ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <FaCartPlus />
                    Add To Cart
                  </>
                )}
              </button>

              {/* Buy Now */}

              <button
                disabled={product.stock === 0}
                className={`h-14 rounded-xl font-semibold text-lg transition duration-300 flex items-center justify-center gap-3

              ${
                product.stock > 0
                  ? "border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"
                  : "border bg-gray-200 text-gray-500 cursor-not-allowed"
              }
              `}
              >
                <FaBolt />
                Buy Now
              </button>
            </div>

            {/* Extra Information */}

            <div className="mt-10 rounded-2xl bg-gray-50 border p-6">
              <h3 className="text-xl font-bold mb-4">Why Shop With Us?</h3>

              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-500" />
                  100% Genuine Products
                </li>

                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-500" />
                  Fast & Reliable Delivery
                </li>

                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-500" />
                  Secure Online Payment
                </li>

                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-500" />
                  Easy Return & Refund
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProdetails;
