"use client";

import { forwardRef } from "react";
import { Star } from "lucide-react";

interface Review {
  id: string;
  name: string;
  comment: string;
  rating: number;
}

interface ReviewsSectionProps {
  locale: string;
  reviews: Review[];
}

export const ReviewsSection = forwardRef<HTMLDivElement, ReviewsSectionProps>(
  function ReviewsSection({ locale, reviews }, ref) {
    const isRtl = locale === "ar";

    // Safeguard: ensure reviews is an array
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0)
      return null;

    return (
      <section
        ref={ref}
        id="reviews"
        className="py-16 sm:py-20 md:py-24 relative overflow-hidden bg-gray-50"
      >
        <div className="relative z-10">
          {/* Section Header */}
          <div
            className="mb-12 sm:mb-14 md:mb-16 text-center container px-4 sm:px-6 md:px-6"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <h2 className="mb-3">
              <span className="block text-base sm:text-lg md:text-xl font-medium text-gray-700 tracking-wide mb-1">
                {isRtl ? "آراء العملاء" : "Client Reviews"}
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
                {isRtl ? "ماذا يقول " : "What Our "}
                <span className="text-genoun-green">
                  {isRtl ? "عملاؤنا" : "Clients Say"}
                </span>
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mt-3 px-4 sm:px-0">
              {isRtl
                ? "قصص نجاح حقيقية من شركاء أعمالنا"
                : "Real success stories from our business partners"}
            </p>
          </div>

          {/* Dual Row Slider Container */}
          <div className="relative max-h-[600px] overflow-hidden">
            {/* Left Fade Overlay */}
            <div
              className="absolute left-0 top-0 h-full w-32 md:w-48 z-20 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(249, 250, 251, 1) 0%, rgba(249, 250, 251, 0.8) 30%, rgba(249, 250, 251, 0) 100%)",
              }}
            />

            {/* Right Fade Overlay */}
            <div
              className="absolute right-0 top-0 h-full w-32 md:w-48 z-20 pointer-events-none"
              style={{
                background:
                  "linear-gradient(270deg, rgba(249, 250, 251, 1) 0%, rgba(249, 250, 251, 0.8) 30%, rgba(249, 250, 251, 0) 100%)",
              }}
            />

            {/* First Row - Scrolling Left to Right */}
            <div className="overflow-hidden pb-6">
              <div className="review-slider-row-1 flex gap-6 w-max">
                {[...reviews, ...reviews, ...reviews].map((review, index) => (
                  <div
                    key={`row1-${review.id}-${index}`}
                    className="review-card group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 flex-shrink-0 w-[340px] bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-genoun-gold/30"
                  >
                    {/* Quote Icon Background */}
                    <div className="absolute top-3 right-3 text-genoun-gold/20 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                      <svg
                        className="h-12 w-12"
                        fill="currentColor"
                        viewBox="0 0 32 32"
                      >
                        <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
                      </svg>
                    </div>

                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 transition-all duration-300 ${
                            i < review.rating
                              ? "fill-genoun-gold text-genoun-gold"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p
                      className="text-gray-900 text-sm leading-relaxed mb-4 relative z-10 font-medium line-clamp-4"
                      dir="rtl"
                    >
                      "{review.comment}"
                    </p>

                    {/* Reviewer Info */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-base bg-genoun-green">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {review.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isRtl ? "عميل معتمد" : "Verified Client"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Second Row - Scrolling Right to Left */}
            <div className="overflow-hidden pb-6">
              <div className="review-slider-row-2 flex gap-6 w-max">
                {[...reviews, ...reviews, ...reviews].map((review, index) => (
                  <div
                    key={`row2-${review.id}-${index}`}
                    className="review-card group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 flex-shrink-0 w-[340px] bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-genoun-gold/30"
                  >
                    {/* Quote Icon Background */}
                    <div className="absolute top-3 right-3 text-genoun-gold/20 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                      <svg
                        className="h-12 w-12"
                        fill="currentColor"
                        viewBox="0 0 32 32"
                      >
                        <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
                      </svg>
                    </div>

                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 transition-all duration-300 ${
                            i < review.rating
                              ? "fill-genoun-gold text-genoun-gold"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p
                      className="text-gray-900 text-sm leading-relaxed mb-4 relative z-10 font-medium line-clamp-4"
                      dir="rtl"
                    >
                      "{review.comment}"
                    </p>

                    {/* Reviewer Info */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-base bg-genoun-green">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {review.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isRtl ? "عميل معتمد" : "Verified Client"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);
