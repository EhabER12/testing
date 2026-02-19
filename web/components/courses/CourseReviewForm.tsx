"use client";

import { useEffect, useMemo, useState } from "react";
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

type ReviewStatus = "pending" | "approved" | "rejected";

const getErrorMessage = (error: any): string => {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    "Request failed"
  );
};

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
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingMyReview, setLoadingMyReview] = useState(false);
  const [myReview, setMyReview] = useState<any>(existingReview || null);
  const userId = userData?.id || (user as any)?.id || (user as any)?._id;

  const text = useMemo(
    () =>
      isRtl
        ? {
            errorTitle: "خطأ",
            successTitle: "تم الإرسال",
            loginRequired: "يجب تسجيل الدخول لإرسال التقييم",
            ratingRequired: "يرجى اختيار عدد النجوم",
            commentRequired: "يرجى كتابة تعليق",
            submitFailed: "فشل إرسال التقييم",
            submittedPending: "تم إرسال تقييمك وهو الآن بانتظار المراجعة",
            enrollFirstTitle: "يجب عليك الاشتراك أولاً",
            enrollFirstDesc:
              "يجب الاشتراك في الكورس لتتمكن من كتابة تقييم",
            yourReview: "تقييمك",
            yourReviewLoading: "جاري التحقق من تقييمك...",
            writeReview: "اكتب تقييمك",
            rating: "التقييم",
            comment: "التعليق",
            commentPlaceholder: "شارك تجربتك مع هذا الكورس...",
            submitting: "جارٍ الإرسال...",
            submit: "إرسال التقييم",
            status: "الحالة",
            status_pending: "قيد المراجعة",
            status_approved: "مقبول",
            status_rejected: "مرفوض",
          }
        : {
            errorTitle: "Error",
            successTitle: "Success",
            loginRequired: "You must be logged in to submit a review",
            ratingRequired: "Please select a rating",
            commentRequired: "Please write a comment",
            submitFailed: "Failed to submit review",
            submittedPending: "Your review has been submitted and is pending approval",
            enrollFirstTitle: "You must enroll first",
            enrollFirstDesc:
              "You need to enroll in this course before you can write a review",
            yourReview: "Your Review",
            yourReviewLoading: "Checking your review...",
            writeReview: "Write a Review",
            rating: "Rating",
            comment: "Comment",
            commentPlaceholder: "Share your experience with this course...",
            submitting: "Submitting...",
            submit: "Submit Review",
            status: "Status",
            status_pending: "Pending",
            status_approved: "Approved",
            status_rejected: "Rejected",
          },
    [isRtl]
  );

  useEffect(() => {
    setMyReview(existingReview || null);
  }, [existingReview]);

  useEffect(() => {
    if (!userId || !courseId || existingReview) return;

    let active = true;
    setLoadingMyReview(true);

    axiosInstance
      .get(`/reviews/course/${courseId}/my-review`)
      .then((response) => {
        if (!active) return;
        setMyReview(response.data?.data || null);
      })
      .catch(() => {
        if (!active) return;
        setMyReview(null);
      })
      .finally(() => {
        if (active) setLoadingMyReview(false);
      });

    return () => {
      active = false;
    };
  }, [userId, courseId, existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: text.errorTitle,
        description: text.loginRequired,
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: text.errorTitle,
        description: text.ratingRequired,
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: text.errorTitle,
        description: text.commentRequired,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await axiosInstance.post("/reviews", {
        courseId,
        rating,
        comment,
      });

      const createdReview = response.data?.data;
      setMyReview(
        createdReview || {
          rating,
          comment,
          status: "pending",
        }
      );
      setRating(0);
      setComment("");

      toast({
        title: text.successTitle,
        description: text.submittedPending,
      });

      onReviewSubmitted?.();
    } catch (error: any) {
      toast({
        title: text.errorTitle,
        description: getErrorMessage(error) || text.submitFailed,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isEnrolled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{text.enrollFirstTitle}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {text.enrollFirstDesc}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingMyReview) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {text.yourReviewLoading}
        </CardContent>
      </Card>
    );
  }

  if (myReview) {
    const status = (myReview.status || "pending") as ReviewStatus;
    const statusLabel =
      status === "approved"
        ? text.status_approved
        : status === "rejected"
        ? text.status_rejected
        : text.status_pending;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{text.yourReview}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= (myReview.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{myReview.comment}</p>
            <p className="text-xs text-muted-foreground">
              {text.status}: <span className="font-medium">{statusLabel}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.writeReview}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{text.rating}</label>
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
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{text.comment}</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={text.commentPlaceholder}
              rows={4}
              required
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? text.submitting : text.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
