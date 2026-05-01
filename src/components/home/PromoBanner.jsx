import React from "react";
import { Link } from "react-router-dom";

const PromoBanner = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-100 via-orange-100 to-amber-100 px-5 md:px-10 py-8 md:py-12 flex flex-col-reverse lg:flex-row items-center justify-between gap-6 shadow-sm">

      {/* LEFT CONTENT */}
      <div className="text-center lg:text-left max-w-xl">

        {/* TAG */}
        <span className="inline-block text-xs bg-amber-500 text-white px-3 py-1 rounded-full mb-3">
          Fresh Bakery
        </span>

        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
          Fresh & Crispy Biscuits 🍪 <br />
          Delivered to Your Door
        </h1>

        {/* DESCRIPTION */}
        <p className="text-gray-600 mt-3 text-sm md:text-base">
          Enjoy premium quality biscuits with unbeatable freshness. Order online
          or visit our store for daily fresh stock.
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">

          <Link
            to="/products"
            className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-medium transition text-sm"
          >
            Shop Now
          </Link>

          <Link
            to="/shop"
            className="border border-amber-500 text-amber-600 hover:bg-amber-100 px-5 py-2 rounded-lg font-medium transition text-sm"
          >
            Explore
          </Link>

        </div>

      </div>

      {/* RIGHT IMAGE */}
      <div className="relative flex justify-center">

        <img
          src="https://i.ibb.co.com/8g4nMcXP/download-3.jpg"
          alt="biscuit"
          className="w-40 sm:w-52 md:w-64 lg:w-72 object-contain drop-shadow-lg"
        />

        {/* DECORATION */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-300 rounded-full opacity-30 blur-2xl"></div>

      </div>

    </section>
  );
};

export default PromoBanner;