import React, { useState, useContext } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useToast } from "../context/ToastProvider";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Auth/AuthProvider";

const AddBiscuit = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

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
    if (!user?.email) {
      return addToast("Please login first ❌", "error");
    }

    try {
      const payload = {
        name: data.name.trim(),
        price: Number(data.price),
        stock: Number(data.stock),
        image: data.image.trim(),
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

      const res = await axios.post(
        "http://localhost:5173/products",
        payload,
        {
          withCredentials: true, // ✅ JWT cookie
        }
      );

      if (res.data?.success) {
        addToast("🍪 Product added successfully!", "success");
        reset();
        setPreview("");
        navigate("/products");
      }

    } catch (error) {
      console.error(error);

      if (error.response?.status === 403) {
        addToast("Only admin can add product ❌", "errror");
      } else {
        addToast(
          error.response?.data?.message || "Failed to add products ❌",
          "error"
        );
      }
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-amber-500 text-white px-6 py-5">
          <h2 className="text-2xl font-bold">🍪 Add Biscuit Product</h2>
          <p className="text-sm opacity-90">
            Only admin can publish products
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
              placeholder="Product Name"
              className="input"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="error">{errors.name.message}</p>}

            {/* PRICE + STOCK */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Price (e.g. 100)"
                className="input"
                {...register("price", {
                  required: "Price required",
                  min: { value: 1, message: "Must be positive" },
                })}
              />
              <input
                type="number"
                placeholder="Stock (e.g. 50)"
                className="input"
                {...register("stock", {
                  required: "Stock required",
                  min: { value: 0, message: "Invalid stock" },
                })}
              />
            </div>

            {/* IMAGE */}
            <input
              type="text"
              placeholder="Image URL"
              className="input"
              {...register("image", { required: "Image required" })}
              onChange={(e) => setPreview(e.target.value)}
            />

            {/* CATEGORY + BRAND */}
            <div className="grid grid-cols-2 gap-4">
              <select className="input" {...register("category")}>
                <option value="biscuit">Biscuit</option>
                <option value="cookie">Cookie</option>
                <option value="cake">Cake</option>
              </select>

              <input
                type="text"
                placeholder="Brand (e.g. Nurani toast)"
                className="input"
                {...register("brand")}
              />
            </div>

            {/* RATING + REVIEWS + DISCOUNT */}
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                step="0.1"
                placeholder="Rating"
                className="input"
                {...register("rating")}
              />
              <input
                type="number"
                placeholder="Reviews"
                className="input"
                {...register("reviews")}
              />
              <input
                type="number"
                placeholder="Discount %"
                className="input"
                {...register("discount")}
              />
            </div>

            {/* WEIGHT + EXPIRY */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Weight (e.g. 160g)"
                className="input"
                {...register("weight")}
              />
              <input
                type="date"
                className="input"
                {...register("expiry")}
              />
            </div>

            {/* DESCRIPTION */}
            <textarea
              placeholder="Description"
              className="input"
              {...register("description")}
            />

            {/* INGREDIENTS */}
            <textarea
              placeholder="Ingredients (e.g. Sugar, water, oil)"
              className="input"
              {...register("ingredients")}
            />

            {/* SUBMIT */}
            <button
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold transition"
            >
              {isSubmitting ? "Publishing..." : "Publish Product 🍪"}
            </button>
          </form>

          {/* PREVIEW */}
          <div className="p-6 bg-gray-50 border-l">
            <h3 className="text-sm font-semibold mb-3">Live Preview</h3>

            {preview ? (
              <img
                src={preview}
                alt="preview"
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/300?text=Invalid+Image")
                }
                className="h-48 w-full object-cover rounded-lg shadow"
              />
            ) : (
              <div className="h-48 flex items-center justify-center bg-gray-200 rounded-lg">
                No Preview
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              <p>🍪 Product preview will appear here</p>
              <p>⭐ Rating & details will be saved</p>
              <p>📦 Stock handled automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* STYLE */}
      <style>{`
        .input {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #ddd;
        }
        .input:focus {
          border-color: #f59e0b;
          outline: none;
        }
        .error {
          color: red;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default AddBiscuit;