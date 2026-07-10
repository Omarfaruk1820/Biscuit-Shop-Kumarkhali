import React, { useContext, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaShoppingCart,
  FaStar,
  FaTag,
  FaWeight,
} from "react-icons/fa";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";

const API = import.meta.env.VITE_API_URL;

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const { addToast } = useToast();

  const queryClient = useQueryClient();

  const imageRef = useRef(null);

  const { flyToCart } = useFlyToCart();

  const [isLoadingAnim, setIsLoadingAnim] = useState(false);

  // =============================
  // VALIDATE OBJECT ID
  // =============================
  const isValidId = /^[0-9a-fA-F]{24}$/.test(id);

  // =============================
  // FETCH SINGLE PRODUCT
  // =============================
  const fetchProduct = async () => {
    const res = await axios.get(`${API}/products/${id}`);
    return res.data?.data || null;
  };

  // =============================
  // FETCH ALL PRODUCTS
  // =============================
  const fetchProducts = async () => {
    const res = await axios.get(`${API}/products`);
    return res.data?.data || [];
  };

  // =============================
  // PRODUCT QUERY
  // =============================
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: fetchProduct,
    enabled: isValidId,
    staleTime: 1000 * 60 * 5,
  });

  // =============================
  // RELATED PRODUCTS
  // =============================
  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  const related = useMemo(() => {
    if (!product) return [];

    return allProducts
      .filter(
        (item) =>
          item.category === product.category && item._id !== product._id,
      )
      .slice(0, 4);
  }, [allProducts, product]);

  // =============================
  // PRICE
  // =============================
  const price = Number(product?.price || 0);
  const discount = Number(product?.discount || 0);

  const finalPrice = Number((price - (price * discount) / 100).toFixed(2));

  // =============================
  // ADD TO CART
  // =============================
  const handleAddToCart = async () => {
    if (!user) {
      addToast("Please login first.", "error");
      return;
    }

    if (!product?._id) {
      addToast("Product not found.", "error");
      return;
    }

    try {
      setIsLoadingAnim(true);

      const res = await axios.post(
        `${API}/carts`,
        {
          productId: product._id,
          quantity: 1,
        },
        {
          withCredentials: true,
        },
      );

      if (res.data.success) {
        // =============================
        // SUCCESS TOAST
        // =============================
        addToast(`${product.name} added to cart successfully 🛒`, "success");

        // =============================
        // REFRESH CART
        // =============================
        await queryClient.invalidateQueries({
          queryKey: ["cart", user.email],
        });

        // =============================
        // FLY TO CART
        // =============================
        const cartIcon = document.querySelector(".cart-icon");

        if (imageRef.current && cartIcon) {
          flyToCart(imageRef.current, cartIcon);
        }
      } else {
        addToast("Failed to add product.", "error");
      }
    } catch (error) {
      console.error(error);

      addToast(
        error?.response?.data?.message || "Something went wrong.",
        "error",
      );
    } finally {
      setTimeout(() => {
        setIsLoadingAnim(false);
      }, 600);
    }
  };

  // =============================
  // LOADING
  // =============================
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-warning"></span>
      </div>
    );
  }

  // =============================
  // ERROR
  // =============================
  if (!isValidId || isError || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-5">
        <h2 className="text-3xl font-bold text-red-500">Product Not Found</h2>

        <p className="text-gray-500">
          The product you are looking for doesn't exist.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="btn btn-warning text-white"
        >
          <FaArrowLeft />
          Go Back
        </button>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      {/* ===================== BACK BUTTON ===================== */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-xl border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white transition-all duration-300"
      >
        <FaArrowLeft />
        Back
      </button>

      {/* ===================== PRODUCT SECTION ===================== */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-10 p-6 md:p-10">
          {/* ===================== IMAGE ===================== */}
          <div className="flex justify-center items-center">
            <div className="relative w-full">
              {discount > 0 && (
                <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow">
                  {discount}% OFF
                </div>
              )}

              <img
                ref={imageRef}
                src={product.image}
                alt={product.name}
                className="w-full h-[320px] md:h-[450px] object-contain rounded-2xl bg-gray-50 p-5"
              />
            </div>
          </div>

          {/* ===================== DETAILS ===================== */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                {product.name}
              </h1>

              <p className="text-gray-500 mt-2">{product.category}</p>
            </div>

            {/* Rating */}

            <div className="flex items-center gap-2">
              <FaStar className="text-yellow-500 text-xl" />

              <span className="font-semibold">{product.rating || 5}</span>

              <span className="text-gray-500">
                ({product.reviews || 0} Reviews)
              </span>
            </div>

            {/* Price */}

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold text-amber-600">
                  ৳{finalPrice.toFixed(2)}
                </h2>

                {discount > 0 && (
                  <span className="line-through text-xl text-gray-400">
                    ৳{price}
                  </span>
                )}
              </div>
            </div>

            {/* Product Info */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <FaTag className="text-amber-500" />
                <div>
                  <p className="text-sm text-gray-500">Brand</p>
                  <p className="font-semibold">{product.brand || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <FaBoxOpen className="text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="font-semibold">{product.stock}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <FaWeight className="text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-semibold">{product.weight || "N/A"}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Category</p>

                <p className="font-semibold">{product.category}</p>
              </div>
            </div>

            {/* Description */}

            <div>
              <h3 className="font-bold text-lg mb-2">Description</h3>

              <p className="text-gray-600 leading-8">{product.description}</p>
            </div>

            {/* Add To Cart */}

            <button
              onClick={handleAddToCart}
              disabled={isLoadingAnim}
              className="btn btn-warning text-white btn-lg rounded-xl w-full md:w-auto px-10"
            >
              {isLoadingAnim ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                <>
                  <FaShoppingCart />
                  Add To Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===================== RELATED PRODUCTS ===================== */}

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="text-3xl font-bold mb-8">Related Products</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {related.map((item) => {
              const itemPrice = Number(item.price || 0);
              const itemDiscount = Number(item.discount || 0);

              const itemFinal = itemPrice - (itemPrice * itemDiscount) / 100;

              return (
                <Link
                  key={item._id}
                  to={`/product/${item._id}`}
                  className="group bg-white rounded-2xl shadow hover:shadow-xl transition duration-300 overflow-hidden"
                >
                  <div className="overflow-hidden bg-gray-50">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-52 object-contain p-5 group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2 min-h-[48px]">
                      {item.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 font-bold text-lg">
                        ৳{itemFinal.toFixed(2)}
                      </span>

                      {itemDiscount > 0 && (
                        <span className="text-sm line-through text-gray-400">
                          ৳{itemPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
