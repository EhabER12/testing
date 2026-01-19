"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { getUserReviewsThunk, Review } from "@/store/services/reviewService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function ReviewsTab({
  initialData = [],
  isArabic,
}: {
  initialData?: any[];
  isArabic?: boolean;
}) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    reviews,
    isLoading: isReviewLoading,
    isError: isReviewError,
    message: reviewMessage,
  } = useSelector((state: RootState) => state.reviews);

  // Use initialData if reviews is empty, effectively preferring server data on first load
  const currentReviews =
    reviews.length > 0 ? reviews : initialData.length > 0 ? initialData : [];

  useEffect(() => {
    if (user && reviews.length === 0 && initialData.length === 0) {
      // @ts-ignore
      dispatch(getUserReviewsThunk({ sort: "-createdAt" }));
    }
  }, [dispatch, user, reviews.length, initialData.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isReviewLoading && currentReviews.length === 0) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">
                {t("reviews.product")}
              </TableHead>
              <TableHead className="text-start">
                {t("reviews.rating")}
              </TableHead>
              <TableHead className="text-start">
                {t("reviews.comment")}
              </TableHead>
              <TableHead className="text-start">{t("reviews.date")}</TableHead>
              <TableHead className="text-start">
                {t("reviews.status")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isReviewLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">{tCommon("loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("reviews.noReviews")}
                </TableCell>
              </TableRow>
            ) : (
              currentReviews.map((review) => (
                <TableRow key={review.id || review._id}>
                  <TableCell className="font-medium text-start">
                    {isArabic
                      ? review.productId?.name?.ar ||
                        review.serviceId?.title?.ar ||
                        review.productId?.name?.en ||
                        review.serviceId?.title?.en ||
                        tCommon("unknown")
                      : review.productId?.name?.en ||
                        review.serviceId?.title?.en ||
                        tCommon("unknown")}
                  </TableCell>
                  <TableCell className="text-start">
                    {review.rating}/5
                  </TableCell>
                  <TableCell
                    className="max-w-xs truncate text-start"
                    title={review.comment}
                  >
                    {review.comment}
                  </TableCell>
                  <TableCell className="text-start">
                    {new Date(review.createdAt || "").toLocaleDateString(
                      isArabic ? "ar-EG" : "en-US"
                    )}
                  </TableCell>
                  <TableCell className="text-start">
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "default"
                          : review.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {t(`statuses.${review.status}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
