"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  TrendingUp,
  Eye,
  MousePointerClick,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Zap,
  Heart,
  TrendingDown,
  Link2Off,
} from "lucide-react";
import Link from "next/link";
import {
  getSiteStats,
  getArticlesWithSeoData,
  syncGscData,
  testGscConnection,
  auditArticle,
  getContentHealth,
  getOrphanPages,
  SeoSiteStats,
  ArticleWithSeoData,
  ContentHealthReport,
  OrphanPage,
} from "@/store/services/seoService";
import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

export default function SeoDashboardPage() {
  const { t, isRtl } = useAdminLocale();

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [siteStats, setSiteStats] = useState<SeoSiteStats | null>(null);
  const [articles, setArticles] = useState<ArticleWithSeoData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [auditingArticle, setAuditingArticle] = useState<string | null>(null);
  const [healthReport, setHealthReport] = useState<ContentHealthReport | null>(
    null
  );
  const [orphanPages, setOrphanPages] = useState<OrphanPage[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const connectionResult = await testGscConnection();
        setIsConnected(connectionResult.success);

        if (connectionResult.success) {
          const [statsData, articlesData] = await Promise.all([
            getSiteStats(),
            getArticlesWithSeoData(),
          ]);
          setSiteStats(statsData);
          setArticles(articlesData);
        }

        // Load health data regardless of GSC connection
        try {
          const [healthData, orphansData] = await Promise.all([
            getContentHealth(),
            getOrphanPages(),
          ]);
          setHealthReport(healthData);
          setOrphanPages(orphansData);
        } catch (healthErr) {
          console.warn("Could not load health data:", healthErr);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load SEO data");
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncGscData();
      const [statsData, articlesData] = await Promise.all([
        getSiteStats(),
        getArticlesWithSeoData(),
      ]);
      setSiteStats(statsData);
      setArticles(articlesData);
    } catch (err: any) {
      setError(err.message || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAudit = async (articleId: string) => {
    setAuditingArticle(articleId);
    try {
      const result = await auditArticle(articleId);
      alert(`Generated ${result.data.suggestionsGenerated} suggestions`);
    } catch (err: any) {
      alert(err.message || "Audit failed");
    } finally {
      setAuditingArticle(null);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCtr = (ctr: number) => (ctr * 100).toFixed(2) + "%";
  const formatPosition = (pos: number) => pos.toFixed(1);

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            {t("admin.seo.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.seo.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/seo/opportunities">
            <Button variant="default" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t("admin.seo.viewOpportunities")}
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing || !isConnected}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? t("admin.seo.syncing") : t("admin.seo.syncGscData")}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {isConnected === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("admin.seo.gscNotConnected")}</AlertTitle>
          <AlertDescription>
            {t("admin.seo.gscNotConnectedDesc")}
          </AlertDescription>
        </Alert>
      )}

      {isConnected === true && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">
            {t("admin.seo.gscConnected")}
          </AlertTitle>
          <AlertDescription className="text-green-700">
            {t("admin.seo.gscConnectedDesc")}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("admin.seo.error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {siteStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointerClick className="h-4 w-4" />
                {t("admin.seo.totalClicks")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatNumber(siteStats.clicks)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.seo.last28Days")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {t("admin.seo.impressions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatNumber(siteStats.impressions)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.seo.last28Days")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                {t("admin.seo.avgCtr")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCtr(siteStats.ctr)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.seo.clickThroughRate")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t("admin.seo.avgPosition")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPosition(siteStats.position)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.seo.inSearchResults")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Health Section */}
      {healthReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={`${
              healthReport.summary.healthScore >= 80
                ? "border-green-200"
                : healthReport.summary.healthScore >= 50
                ? "border-yellow-200"
                : "border-red-200"
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Heart className="h-4 w-4" />
                {isRtl ? "صحة المحتوى" : "Content Health"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  healthReport.summary.healthScore >= 80
                    ? "text-green-600"
                    : healthReport.summary.healthScore >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {healthReport.summary.healthScore}%
              </div>
              <p className="text-xs text-muted-foreground">
                {isRtl ? "من أصل 100" : "out of 100"}
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              healthReport.summary.decayingArticles > 0
                ? "border-orange-200"
                : ""
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                {isRtl ? "مقالات تتراجع" : "Decaying Articles"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  healthReport.summary.decayingArticles > 0
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {healthReport.summary.decayingArticles}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRtl ? "تحتاج تحديث" : "need refresh"}
              </p>
            </CardContent>
          </Card>

          <Card className={orphanPages.length > 0 ? "border-blue-200" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Link2Off className="h-4 w-4" />
                {isRtl ? "صفحات يتيمة" : "Orphan Pages"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  orphanPages.length > 0 ? "text-blue-600" : "text-green-600"
                }`}
              >
                {orphanPages.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRtl ? "بدون روابط داخلية" : "no internal links"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.seo.topPerformingArticles")}</CardTitle>
          <CardDescription>
            {t("admin.seo.topPerformingArticlesDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.seo.noArticles")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">
                    {t("admin.seo.article")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("admin.seo.clicks")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("admin.seo.impressions")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("admin.seo.avgPos")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("admin.seo.geoReady")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("admin.seo.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article._id}>
                    <TableCell>
                      <div className="font-medium truncate max-w-xs">
                        {article.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        /{article.slug}
                      </div>
                    </TableCell>
                    <TableCell className={isRtl ? "text-left" : "text-right"}>
                      {formatNumber(article.seoData?.clicks7d || 0)}
                    </TableCell>
                    <TableCell className={isRtl ? "text-left" : "text-right"}>
                      {formatNumber(article.seoData?.impressions7d || 0)}
                    </TableCell>
                    <TableCell className={isRtl ? "text-left" : "text-right"}>
                      {formatPosition(article.seoData?.avgPos7d || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {article.aiSearchOptimized ? (
                        <Badge variant="default" className="bg-green-500">
                          {t("admin.seo.yes")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("admin.seo.no")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={isRtl ? "text-left" : "text-right"}>
                      <div
                        className={`flex items-center gap-2 ${
                          isRtl ? "justify-start" : "justify-end"
                        }`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAudit(article._id)}
                          disabled={auditingArticle === article._id}
                        >
                          {auditingArticle === article._id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                          <span className={isRtl ? "mr-1" : "ml-1"}>
                            {t("admin.seo.audit")}
                          </span>
                        </Button>
                        <Link
                          href={`/ar/articles/${article.slug}`}
                          target="_blank"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
