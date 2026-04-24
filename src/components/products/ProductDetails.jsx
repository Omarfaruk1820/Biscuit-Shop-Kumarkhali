import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import { AuthContext } from "../../Auth/AuthProvider";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ✅ normalize email
  const email = user?.email?.toLowerCase().trim();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [adding, setAdding] = useState(false);

  // ================= FETCH =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          `http://localhost:5000/products/${id}`
        );

        const data = res.data?.data;

        if (!data) {
          setError("Product not found");
          return;
        }

        setProduct(data);

        // 👉 Fetch related products
        const allRes = await axios.get(
          "http://localhost:5000/products"
        );

        const allProducts = Array.isArray(allRes.data?.data)
          ? allRes.data.data
          : [];

        const relatedItems = allProducts
          .filter(
            (p) =>
              p.category === data.category &&
              p._id !== data._id
          )
          .slice(0, 4);

        setRelated(relatedItems);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ================= ADD TO CART =================
  const handleAddToCart = async () => {
    if (!email) {
      setToast("❌ Please login first");
      setTimeout(() => setToast(""), 1500);
      return;
    }

    if (!product) return;

    try {
      setAdding(true);

      const res = await axios.post(
        "http://localhost:5000/cart",
        {
          email,
          productId: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          discount: product.discount,
          quantity: 1,
        }
      );

      if (res.data?.success) {
        setToast(`✅ ${product.name} added to cart`);
      } else {
        setToast("❌ Failed to add");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      setToast("❌ Server error");
    } finally {
      setAdding(false);
      setTimeout(() => setToast(""), 1500);
    }
  };

  // ================= STATES =================
  if (loading) {
    return (
      <div className="text-center py-20 text-amber-600 font-semibold">
        Loading product...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-bold">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-amber-500 text-white px-4 py-2 rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!product) return null;

  // ================= PRICE =================
  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const final = price - (price * discount) / 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          {toast}
        </div>
      )}

      {/* PRODUCT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-gray-900 p-6 rounded-xl shadow">

        {/* IMAGE */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-72 md:h-96 object-cover rounded-lg"
        />

        {/* DETAILS */}
        <div className="flex flex-col justify-center">

          <h1 className="text-2xl md:text-3xl font-bold">
            {product.name}
          </h1>

          {/* RATING */}
          <div className="flex items-center gap-2 text-yellow-500 mt-2">
            <FaStar />
            <span>{product.rating || 0}</span>
          </div>

          {/* DESCRIPTION */}
          <p className="mt-3 text-gray-600">
            {product.description || "No description"}
          </p>

          {/* PRICE */}
          <div className="mt-4">
            <p className="text-2xl font-bold text-amber-600">
              ৳{final.toFixed(2)}
            </p>

            {discount > 0 && (
              <p className="text-gray-400 line-through text-sm">
                ৳{price}
              </p>
            )}
          </div>

          {/* BUTTON */}
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="mt-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2 rounded flex items-center gap-2 w-fit"
          >
            <FaShoppingCart />
            {adding ? "Adding..." : "Add to Cart"}
          </button>

          {/* EXTRA */}
          <div className="mt-5 text-sm text-gray-500">
            <p>Brand: {product.brand || "N/A"}</p>
            <p>Category: {product.category}</p>
            <p>Stock: {product.stock || 0}</p>
          </div>

        </div>
      </div>

      {/* RELATED */}
      <h2 className="mt-10 text-xl font-bold">
        Related Products
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {related.length > 0 ? (
          related.map((item) => (
            <Link
              key={item._id}
              to={`/product/${item._id}`}
              className="bg-white dark:bg-gray-900 p-3 rounded shadow hover:shadow-lg transition"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-24 w-full object-cover rounded"
              />
              <p className="text-center text-sm mt-2 line-clamp-1">
                {item.name}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No related products
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;