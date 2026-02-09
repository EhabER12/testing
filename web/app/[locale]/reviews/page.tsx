"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote, Award, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Review {
  id: string;
  userId?: {
    id: string;
    name: string;
    profilePic?: string;
  };
  name?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  courseId?: {
    title: { ar: string; en: string };
  };
  productId?: {
    name: { ar: string; en: string };
  };
  serviceId?: {
    title: { ar: string; en: string };
  };
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ReviewsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/reviews", {
        params: {
          status: "approved",
          limit: 50,
          sortBy: "newest",
        },
      });

      const reviewsData = response.data?.data?.reviews || [];
      setReviews(reviewsData);

      // Calculate stats
      if (reviewsData.length > 0) {
        const total = reviewsData.length;
        const sum = reviewsData.reduce((acc: number, r: Review) => acc + r.rating, 0);
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        
        reviewsData.forEach((r: Review) => {
          distribution[r.rating as keyof typeof distribution]++;
        });

        setStats({
          totalReviews: total,
          averageRating: sum / total,
          distribution,
        });
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const sizeClass = size === "lg" ? "w-6 h-6" : "w-4 h-4";
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getItemName = (review: Review) => {
    if (review.courseId?.title) {
      return isRtl ? review.courseId.title.ar : review.courseId.title.en;
    }
    if (review.productId?.name) {
      return isRtl ? review.productId.name.ar : review.productId.name.en;
    }
    if (review.serviceId?.title) {
      return isRtl ? review.serviceId.title.ar : review.serviceId.title.en;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12" dir={isRtl ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-genoun-green to-genoun-green-dark text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Award className="w-5 h-5" />
            <span className="text-sm font-medium">
              {isRtl ? "آراء عملائنا" : "Customer Reviews"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isRtl ? "ماذا يقول عملاؤنا" : "What Our Customers Say"}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {isRtl
              ? "آراء حقيقية من طلاب وعملاء استفادوا من خدماتنا"
              : "Real feedback from students and customers who benefited from our services"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 pb-20">
        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Average Rating */}
            <Card className="bg-white shadow-xl border-0">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold text-genoun-green mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(stats.averageRating), "lg")}
                <p className="text-gray-600 mt-2">
                  {isRtl ? "متوسط التقييم" : "Average Rating"}
                </p>
              </CardContent>
            </Card>

            {/* Total Reviews */}
            <Card className="bg-white shadow-xl border-0">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-genoun-green mx-auto mb-2" />
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stats.totalReviews}
                </div>
                <p className="text-gray-600">
                  {isRtl ? "تقييم" : "Reviews"}
                </p>
              </CardContent>
            </Card>

            {/* 5 Star Percentage */}
            <Card className="bg-white shadow-xl border-0">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-genoun-green mx-auto mb-2" />
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {Math.round((stats.distribution[5] / stats.totalReviews) * 100)}%
                </div>
                <p className="text-gray-600">
                  {isRtl ? "تقييم 5 نجوم" : "5-Star Reviews"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rating Distribution */}
        {stats && (
          <Card className="mb-12 bg-white shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {isRtl ? "توزيع التقييمات" : "Rating Distribution"}
              </h2>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-24">
                      <span className="text-sm font-medium text-gray-700">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-genoun-green to-genoun-green-dark h-full rounded-full transition-all"
                        style={{
                          width: `${(stats.distribution[rating as keyof typeof stats.distribution] / stats.totalReviews) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-end">
                      {stats.distribution[rating as keyof typeof stats.distribution]} {isRtl ? "تقييم" : "reviews"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {isRtl ? "جميع التقييمات" : "All Reviews"}
          </h2>

          {reviews.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <Quote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {isRtl ? "لا توجد تقييمات حتى الآن" : "No reviews yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review) => {
                const itemName = getItemName(review);
                const userName = review.userId?.name || review.name || (isRtl ? "مجهول" : "Anonymous");
                
                return (
                  <Card key={review.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={review.userId?.profilePic} />
                          <AvatarFallback className="bg-genoun-green text-white">
                            {userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{userName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Item Name */}
                      {itemName && (
                        <Badge variant="secondary" className="mb-3">
                          {itemName}
                        </Badge>
                      )}

                      {/* Comment */}
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-4">
                          {review.images.map((img, idx) => (
                            <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={img}
                                alt={`Review ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
