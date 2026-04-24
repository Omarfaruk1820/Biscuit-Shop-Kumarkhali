import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useToast } from "../context/ToastProvider";
import { useNavigate } from "react-router-dom";

const AddBiscuit = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [preview, setPreview] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      rating: 4.5,
      reviews: 0,
      discount: 0,
      category: "biscuit",
    },
  });

  // ================= SUBMIT =================
  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name?.trim(),
        price: Number(data.price),
        stock: Number(data.stock),
        image: data.image?.trim(),
        rating: Number(data.rating) || 4.5,
        category: data.category,
        reviews: Number(data.reviews) || 0,
        brand: data.brand?.trim() || "",
        weight: data.weight?.trim() || "",
        description: data.description?.trim() || "",
        ingredients: data.ingredients?.trim() || "",
        expiry: data.expiry || "",
        discount: Number(data.discount) || 0,
      };

      const res = await axios.post("http://localhost:5000/products", payload);

      if (res.data?.success || res.status === 201) {
        addToast("🍪 Product added successfully!", "success");
        reset();
        setPreview("");
        navigate("/products");
      }
    } catch (error) {
      addToast(
        error.response?.data?.message || "Failed to add product",
        "error",
      );
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 px-4 py-10">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        {/* HEADER */}
        <div className="bg-amber-500 text-white px-6 py-5">
          <h2 className="text-2xl font-bold">🍪 Add New Biscuit Product</h2>
          <p className="text-sm opacity-90">
            Fill the form and publish your product
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* FORM */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="lg:col-span-2 p-6 space-y-4"
          >
            {/* NAME */}
            <input
              type="text"
              placeholder="Enter product name (e.g. Butter Biscuit)"
              className="input"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="error">{errors.name.message}</p>}

            {/* PRICE + STOCK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Price (e.g. 50)"
                className="input"
                {...register("price", { required: true })}
              />

              <input
                type="number"
                placeholder="Stock (e.g. 100)"
                className="input"
                {...register("stock", { required: true })}
              />
            </div>

            {/* IMAGE */}
            <input
              type="text"
              placeholder="Image URL (https://...)"
              className="input"
              {...register("image", { required: true })}
              onChange={(e) => setPreview(e.target.value)}
            />

            {/* BRAND + CATEGORY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Brand name (e.g. Oreo, Milk Biscuit)"
                className="input"
                {...register("brand")}
              />

              <select className="input" {...register("category")}>
                <option value="biscuit">Biscuit</option>
                <option value="cookie">Cookie</option>
                <option value="cake">Cake</option>
                <option value="cracker">Cracker</option>
              </select>
            </div>

            {/* RATING + REVIEWS + DISCOUNT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                step="0.1"
                placeholder="Rating (e.g. 4.5)"
                className="input"
                {...register("rating")}
              />

              <input
                type="number"
                placeholder="Reviews (e.g. 120)"
                className="input"
                {...register("reviews")}
              />

              <input
                type="number"
                placeholder="Discount % (e.g. 10)"
                className="input"
                {...register("discount")}
              />
            </div>

            {/* WEIGHT + EXPIRY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Weight (e.g. 200g)"
                className="input"
                {...register("weight")}
              />

              <input type="date" className="input" {...register("expiry")} />
            </div>

            {/* DESCRIPTION */}
            <textarea
              rows="3"
              placeholder="Write product description..."
              className="input"
              {...register("description")}
            />

            {/* INGREDIENTS */}
            <textarea
              rows="2"
              placeholder="Ingredients (e.g. flour, sugar, butter)"
              className="input"
              {...register("ingredients")}
            />

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold transition"
            >
              {isSubmitting ? "Publishing..." : "Publish Product 🍪"}
            </button>
          </form>

          {/* PREVIEW PANEL */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t lg:border-t-0 lg:border-l">
            <h3 className="text-sm font-semibold mb-3">Live Preview</h3>

            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="h-48 w-full object-cover rounded-lg shadow"
              />
            ) : (
              <div className="h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500">
                No Image Preview
              </div>
            )}

            <div className="mt-4 text-sm space-y-2 text-gray-600 dark:text-gray-300">
              <p>🍪 Product preview will appear here</p>
              <p>⭐ Rating will be shown after input</p>
              <p>📦 Stock status auto updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #ddd;
          outline: none;
          margin-top: 6px;
          background: white;
        }

        .input:focus {
          border-color: #f59e0b;
        }

        .error {
          color: red;
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default AddBiscuit;
