import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

const Rating = ({
  value = 0,
  onChange,
  readonly = false,
  size = 20,
}) => {
  const [hover, setHover] = useState(null);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = hover ? star <= hover : star <= value;

        return (
          <FaStar
            key={star}
            size={size}
            className={`cursor-pointer transition ${
              active ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => !readonly && onChange && onChange(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(null)}
          />
        );
      })}
    </div>
  );
};

export default Rating;