import React, { useState, useContext } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Auth/AuthProvider";
import { useToast } from "../context/ToastProvider";

const API = import.meta.env.VITE_API_URL;

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
      category: "biscuit",
      rating: 4.5,
      reviews: 0,
      discount: 0,
      stock: 0,
    },
  });

  // ================= SUBMIT =================
  const onSubmit = async (data) => {
    try {
      if (!user?.email) {
        return addToast("Please login first ❌", "error");
      }

      const payload = {
        name: data.name?.trim(),
        price: Number(data.price),
        stock: Number(data.stock || 0),
        image: data.image?.trim(),
        rating: Number(data.rating || 4.5),
        category: data.category,
        reviews: Number(data.reviews || 0),
        brand: data.brand?.trim() || "",
        weight: data.weight?.trim() || "",
        description: data.description?.trim() || "",
        ingredients: data.ingredients?.trim() || "",
        expiry: data.expiry || "",
        discount: Number(data.discount || 0),
        createdBy: user.email,
      };

      const res = await axios.post(`${API}/products`, payload, {
        withCredentials: true,
      });

      if (res.data?.success) {
        addToast("🍪 Product added successfully!", "success");
        reset();
        setPreview("");
        navigate("/products");
      } else {
        addToast(res.data?.message || "Failed ❌", "error");
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Server error ❌", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">

      <div className="max-w-6xl mx-auto mt-10 bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* HEADER */}
        <div className="bg-amber-500 text-white p-5">
          <h2 className="text-xl md:text-2xl font-bold">
            🍪 Add Biscuit Product
          </h2>
          <p className="text-sm opacity-90">
            Admin product creation panel
          </p>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3">

          {/* FORM */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="lg:col-span-2 p-4 md:p-6 space-y-4"
          >

            {/* NAME */}
            <div>
              <input
                placeholder="Product Name"
                className="input"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* PRICE + STOCK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                type="number"
                placeholder="Price"
                className="input"
                {...register("price", { required: true })}
              />

              <input
                type="number"
                placeholder="Stock"
                className="input"
                {...register("stock")}
              />

            </div>

            {/* IMAGE */}
            <input
              placeholder="Image URL"
              className="input"
              {...register("image", { required: true })}
              onChange={(e) => setPreview(e.target.value)}
            />

            {/* CATEGORY + BRAND */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <select className="input" {...register("category")}>
                <option value="biscuit">Biscuit</option>
                <option value="cookie">Cookie</option>
                <option value="cake">Cake</option>
              </select>

              <input
                placeholder="Brand"
                className="input"
                {...register("brand")}
              />

            </div>

            {/* RATING + REVIEW + DISCOUNT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                placeholder="Weight"
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
              placeholder="Ingredients"
              className="input"
              {...register("ingredients")}
            />

            {/* BUTTON */}
            <button
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold transition"
            >
              {isSubmitting ? "Publishing..." : "Publish Product 🍪"}
            </button>

          </form>

          {/* PREVIEW */}
          <div className="p-4 md:p-6 bg-gray-50 border-t lg:border-t-0 lg:border-l">

            <h3 className="font-semibold mb-3">
              Live Preview
            </h3>

            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="rounded-lg h-48 w-full object-cover"
              />
            ) : (
              <div className="h-48 flex items-center justify-center bg-gray-200 rounded-lg text-gray-500">
                No Preview
              </div>
            )}

          </div>

        </div>
      </div>

      {/* INPUT STYLE */}
      <style>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 10px;
          outline: none;
          background: white;
          transition: 0.2s;
        }

        .input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }
      `}</style>

    </div>
  );
};

export default AddBiscuit;