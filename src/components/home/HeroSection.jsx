import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0">
        <img
          src="https://i.ibb.co.com/zTGD8Nxk/photo-1608198093002-ad4e005484ec-1.avif"
          alt="Biscuit Background"
          className="w-full h-full object-cover"
        />
        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 text-center px-4 max-w-3xl">
        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold text-white leading-tight"
        >
          Freshly Baked <span className="text-amber-400">Biscuits</span> <br />
          Delivered to Your Door
        </motion.h1>

        {/* SUBTITLE */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-4 text-gray-200 text-lg md:text-xl"
        >
          Experience the taste of premium handmade biscuits crafted with love,
          quality ingredients, and tradition.
        </motion.p>

        {/* BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/products">
            <button className="px-6 py-3 bg-amber-500 text-white rounded-lg text-lg font-semibold hover:bg-amber-600 transition shadow-lg">
              Shop Now
            </button>
          </Link>

          <Link to="/about">
            <button className="px-6 py-3 border border-white text-white rounded-lg text-lg font-semibold hover:bg-white hover:text-black transition">
              Explore More
            </button>
          </Link>
        </motion.div>

        {/* EXTRA FEATURE TAGS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-200"
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
    </section>
  );
};

export default HeroSection;
