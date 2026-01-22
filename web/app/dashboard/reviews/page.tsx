"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  BadgeCheck,
  BadgeX,
  Phone,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getReviews,
  approveReview,
  rejectReview,
} from "@/store/services/reviewService";
import { resetReviewStatus } from "@/store/slices/reviewSlice";
import { isAuthenticated } from "@/store/services/authService";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function ReviewsDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, isRtl } = useAdminLocale();
  const {
    reviews,
    isLoading,
    isError,
    message,
    totalPages,
    currentPage: storeCurrentPage,
  } = useAppSelector((state) => state.reviews);

  const [statusFilter, setStatusFilter] = useState<string>(""); // Default to empty string (All Statuses)
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [viewReview, setViewReview] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch reviews whenever filters or page change
  const fetchReviews = useCallback(() => {
    const params: {
      page: number;
      limit: number;
      status?: string;
    } = {
      page: currentPage,
      limit: 10,
    };
    if (statusFilter) {
      params.status = statusFilter;
    }
    dispatch(getReviews(params));
  }, [dispatch, currentPage, statusFilter]);

  useEffect(() => {
    const authenticated = isAuthenticated();

    if (!authenticated) {
      router.push("/login?redirect=/dashboard/reviews");
      return;
    }

    fetchReviews();

    return () => {
      dispatch(resetReviewStatus());
    };
  }, [dispatch, fetchReviews]);

  useEffect(() => {
    setCurrentPage(storeCurrentPage);
  }, [storeCurrentPage]);

  const handleStatusChange = (value: string) => {
    const newFilter = value === "all" ? "" : value;
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApprove = (reviewId: string) => {
    if (confirm(t("admin.reviews.approveConfirm"))) {
      dispatch(approveReview(reviewId));
    }
  };

  const openRejectDialog = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setRejectionReason(""); // Reset reason
    setIsRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (selectedReviewId && rejectionReason.trim()) {
      const payload = { reviewId: selectedReviewId, reason: rejectionReason };

      dispatch(rejectReview(payload));
      setIsRejectDialogOpen(false);
      setSelectedReviewId(null);
      // fetchReviews(); // Optional refresh
    } else {
      console.warn(
        "[handleReject] Condition not met (reviewId or reason missing/empty)."
      );
      if (!rejectionReason.trim()) {
        alert(t("admin.reviews.provideReason"));
      }
    }
  };

  const handleViewReview = (review: any) => {
    setViewReview(review);
    setIsViewDialogOpen(true);
  };

  const retryFetch = () => {
    fetchReviews();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Render Loading State
  if (isLoading && reviews.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6" dir={isRtl ? "rtl" : "ltr"}>
      <div
        className={`mb-6 flex flex-col sm:flex-row items-center justify-between gap-4`}
      >
        <h1 className="text-2xl font-bold">
          {t("admin.reviews.manageReviews")}
        </h1>
        <div>
          <Select
            value={statusFilter || "all"}
            onValueChange={handleStatusChange}
            dir={isRtl ? "rtl" : "ltr"}
          >
            <SelectTrigger className="w-[180px]" dir={isRtl ? "rtl" : "ltr"}>
              <SelectValue placeholder={t("admin.reviews.filterByStatus")} />
            </SelectTrigger>
            <SelectContent dir={isRtl ? "rtl" : "ltr"}>
              <SelectItem value="pending">
                {t("admin.reviews.pending")}
              </SelectItem>
              <SelectItem value="approved">
                {t("admin.reviews.approved")}
              </SelectItem>
              <SelectItem value="rejected">
                {t("admin.reviews.rejected")}
              </SelectItem>
              <SelectItem value="all">
                {t("admin.reviews.allStatuses")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("admin.reviews.error")}</AlertTitle>
          <AlertDescription>
            {message || t("admin.reviews.failedToLoad")}
            <Button
              variant="ghost"
              size="sm"
              onClick={retryFetch}
              disabled={isLoading}
              className="ml-2 h-auto p-1 text-xs"
            >
              {isLoading ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              {t("admin.reviews.tryAgain")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && reviews.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-6 text-center">
          <p className="text-gray-500">
            {statusFilter === ""
              ? t("admin.reviews.noReviewsFound")
              : t("admin.reviews.noReviewsWithStatus").replace(
                "{status}",
                statusFilter
              )}
          </p>
          {statusFilter && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                // Clear filter directly, which triggers fetch via useEffect dependency
                setStatusFilter("");
                setCurrentPage(1);
              }}
            >
              {t("admin.reviews.showAllReviews")}
            </Button>
          )}
        </div>
      )}

      {/* Table and Pagination */}
      {reviews.length > 0 && (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">
                    {t("admin.reviews.user")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.reviews.product")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.reviews.rating")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.reviews.comment")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.reviews.status")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.reviews.submitted")}
                  </TableHead>
                  <TableHead className="text-start">
                    {t("admin.reviews.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow key="loading-row">
                    <TableCell colSpan={7} className="text-center">
                      <Loader2 className="inline-block h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  reviews.map((review) => (
                    <TableRow key={review.id || review._id}>
                      <TableCell className="font-medium">
                        {review.name}
                        <br />
                        <span className="text-xs text-gray-500">
                          {review.email}
                        </span>
                        {review.phone && (
                          <>
                            <br />
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {review.phone}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {/* Display product name from populated productId object */}
                        {review.productId?.name?.en ??
                          review.serviceId?.title?.en ??
                          t("admin.reviews.notAvailable")}
                      </TableCell>
                      <TableCell>{review.rating}/5</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.comment}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(review.status)}>
                          {review.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          {/* Show Approve button if status is not 'approved' */}
                          {review.status !== "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              title={t("admin.reviews.approve")}
                              className="text-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => handleApprove(review._id)} // Use _id
                            >
                              <BadgeCheck className="h-4 w-4" />
                              <span className="sr-only">
                                {t("admin.reviews.approve")}
                              </span>
                            </Button>
                          )}
                          {/* Show Reject button if status is not 'rejected' */}
                          {review.status !== "rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              title={t("admin.reviews.reject")}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openRejectDialog(review._id)} // Use _id
                            >
                              <BadgeX className="h-4 w-4" />
                              <span className="sr-only">
                                {t("admin.reviews.reject")}
                              </span>
                            </Button>
                          )}
                          {/* View Details button */}
                          <Button
                            variant="outline"
                            size="sm"
                            title={t("admin.reviews.viewDetails")}
                            onClick={() => handleViewReview(review)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">
                              {t("admin.reviews.viewDetails")}
                            </span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Reject Review Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("admin.reviews.rejectReview")}</DialogTitle>
            <DialogDescription>
              {t("admin.reviews.rejectDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                {t("admin.reviews.reason")}
              </Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                }}
                className="col-span-3"
                placeholder={t("admin.reviews.reasonPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
              }}
            >
              {t("admin.reviews.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                handleReject();
              }}
            >
              {t("admin.reviews.rejectReview")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Review Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("admin.reviews.reviewDetails")}</DialogTitle>
            <DialogDescription>
              {t("admin.reviews.completeReviewInfo")}
            </DialogDescription>
          </DialogHeader>
          {viewReview && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">
                  {t("admin.reviews.name")}:
                </Label>
                <div className="col-span-3">{viewReview.name}</div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">
                  {t("admin.reviews.email")}:
                </Label>
                <div className="col-span-3">
                  {viewReview.email || t("admin.reviews.notAvailable")}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">
                  {t("admin.reviews.phone")}:
                </Label>
                <div className="col-span-3 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {viewReview.phone || t("admin.reviews.notAvailable")}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">
                  {t("admin.reviews.product")}:
                </Label>
                <div className="col-span-3">
                  {viewReview.productId?.name?.en ??
                    viewReview.serviceId?.title?.en ??
                    t("admin.reviews.notAvailable")}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">
                  {t("admin.reviews.rating")}:
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <CheckCircle
                        key={i}
                        className={`h-4 w-4 ${i < viewReview.rating
                            ? "fill-current"
                            : "fill-gray-200"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {viewReview.rating}/5
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">
                  {t("admin.reviews.comment")}:
                </Label>
                <div className="col-span-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {viewReview.comment}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">
                  {t("admin.reviews.status")}:
                </Label>
                <div className="col-span-3">
                  <Badge variant={getStatusBadgeVariant(viewReview.status)}>
                    {viewReview.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-semibold">
                  {t("admin.reviews.submitted")}:
                </Label>
                <div className="col-span-3 text-sm text-gray-600">
                  {formatDate(viewReview.createdAt)}
                </div>
              </div>
              {viewReview.rejectionReason && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-semibold text-red-600">
                    {t("admin.reviews.rejectionReason")}:
                  </Label>
                  <div className="col-span-3 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {viewReview.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                {viewReview && viewReview.status !== "approved" && (
                  <Button
                    variant="outline"
                    className="text-green-600 hover:bg-green-50"
                    onClick={() => {
                      handleApprove(viewReview._id);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <BadgeCheck className="h-4 w-4 mr-2" />
                    {t("admin.reviews.approve")}
                  </Button>
                )}
                {viewReview && viewReview.status !== "rejected" && (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      openRejectDialog(viewReview._id);
                    }}
                  >
                    <BadgeX className="h-4 w-4 mr-2" />
                    {t("admin.reviews.reject")}
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                {t("admin.reviews.close")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
