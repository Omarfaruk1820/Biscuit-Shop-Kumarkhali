import React, { useContext, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

// ================= FETCH =================
const fetchProduct = async (id) => {
  const res = await axios.get(`${API}/products/${id}`);
  return res.data?.data || null;
};

const fetchProducts = async () => {
  const res = await axios.get(`${API}/products`);
  return res.data?.data || [];
};

const ProductDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();

  const imageRef = useRef(null);
  const cartIconRef = useRef(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [cloneStyle, setCloneStyle] = useState({});

  const isValidId = /^[0-9a-fA-F]{24}$/.test(id);

  // ================= DATA =================
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const related = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(
        (p) =>
          p.category === product.category &&
          p._id !== product._id
      )
      .slice(0, 4);
  }, [allProducts, product]);

  // ================= ADD TO CART =================
  const handleAddToCart = async () => {
    try {
      if (!user) {
        addToast("Please login first ❌", "error");
        return;
      }

      // 🎯 ANIMATION START
      if (imageRef.current && cartIconRef.current) {
        const imgRect = imageRef.current.getBoundingClientRect();
        const cartRect = cartIconRef.current.getBoundingClientRect();

        setCloneStyle({
          top: imgRect.top,
          left: imgRect.left,
          width: imgRect.width,
          height: imgRect.height,
        });

        setIsAnimating(true);

        setTimeout(() => {
          setCloneStyle({
            top: cartRect.top,
            left: cartRect.left,
            width: 30,
            height: 30,
            opacity: 0.5,
          });
        }, 50);

        setTimeout(() => {
          setIsAnimating(false);
        }, 600);
      }

      // ================= API =================
      const payload = {
        productId: product._id,
        name: product.name,
        price: product.price,
        discount: product.discount || 0,
        image: product.image,
        quantity: 1,
      };

      const res = await axios.post(`${API}/carts`, payload, {
        withCredentials: true,
      });

      if (res.data?.success) {
        addToast("Added to cart 🛒", "success");
      } else {
        addToast(res.data?.message || "Failed", "error");
      }
    } catch (err) {
      console.log(err);
      addToast("Server error ❌", "error");
    }
  };

  if (isLoading) return <div className="text-center py-20">Loading...</div>;

  if (!isValidId || isError || !product) {
    return (
      <div className="text-center py-20 text-red-500">
        Product not found ❌
      </div>
    );
  }

  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const finalPrice = price - (price * discount) / 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 relative">

      {/* 🔥 CART ICON (TARGET) */}
      <div
        ref={cartIconRef}
        className="fixed top-6 right-6 bg-amber-500 p-3 rounded-full text-white shadow-lg z-50"
      >
        <FaShoppingCart />
      </div>

      {/* 🔥 CLONE IMAGE FOR ANIMATION */}
      {isAnimating && (
        <img
          src={product.image}
          style={{
            position: "fixed",
            zIndex: 9999,
            borderRadius: "10px",
            transition: "all 0.6s ease-in-out",
            pointerEvents: "none",
            ...cloneStyle,
          }}
        />
      )}

      {/* PRODUCT */}
      <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-xl shadow relative overflow-hidden">

        {/* 🔥 FLOATING SALE BADGE */}
        {discount > 0 && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1 text-xs font-bold rounded-full animate-bounce shadow">
            SALE -{discount}%
          </div>
        )}

        {/* IMAGE */}
        <img
          ref={imageRef}
          src={product.image}
          alt={product.name}
          className="h-80 w-full object-contain"
        />

        {/* INFO */}
        <div>

          <h1 className="text-2xl font-bold">
            {product.name}
          </h1>

          <div className="flex items-center gap-1 text-yellow-500 mt-2">
            <FaStar />
            {product.rating || 4.5}
          </div>

          <p className="mt-3 text-gray-600">
            {product.description}
          </p>

          {/* PRICE */}
          <div className="mt-4">
            <p className="text-2xl font-bold text-amber-600">
              ৳{finalPrice.toFixed(2)}
            </p>

            {discount > 0 && (
              <div className="flex gap-2 text-sm text-gray-500">
                <span className="line-through">৳{price}</span>
                <span className="text-green-600">
                  Save {discount}%
                </span>
              </div>
            )}
          </div>

          {/* ADD BUTTON */}
          <button
            onClick={handleAddToCart}
            className="mt-4 bg-amber-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-amber-600 transition"
          >
            <FaShoppingCart />
            Add to Cart
          </button>

        </div>
      </div>

      {/* RELATED */}
      <h2 className="mt-10 text-xl font-bold">
        Related Products
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {related.map((item) => (
          <Link
            key={item._id}
            to={`/product/${item._id}`}
            className="bg-white p-3 rounded shadow hover:shadow-md"
          >
            <img
              src={item.image}
              className="h-24 w-full object-contain"
            />
            <p className="text-sm mt-2">{item.name}</p>
          </Link>
        ))}
      </div>

    </div>
  );
};

export default ProductDetails;