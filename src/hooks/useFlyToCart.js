import { useState } from "react";

export const useFlyToCart = () => {
  const [flyingImage, setFlyingImage] = useState(null);

  const flyToCart = (img, startRect, endRect) => {
    const start = startRect.getBoundingClientRect();
    const end = endRect.getBoundingClientRect();

    const style = {
      position: "fixed",
      left: start.left,
      top: start.top,
      width: start.width,
      height: start.height,
      zIndex: 9999,
      transition: "all 0.8s cubic-bezier(0.4,0,0.2,1)",
    };

    setFlyingImage({ img, style, start, end });

    setTimeout(() => {
      setFlyingImage((prev) => ({
        ...prev,
        style: {
          ...style,
          left: end.left,
          top: end.top,
          width: 20,
          height: 20,
          opacity: 0.2,
        },
      }));
    }, 10);

    setTimeout(() => {
      setFlyingImage(null);
    }, 900);
  };

  return { flyingImage, flyToCart };
};