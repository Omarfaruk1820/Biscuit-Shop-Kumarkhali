import React from "react";

const PromoBanner = () => {
  return (
    <section className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left Content */}
      <div className="max-w-md">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Fresh & Crispy Biscuits 🍪
        </h1>

        <p className="text-gray-600 mb-4">
          Order your favorite biscuits online or visit our shop for fresh stock
          every day.
        </p>

        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm">Shop Now</button>
          <button className="btn btn-outline btn-sm">Explore</button>
        </div>
      </div>

      {/* Right Image */}
      <div>
        <img
          src="https://i.ibb.co.com/8g4nMcXP/download-3.jpg"
          alt="biscuit"
          className="w-40 md:w-56"
        />
      </div>
    </section>
  );
};

export default PromoBanner;
