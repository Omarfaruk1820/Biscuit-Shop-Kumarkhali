import React from "react";
import {
  FaCookieBite,
  FaStore,
  FaUsers,
  FaTruck,
  FaStar,
  FaHeart,
} from "react-icons/fa";
import Counter from "../pages/Counter"; // adjust path if needed

const About = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen pt-24 pb-16 px-4">

      {/* ================= HERO ================= */}
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-amber-600">
          About Biscuit Shop 🍪
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">
          We bake happiness daily with love, tradition, and premium ingredients.
        </p>
      </div>

      {/* ================= IMAGE ================= */}
      <div className="max-w-6xl mx-auto mt-10">
        <img
          src="https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80"
          alt="biscuit bakery"
          className="w-full h-[300px] sm:h-[420px] object-cover rounded-2xl shadow-lg"
        />
      </div>

      {/* ================= STATS (WITH COUNTER) ================= */}
      <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">

        {/* Biscuit Types */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-lg transition">
          <FaCookieBite className="text-3xl text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold mt-2">
            <Counter end={50} />+
          </h2>
          <p className="text-gray-500 text-sm">Biscuit Types</p>
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-lg transition">
          <FaUsers className="text-3xl text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold mt-2">
            <Counter end={10000} />+
          </h2>
          <p className="text-gray-500 text-sm">Happy Customers</p>
        </div>

        {/* Branches */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-lg transition">
          <FaStore className="text-3xl text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold mt-2">
            <Counter end={5} />+
          </h2>
          <p className="text-gray-500 text-sm">Branches</p>
        </div>
      </div>

      {/* ================= STORY ================= */}
      <div className="max-w-6xl mx-auto mt-16 grid md:grid-cols-2 gap-10 items-center">

        <img
          src="https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80"
          className="rounded-2xl shadow-lg"
          alt="baking"
        />

        <div>
          <h2 className="text-3xl font-bold text-amber-600 mb-4">
            Our Story
          </h2>

          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Biscuit Shop started as a small dream to bring fresh and tasty biscuits
            to every home. We believe in quality, freshness, and customer happiness.
          </p>

          <p className="text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
            Today, we proudly serve thousands of customers every day with love and care.
          </p>

          <div className="flex items-center gap-2 mt-5 text-amber-500">
            <FaHeart />
            <span className="font-semibold">Made with love & passion</span>
          </div>
        </div>
      </div>

      {/* ================= WHY CHOOSE US ================= */}
      <div className="max-w-6xl mx-auto mt-16 text-center">

        <h2 className="text-3xl font-bold text-amber-600 mb-10">
          Why Choose Us
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-lg transition">
            <FaStar className="text-3xl text-amber-500 mx-auto" />
            <h3 className="font-bold mt-3">Premium Quality</h3>
            <p className="text-gray-500 text-sm mt-2">
              We use high-quality ingredients for perfect taste.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-lg transition">
            <FaCookieBite className="text-3xl text-amber-500 mx-auto" />
            <h3 className="font-bold mt-3">Fresh Baking</h3>
            <p className="text-gray-500 text-sm mt-2">
              Freshly baked every single day.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow hover:shadow-lg transition">
            <FaTruck className="text-3xl text-amber-500 mx-auto" />
            <h3 className="font-bold mt-3">Fast Delivery</h3>
            <p className="text-gray-500 text-sm mt-2">
              Quick and safe delivery to your door.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;