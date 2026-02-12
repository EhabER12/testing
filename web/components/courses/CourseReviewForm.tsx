"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Lock } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

interface CourseReviewFormProps {
  courseId: string;
  onReviewSubmitted?: () => void;
  existingReview?: any;
  isEnrolled: boolean;
  locale: "ar" | "en";
}

export function CourseReviewForm({
  courseId,
  onReviewSubmitted,
  existingReview,
  isEnrolled,
  locale,
}: CourseReviewFormProps) {
  const isRtl = locale === "ar";
  const { userData } = useAuth();
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const userId = userData?.id || (user as any)?.id || (user as any)?._id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Please write a comment",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.post("/reviews", {
        courseId,
        userId,
        rating,
        comment,
      });

      toast({
        title: "Success",
        description: "Your review has been submitted and is pending approval",
      });

      setRating(0);
      setComment("");

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user is enrolled
  if (!isEnrolled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isRtl ? "يجب عليك الاشتراك أولاً" : "You must enroll first"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isRtl
                  ? "يجب الاشتراك في الكورس لتتمكن من كتابة تقييم"
                  : "You need to enroll in this course before you can write a review"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (existingReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= existingReview.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                    }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{existingReview.comment}</p>
            <p className="text-xs text-muted-foreground">
              Status: <span className="font-medium">{existingReview.status}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Comment</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this course..."
              rows={4}
              required
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
