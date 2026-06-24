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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../../Auth/AuthProvider";
import { useToast } from "../../context/ToastProvider";
import { useFlyToCart } from "../../hooks/useFlyToCart";
const API = import.meta.env.VITE_API_URL;

const ProductDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const imageRef = useRef(null);

  const { flyToCart } = useFlyToCart();

  const [isLoadingAnim, setIsLoadingAnim] = useState(false);

  const isValidId = /^[0-9a-fA-F]{24}$/.test(id);
  // ================= FETCH PRODUCT =================
  const fetchProduct = async () => {
    const res = await axios.get(`${API}/products/${id}`);
    return res.data?.data || null;
  };

  const fetchProducts = async () => {
    const res = await axios.get(`${API}/products`);
    return res.data?.data || [];
  };

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: fetchProduct,
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
      .filter((p) => p.category === product.category && p._id !== product._id)
      .slice(0, 4);
  }, [allProducts, product]);

  // ================= ADD TO CART =================
  const handleAddToCart = async () => {
    if (!user) return addToast("Please login first ❌", "error");

    try {
      setIsLoadingAnim(true);

      const res = await axios.post(
        `${API}/carts`,
        {
          productId: product._id,
          quantity: 1,
        },
        { withCredentials: true },
      );

      if (res.data.success) {
        addToast(`🛒 ${product.name} added successfully`, "success");

        // 🔥 navbar sync
        queryClient.invalidateQueries(["cart", user?.email]);

        // ✈️ animation
        const cartIcon = document.querySelector(".cart-icon");
        if (imageRef.current && cartIcon) {
          flyToCart(imageRef.current, cartIcon);
        }
      }
    } catch (error) {
      addToast("Failed ❌", "error");
    } finally {
      setTimeout(() => setIsLoadingAnim(false), 600);
    }
  };
  if (isLoading) return <p className="text-center p-10">Loading product...</p>;

  if (!isValidId || isError || !product)
    return (
      <p className="text-center p-10 text-red-500">Product not found ❌</p>
    );

  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const finalPrice = price - (price * discount) / 100;
  console.log({
    name,

    price,
    discount,
    finalPrice,
  });

  return (
    <div className="px-3 md:px-10 py-6">
      {/* FLOATING CART ICON */}
      <div className="cart-icon fixed top-5 right-5 bg-amber-500 p-3 rounded-full text-white shadow-lg z-50">
        <FaShoppingCart />
      </div>

      {/* MAIN PRODUCT */}
      <div className="grid md:grid-cols-2 gap-8 bg-white p-4 md:p-8 rounded-xl shadow">
        {/* IMAGE */}
        <div>
          <img
            ref={imageRef}
            src={product.image}
            className="w-full h-[250px] md:h-[400px] object-contain rounded-xl"
          />
        </div>

        {/* DETAILS */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

          {/* RATING */}
          <div className="flex items-center gap-2 text-yellow-500">
            <FaStar />
            <span>{product.rating}</span>
            <span className="text-gray-400">({product.reviews})</span>
          </div>

          {/* PRICE */}
          <div>
            <p className="text-2xl font-bold text-amber-600">
              ৳{finalPrice.toFixed(2)}
            </p>

            {discount > 0 && (
              <p className="text-sm text-gray-500 line-through">৳{price}</p>
            )}
          </div>

          {/* INFO */}
          <div className="grid grid-cols-2 text-sm gap-2 text-gray-600">
            <p>
              <FaTag /> {product.brand}
            </p>
            <p>
              <FaBoxOpen /> Stock: {product.stock}
            </p>
            <p>
              <FaWeight /> {product.weight}
            </p>
            <p>Category: {product.category}</p>
          </div>

          {/* DESCRIPTION */}
          <p className="text-gray-600 text-sm">{product.description}</p>

          {/* BUTTON */}
          <button
            onClick={handleAddToCart}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <FaShoppingCart />
            Add to Cart
          </button>
        </div>
      </div>

      {/* RELATED */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Related Products</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {related.map((item) => (
            <Link
              key={item._id}
              to={`/product/${item._id}`}
              className="bg-white p-3 rounded-xl shadow hover:shadow-lg"
            >
              <img src={item.image} className="h-24 w-full object-contain" />
              <p className="text-sm mt-2">{item.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
