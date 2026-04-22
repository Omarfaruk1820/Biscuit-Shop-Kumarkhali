import React from "react";

const MarqueeBar = () => {
  return (
    <div className="bg-primary text-white py-2 rounded-xl overflow-hidden">
      <div className="animate-marquee whitespace-nowrap">
        🚚 Free delivery on orders over ৳500 &nbsp;&nbsp;&nbsp;
        🎉 Buy 2 Get 1 Free &nbsp;&nbsp;&nbsp;
        🍪 Fresh biscuits available daily &nbsp;&nbsp;&nbsp;
      </div>
    </div>
  );
};

export default MarqueeBar;