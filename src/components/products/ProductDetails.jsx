import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaStar, FaShoppingCart, FaBolt } from "react-icons/fa";
import products from "../../data/productCard.json";

const Toast = ({ message }) =>
  message && (
    <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
      {message}
    </div>
  );

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const product = products.find((p) => p._id === String(id));

  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");

  if (!product) return <p>Product not found</p>;

  const discount = product.discount || 0;
  const finalPrice = product.price - (product.price * discount) / 100;

  // 🔥 GLOBAL ADD TO CART
  const addToCart = (item, quantity = 1) => {
    const stored = JSON.parse(localStorage.getItem("cart")) || [];

    const exist = stored.find((i) => i._id === item._id);

    let updated;

    if (exist) {
      updated = stored.map((i) =>
        i._id === item._id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    } else {
      updated = [...stored, { ...item, quantity }];
    }

    localStorage.setItem("cart", JSON.stringify(updated));

    setToast(`${item.name} added 🛒`);
    setTimeout(() => setToast(""), 1500);
  };

  const related = products
    .filter(
      (p) => p.category === product.category && p._id !== product._id
    )
    .slice(0, 4);

  return (
    <div className="max-w-6xl  mx-auto p-6">

      <Toast message={toast} />

      {/* MAIN */}
      <div className="grid md:grid-cols-2 mt-10 gap-10 bg-base-100 p-6 rounded-xl shadow">

        <img src={product.image} className="w-64 mx-auto" />

        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>

          <div className="flex items-center text-yellow-400">
            <FaStar /> {product.rating}
          </div>

          <p>{product.description}</p>

          <p className="text-xl font-bold text-primary">
            ৳{finalPrice}
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => addToCart(product, qty)}
              className="btn btn-primary"
            >
              <FaShoppingCart /> Add
            </button>

            <button
              onClick={() =>
                navigate("/checkout", { state: { product, qty } })
              }
              className="btn btn-outline"
            >
              <FaBolt /> Buy
            </button>
          </div>
        </div>
      </div>

      {/* RELATED */}
      <h2 className="mt-10 font-bold text-xl">Related</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">

        {related.map((item) => (
          <div key={item._id} className="p-3 shadow rounded">

            <Link to={`/product/${item._id}`}>
              <img src={item.image} className="h-20 mx-auto" />
              <p className="text-center">{item.name}</p>
            </Link>

            <p className="text-center text-primary">
              ৳{item.price}
            </p>

            <button
              onClick={() => addToCart(item)}
              className="btn btn-xs btn-primary w-full mt-2"
            >
              Add
            </button>
          </div>
        ))}

      </div>
    </div>
  );
};

export default ProductDetails;