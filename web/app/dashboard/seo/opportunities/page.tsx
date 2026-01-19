"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Sparkles,
  Target,
  MessageSquare,
  Link as LinkIcon,
  FileText,
  Globe,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from "lucide-react";
import Link from "next/link";
import {
  getPendingSuggestions,
  applySuggestion,
  rejectSuggestion,
  GeoSuggestion,
} from "@/store/services/seoService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

const typeIcons: Record<string, React.ReactNode> = {
  missing_keyword: <Target className="h-5 w-5 text-blue-500" />,
  direct_answer: <MessageSquare className="h-5 w-5 text-purple-500" />,
  internal_link: <LinkIcon className="h-5 w-5 text-green-500" />,
  structured_data: <FileText className="h-5 w-5 text-orange-500" />,
  content_expansion: <Sparkles className="h-5 w-5 text-yellow-500" />,
  geo_targeting: <Globe className="h-5 w-5 text-red-500" />,
};

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-gray-400",
};

export default function SeoOpportunitiesPage() {
  const { t, isRtl } = useAdminLocale();

  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPendingSuggestions();
      setSuggestions(data);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message || "Failed to load suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const currentSuggestion = suggestions[currentIndex];

  const getTypeLabel = (type: string) => {
    return t(`admin.seo.opportunities.types.${type}`) || type;
  };

  const handleApprove = async () => {
    if (!currentSuggestion) return;
    setIsProcessing(true);
    try {
      await applySuggestion(currentSuggestion._id);
      setSuggestions((prev) =>
        prev.filter((s) => s._id !== currentSuggestion._id)
      );
      if (currentIndex >= suggestions.length - 1) {
        setCurrentIndex(Math.max(0, suggestions.length - 2));
      }
    } catch (err: any) {
      setError(err.message || "Failed to apply suggestion");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentSuggestion) return;
    setIsProcessing(true);
    try {
      await rejectSuggestion(currentSuggestion._id, rejectReason);
      setSuggestions((prev) =>
        prev.filter((s) => s._id !== currentSuggestion._id)
      );
      if (currentIndex >= suggestions.length - 1) {
        setCurrentIndex(Math.max(0, suggestions.length - 2));
      }
      setShowRejectDialog(false);
      setRejectReason("");
    } catch (err: any) {
      setError(err.message || "Failed to reject suggestion");
    } finally {
      setIsProcessing(false);
    }
  };

  const goNext = () => {
    if (currentIndex < suggestions.length - 1)
      setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div
      className={`flex-1 space-y-6 p-6 text-start`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-4 justify-between ${isRtl ? "flex-row-reverse" : ""} `}
      >
        <Link href="/dashboard/seo">
          <Button variant="ghost" size="sm">
            <ArrowLeft
              className={`h-4 w-4 ${isRtl ? "ml-2 rotate-180" : "mr-2"}`}
            />
            {t("admin.seo.opportunities.backToSeo")}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {t("admin.seo.opportunities.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.seo.opportunities.subtitle")}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div
        className={`flex items-center justify-between text-sm text-muted-foreground ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        <span>
          {suggestions.length > 0
            ? `${currentIndex + 1} ${t("admin.seo.opportunities.of")} ${
                suggestions.length
              } ${t("admin.seo.opportunities.pending")}`
            : t("admin.seo.opportunities.noPending")}
        </span>
        <Button variant="outline" size="sm" onClick={loadSuggestions}>
          {t("admin.seo.opportunities.refresh")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("admin.seo.error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No suggestions */}
      {suggestions.length === 0 && !error && (
        <Card className="text-center py-16">
          <CardContent>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("admin.seo.opportunities.allCaughtUp")}
            </h2>
            <p className="text-muted-foreground">
              {t("admin.seo.opportunities.allCaughtUpDesc")}
            </p>
            <Link href="/dashboard/seo">
              <Button className="mt-4">
                {t("admin.seo.opportunities.goToSeoDashboard")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Current Suggestion Card */}
      {currentSuggestion && (
        <Card className="border-2">
          <CardHeader>
            <div
              className={`flex items-start justify-between ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex items-center gap-3 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                {typeIcons[currentSuggestion.type]}
                <div>
                  <CardTitle className="text-lg">
                    {getTypeLabel(currentSuggestion.type)}
                  </CardTitle>
                  <CardDescription>
                    {t("admin.seo.article")}:{" "}
                    {currentSuggestion.articleId?.title || "Unknown"}
                  </CardDescription>
                </div>
              </div>
              <Badge
                className={`${
                  priorityColors[currentSuggestion.priority]
                } text-white`}
              >
                {currentSuggestion.priority.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm">
                {t("admin.seo.opportunities.whyMatters")}
              </h4>
              <p className="text-sm">{currentSuggestion.reasoning}</p>
            </div>

            {currentSuggestion.data?.targetKeyword && (
              <div>
                <h4 className="font-medium mb-1 text-sm">
                  {t("admin.seo.opportunities.targetKeyword")}:
                </h4>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {currentSuggestion.data.targetKeyword}
                </Badge>
              </div>
            )}

            {currentSuggestion.data?.suggestedContent && (
              <div>
                <div
                  className={`flex items-center justify-between mb-2 ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <h4 className="font-medium text-sm">
                    {t("admin.seo.opportunities.suggestedAddition")}:
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreviewDialog(true)}
                  >
                    <Eye className={`h-4 w-4 ${isRtl ? "ml-1" : "mr-1"}`} />
                    {t("admin.seo.opportunities.fullPreview")}
                  </Button>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-green-800 line-clamp-4">
                    {currentSuggestion.data.suggestedContent}
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter
            className={`flex justify-between border-t pt-4 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={currentIndex === 0}
              >
                {t("admin.seo.opportunities.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goNext}
                disabled={currentIndex >= suggestions.length - 1}
              >
                {t("admin.seo.opportunities.next")}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
              >
                <ThumbsDown className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {t("admin.seo.opportunities.reject")}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={isProcessing}
              >
                <ThumbsUp className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {t("admin.seo.opportunities.approveApply")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("admin.seo.opportunities.rejectSuggestion")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.seo.opportunities.rejectDesc")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t("admin.seo.opportunities.reasonPlaceholder")}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              {t("admin.seo.opportunities.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {t("admin.seo.opportunities.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("admin.seo.opportunities.fullPreviewTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {currentSuggestion?.data?.originalContent && (
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-sm text-red-600">
                  {t("admin.seo.opportunities.originalContent")}
                </h4>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm">
                    {currentSuggestion.data.originalContent}
                  </p>
                </div>
              </div>
            )}
            <div>
              <h4 className="font-medium mb-2 text-sm text-green-600">
                {t("admin.seo.opportunities.newContent")}
              </h4>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {currentSuggestion?.data?.suggestedContent}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
            >
              {t("admin.seo.opportunities.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
