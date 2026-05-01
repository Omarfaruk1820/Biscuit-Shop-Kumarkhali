import React, { useContext, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FaStar,
  FaShoppingCart,
  FaBoxOpen,
  FaTag,
  FaWeight,
} from "react-icons/fa";
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

  // ================= RELATED =================
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
    if (!user) {
      return addToast("Please login first ❌", "error");
    }

    try {
      // 🎯 ANIMATION
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

        setTimeout(() => setIsAnimating(false), 600);
      }

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
        addToast(res.data?.message || "Failed ❌", "error");
      }
    } catch (err) {
      console.log(err);
      addToast("Server error ❌", "error");
    }
  };

  // ================= STATES =================
  if (isLoading)
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading product...
      </div>
    );

  if (!isValidId || isError || !product)
    return (
      <div className="text-center py-20 text-red-500">
        Product not found ❌
      </div>
    );

  // ================= PRICE =================
  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const finalPrice = price - (price * discount) / 100;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 relative">

      {/* FLOATING CART */}
      <div
        ref={cartIconRef}
        className="fixed top-5 right-5 bg-amber-500 p-3 rounded-full text-white shadow-xl z-50"
      >
        <FaShoppingCart />
      </div>

      {/* ANIMATION IMAGE */}
      {isAnimating && (
        <img
          src={product.image}
          alt=""
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

      {/* MAIN PRODUCT */}
      <div className="grid lg:grid-cols-2 gap-10 bg-white p-6 rounded-2xl shadow">

        {/* IMAGE */}
        <div className="relative">
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow">
              -{discount}% OFF
            </span>
          )}

          <img
            ref={imageRef}
            src={product.image}
            alt={product.name}
            className="w-full h-[300px] md:h-[400px] object-contain rounded-xl"
          />
        </div>

        {/* DETAILS */}
        <div className="space-y-4">

          <h1 className="text-2xl md:text-3xl font-bold">
            {product.name}
          </h1>

          {/* RATING */}
          <div className="flex items-center gap-2 text-yellow-500">
            <FaStar />
            <span>{product.rating || 4.5}</span>
            <span className="text-gray-400 text-sm">
              ({product.reviews || 0} reviews)
            </span>
          </div>

          {/* PRICE */}
          <div>
            <p className="text-2xl font-bold text-amber-600">
              ৳{finalPrice.toFixed(2)}
            </p>

            {discount > 0 && (
              <p className="text-sm text-gray-500">
                <span className="line-through">৳{price}</span>{" "}
                <span className="text-green-600">
                  Save {discount}%
                </span>
              </p>
            )}
          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">

            <p className="flex items-center gap-2">
              <FaTag /> {product.brand || "No Brand"}
            </p>

            <p className="flex items-center gap-2">
              <FaBoxOpen /> Stock: {product.stock}
            </p>

            <p className="flex items-center gap-2">
              <FaWeight /> {product.weight || "N/A"}
            </p>

            <p>Category: {product.category}</p>
          </div>

          {/* DESCRIPTION */}
          <p className="text-gray-600 text-sm leading-relaxed">
            {product.description || "No description available"}
          </p>

          {/* EXTRA */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Ingredients: {product.ingredients || "N/A"}</p>
            <p>Expiry: {product.expiry || "N/A"}</p>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleAddToCart}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <FaShoppingCart />
            Add to Cart
          </button>

        </div>
      </div>

      {/* RELATED */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">
          Related Products
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">

          {related.length > 0 ? (
            related.map((item) => (
              <Link
                key={item._id}
                to={`/product/${item._id}`}
                className="bg-white p-3 rounded-xl shadow hover:shadow-lg transition"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-28 w-full object-contain"
                />
                <p className="text-sm mt-2 line-clamp-1">
                  {item.name}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-gray-400">No related products</p>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductDetails;