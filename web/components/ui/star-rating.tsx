"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  name: string;
  initialRating?: number;
  required?: boolean;
  disabled?: boolean;
}

export function StarRating({
  name,
  initialRating = 0,
  required = false,
  disabled = false,
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSetRating = (value: number) => {
    if (!disabled) {
      setRating(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!disabled) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${disabled ? "opacity-70" : ""}`}>
      <input
        type="hidden"
        name={name}
        value={rating}
        required={required}
        disabled={disabled}
      />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleSetRating(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          className={`focus:outline-none ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          disabled={disabled}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hoverRating || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500">
        {rating > 0 ? `${rating} out of 5` : "Select a rating"}
      </span>
    </div>
  );
}
