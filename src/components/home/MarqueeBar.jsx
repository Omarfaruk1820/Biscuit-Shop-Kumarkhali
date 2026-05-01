import React from "react";

const MarqueeBar = () => {
  return (
    <div className="w-full bg-amber-500 text-white rounded-xl overflow-hidden shadow">

      {/* CONTAINER */}
      <div className="relative flex overflow-hidden">

        {/* TRACK */}
        <div className="flex animate-marquee whitespace-nowrap">

          {/* CONTENT (DUPLICATE FOR LOOP) */}
          <div className="flex items-center gap-20 px-4 text-sm md:text-base font-medium">

            <span>🚚 Free delivery on orders over ৳500</span>
            <span>🎉 Buy 2 Get 1 Free</span>
            <span>🍪 Fresh biscuits available daily</span>
            <span>📍 Mamun Biscuit Shop, Station Road</span>
            <span>📍 Kumarkhali, Kushtia | 📞 01932847281</span>

          </div>

          {/* DUPLICATE SAME CONTENT (IMPORTANT FOR SMOOTH LOOP) */}
          <div className="flex items-center gap-20 px-4 text-sm md:text-base font-medium">

            <span>🚚 Free delivery on orders over ৳500</span>
            <span>🎉 Buy 2 Get 1 Free</span>
            <span>🍪 Fresh biscuits available daily</span>
            <span>📍 Mamun Biscuit Shop, Station Road</span>
            <span>📍 Kumarkhali, Kushtia | 📞 01932847281</span>

          </div>

        </div>
      </div>

      {/* STYLE */}
      <style>{`
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 20s linear infinite;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Pause on hover */
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default MarqueeBar;