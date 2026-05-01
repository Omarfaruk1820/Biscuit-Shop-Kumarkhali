import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <img
          src="https://i.ibb.co.com/zTGD8Nxk/photo-1608198093002-ad4e005484ec-1.avif"
          alt="Fresh biscuits"
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* GRADIENT OVERLAY (extra depth) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl">

        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
        >
          Freshly Baked{" "}
          <span className="text-amber-400">Biscuits</span>
          <br className="hidden sm:block" />
          Delivered to Your Door
        </motion.h1>

        {/* SUBTITLE */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-4 text-gray-200 text-base sm:text-lg md:text-xl max-w-2xl mx-auto"
        >
          Experience the taste of premium handmade biscuits crafted with love,
          quality ingredients, and tradition.
        </motion.p>

        {/* BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
        >
          <Link to="/products">
            <button className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-white rounded-lg text-base md:text-lg font-semibold hover:bg-amber-600 transition shadow-lg">
              Shop Now
            </button>
          </Link>

          <Link to="/about">
            <button className="w-full sm:w-auto px-6 py-3 border border-white text-white rounded-lg text-base md:text-lg font-semibold hover:bg-white hover:text-black transition">
              Explore More
            </button>
          </Link>
        </motion.div>

        {/* FEATURES */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-200"
        >
          <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur">
            🍪 Fresh Daily
          </span>

          <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur">
            🚚 Fast Delivery
          </span>

          <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur">
            ⭐ Premium Quality
          </span>
        </motion.div>

      </div>

      {/* OPTIONAL DECORATION */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/80 to-transparent"></div>

    </section>
  );
};

export default HeroSection;