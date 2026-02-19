"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, User } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Review {
  id: string;
  userId: {
    id: string;
    fullName: { ar: string; en: string };
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  status: string;
}

interface ReviewsListProps {
  courseId: string;
  locale: "ar" | "en";
  refreshKey?: number;
}

export function CourseReviewsList({
  courseId,
  locale,
  refreshKey = 0,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isRtl = locale === "ar";

  const text = useMemo(
    () =>
      isRtl
        ? {
            noReviews: "لا توجد تقييمات بعد",
            reviewsWord: "تقييم",
            user: "مستخدم",
            anonymous: "مستخدم مجهول",
          }
        : {
            noReviews: "No reviews yet",
            reviewsWord: "reviews",
            user: "User",
            anonymous: "Anonymous",
          },
    [isRtl]
  );

  useEffect(() => {
    fetchReviews();
  }, [courseId, refreshKey]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/reviews/course/${courseId}?status=approved&limit=20`
      );
      setReviews(response.data?.data?.reviews || []);
      setStats(response.data?.data?.stats || null);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isRtl
      ? date.toLocaleDateString("ar-SA")
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-16 w-full bg-gray-200 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{text.noReviews}</div>;
  }

  return (
    <div className="space-y-6">
      {stats && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-500">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.totalReviews} {text.reviewsWord}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <div className="w-12 text-sm">{rating} ★</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${
                            stats.totalReviews > 0
                              ? ((stats.distribution[rating] || 0) / stats.totalReviews) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="w-12 text-sm text-muted-foreground">
                      {stats.distribution[rating] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage
                    src={review.userId?.avatar}
                    alt={review.userId?.fullName?.[locale] || text.user}
                  />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {review.userId?.fullName?.[locale] || text.anonymous}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
