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
import { Input } from "@/components/ui/input";
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
  Search,
  Plus,
  Edit,
  Trash,
  Eye,
  AlertCircle,
  Filter,
  RefreshCw,
  Info,
  Calendar,
  CheckCircle2,
  FileEdit,
  CircleSlash,
  Tag,
  Languages,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getArticles,
  deleteArticle,
  resetArticleStatus,
  syncArticleAnalytics,
  Article,
} from "@/store/slices/articleSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

import { useAdminLocale } from "@/hooks/dashboard/useAdminLocale";

const ArticleTableSkeleton = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-[150px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[60px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[80px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[70px] rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-[100px]" />
      </TableCell>
    </TableRow>
  ));
};

interface ArticleRowProps {
  article: Article;
  onDelete: (id: string) => void;
  onEdit: (slug: string) => void;
  onView: (slug: string) => void;
}

const ArticleRow = ({ article, onDelete, onEdit, onView }: ArticleRowProps) => {
  const { t } = useAdminLocale();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "bg-green-50 text-green-600 hover:bg-green-100";
      case "draft":
        return "bg-yellow-50 text-yellow-600 hover:bg-yellow-100";
      case "archived":
        return "bg-gray-50 text-gray-600 hover:bg-gray-100";
      default:
        return "bg-gray-50 text-gray-600 hover:bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "published":
        return <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />;
      case "draft":
        return <FileEdit className="h-3.5 w-3.5 mr-1.5" />;
      case "archived":
        return <CircleSlash className="h-3.5 w-3.5 mr-1.5" />;
      default:
        return <Info className="h-3.5 w-3.5 mr-1.5" />;
    }
  };

  const isValidImage = (url: string | undefined) => {
    if (!url) return false;
    return (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/")
    );
  };

  return (
    <TableRow className="group hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="flex items-center">
          {isValidImage(article.coverImage) ? (
            <div className="mr-3 h-8 w-8 rounded-md overflow-hidden flex-shrink-0 relative">
              <Image
                src={article.coverImage!}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="mr-3 h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <span className="truncate max-w-[200px]">{article.title}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-gray-600">
          <span>{article.author?.name || t("common.unknown")}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-gray-600">
          <Calendar className="mr-1.5 h-3.5 w-3.5" />
          <span>{formatDate(article.createdAt)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-gray-600">
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          <span>
            {article?.views}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={
            article.language === "ar"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "bg-purple-50 text-purple-600 border-purple-200"
          }
        >
          {article.language === "ar" ? "العربية" : "English"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`gap-1 ${getStatusColor(article.status)}`}
        >
          {getStatusIcon(article.status)}
          {article.status === "published"
            ? t("admin.articles.published")
            : article.status === "draft"
            ? t("admin.articles.draft")
            : article.status === "archived"
            ? t("admin.articles.archived")
            : article.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(article.slug)}
                  className="h-8 w-8 text-gray-500 hover:text-blue-600"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("admin.articles.viewArticle")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(article.slug)}
                  className="h-8 w-8 text-gray-500 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("admin.articles.editArticle")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(article.id)}
                  className="h-8 w-8 text-gray-500 hover:text-red-600"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("admin.articles.deleteArticle")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
};

const ArticleCard = ({
  article,
  onDelete,
  onEdit,
  onView,
}: ArticleRowProps) => {
  const { t } = useAdminLocale();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "bg-green-50 text-green-600 hover:bg-green-100";
      case "draft":
        return "bg-yellow-50 text-yellow-600 hover:bg-yellow-100";
      case "archived":
        return "bg-gray-50 text-gray-600 hover:bg-gray-100";
      default:
        return "bg-gray-50 text-gray-600 hover:bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "published":
        return <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />;
      case "draft":
        return <FileEdit className="h-3.5 w-3.5 mr-1.5" />;
      case "archived":
        return <CircleSlash className="h-3.5 w-3.5 mr-1.5" />;
      default:
        return <Info className="h-3.5 w-3.5 mr-1.5" />;
    }
  };

  const isValidImage = (url: string | undefined) => {
    if (!url) return false;
    return (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/")
    );
  };

  return (
    <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="relative h-36 w-full">
        {isValidImage(article.coverImage) ? (
          <Image
            src={article.coverImage!}
            alt={article.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <Tag className="h-8 w-8 text-gray-300" />
          </div>
        )}
        <Badge
          variant="outline"
          className={`absolute top-2 right-2 gap-1 ${getStatusColor(
            article.status
          )}`}
        >
          {getStatusIcon(article.status)}
          {article.status === "published"
            ? t("admin.articles.published")
            : article.status === "draft"
            ? t("admin.articles.draft")
            : article.status === "archived"
            ? t("admin.articles.archived")
            : article.status}
        </Badge>
      </div>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-lg line-clamp-1">{article.title}</CardTitle>
        <CardDescription className="flex items-center">
          <span className="truncate">
            {t("admin.articles.by")}{" "}
            {article.author?.name || t("common.unknown")}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0 space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {article.excerpt || t("admin.articles.noExcerpt")}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            {formatDate(article.createdAt)}
          </div>
          <div className="flex items-center">
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {article.seoData?.views30d !== undefined
              ? article.seoData.views30d
              : article.views}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-blue-600 hover:bg-black hover:text-blue-700"
          onClick={() => onView(article.slug)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          {t("admin.dashboard.actions.view")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              {t("admin.articles.more")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(article.slug)}>
              <Edit className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(article.id)}
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <Trash className="mr-2 h-4 w-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

export default function ArticlesDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    articles,
    isLoading,
    isError,
    message,
    totalPages,
    currentPage: storeCurrentPage,
  } = useAppSelector((state) => state.articles);
  const { t, isRtl } = useAdminLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Default to current admin locale language
  const [languageFilter, setLanguageFilter] = useState<string>(() => {
    return isRtl ? "ar" : "en";
  });
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(storeCurrentPage);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  // Per-page limit with localStorage persistence
  const [limit, setLimit] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("articlesPerPage");
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchArticles = useCallback(() => {
    const params: {
      page: number;
      limit: number;
      status?: string;
      search?: string;
      language?: "en" | "ar";
      sortBy?: string;
      sortOrder?: string;
    } = {
      page: currentPage,
      limit: limit,
    };
    if (statusFilter && statusFilter !== "all") {
      params.status = statusFilter;
    }
    if (languageFilter && languageFilter !== "all") {
      params.language = languageFilter as "en" | "ar";
    }
    if (debouncedSearchQuery) {
      params.search = debouncedSearchQuery;
    }
    // Handle sorting
    if (sortBy === "newest") {
      params.sortBy = "createdAt";
      params.sortOrder = "desc";
    } else if (sortBy === "oldest") {
      params.sortBy = "createdAt";
      params.sortOrder = "asc";
    } else if (sortBy === "mostViews") {
      params.sortBy = "views";
      params.sortOrder = "desc";
    } else if (sortBy === "leastViews") {
      params.sortBy = "views";
      params.sortOrder = "asc";
    } else if (sortBy === "title") {
      params.sortBy = "title";
      params.sortOrder = "asc";
    }
    dispatch(getArticles(params));
  }, [
    dispatch,
    currentPage,
    statusFilter,
    languageFilter,
    sortBy,
    limit,
    debouncedSearchQuery,
  ]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Auto-navigate back when current page becomes empty
  useEffect(() => {
    if (!isLoading && articles.length === 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [articles.length, isLoading, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleLanguageChange = (value: string) => {
    setLanguageFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    setLimit(newLimit);
    setCurrentPage(1);
    localStorage.setItem("articlesPerPage", value);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCreateArticle = () => {
    router.push("/dashboard/articles/create");
  };

  const handleEditArticle = (slug: string) => {
    router.push(`/dashboard/articles/${slug}/edit`);
  };

  const handleViewArticle = (slug: string) => {
    window.open(`/articles/${slug}`, "_blank");
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm(t("admin.articles.confirmDelete"))) {
      dispatch(deleteArticle(id));
    }
  };

  const retryFetch = () => {
    dispatch(resetArticleStatus());
    fetchArticles();
  };

  const handleSyncAnalytics = async () => {
    await dispatch(syncArticleAnalytics());
    fetchArticles();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div dir={isRtl ? "rtl" : "ltr"}>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.articles.managementTitle")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("admin.articles.managementDescription")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSyncAnalytics} variant="outline">
            <RefreshCw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {isRtl ? "تحديث التحليلات" : "Sync Analytics"}
          </Button>
          <Button onClick={handleCreateArticle}>
            <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {t("admin.articles.createNew")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className={`absolute ${
              isRtl ? "right-3" : "left-3"
            } top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400`}
          />
          <Input
            placeholder={t("admin.articles.searchPlaceholder")}
            value={searchQuery}
            onChange={handleSearch}
            className={isRtl ? "pr-10" : "pl-10"}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center">
            <Filter
              className={`h-4 w-4 text-gray-500 ${isRtl ? "ml-2" : "mr-2"}`}
            />
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={isRtl ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                <SelectItem value="all">
                  {t("admin.articles.allStatuses")}
                </SelectItem>
                <SelectItem value="published">
                  {t("admin.articles.published")}
                </SelectItem>
                <SelectItem value="draft">
                  {t("admin.articles.draft")}
                </SelectItem>
                <SelectItem value="archived">
                  {t("admin.articles.archived")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language Filter */}
          <div className="flex items-center">
            <Languages
              className={`h-4 w-4 text-gray-500 ${isRtl ? "ml-2" : "mr-2"}`}
            />
            <Select value={languageFilter} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={isRtl ? "اللغة" : "Language"} />
              </SelectTrigger>
              <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                <SelectItem value="all">
                  {isRtl ? "جميع اللغات" : "All Languages"}
                </SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="flex items-center">
            <ArrowUpDown
              className={`h-4 w-4 text-gray-500 ${isRtl ? "ml-2" : "mr-2"}`}
            />
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={isRtl ? "ترتيب" : "Sort by"} />
              </SelectTrigger>
              <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                <SelectItem value="newest">
                  {isRtl ? "الأحدث أولاً" : "Newest First"}
                </SelectItem>
                <SelectItem value="oldest">
                  {isRtl ? "الأقدم أولاً" : "Oldest First"}
                </SelectItem>
                <SelectItem value="mostViews">
                  {isRtl ? "الأكثر مشاهدة" : "Most Views"}
                </SelectItem>
                <SelectItem value="leastViews">
                  {isRtl ? "الأقل مشاهدة" : "Least Views"}
                </SelectItem>
                <SelectItem value="title">
                  {isRtl ? "العنوان (أ-ي)" : "Title (A-Z)"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Per Page Limit */}
          <div className="flex items-center">
            <Select value={limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                <SelectItem value="10">
                  10 {isRtl ? "لكل صفحة" : "per page"}
                </SelectItem>
                <SelectItem value="25">
                  25 {isRtl ? "لكل صفحة" : "per page"}
                </SelectItem>
                <SelectItem value="50">
                  50 {isRtl ? "لكل صفحة" : "per page"}
                </SelectItem>
                <SelectItem value="100">
                  100 {isRtl ? "لكل صفحة" : "per page"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(statusFilter !== "all" ||
            languageFilter !== (isRtl ? "ar" : "en") ||
            sortBy !== "newest") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setLanguageFilter(isRtl ? "ar" : "en");
                setSortBy("newest");
                setCurrentPage(1);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className={`h-3 w-3 ${isRtl ? "ml-1" : "mr-1"}`} />
              {isRtl ? "مسح الفلاتر" : "Clear"}
            </Button>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setViewMode(viewMode === "table" ? "grid" : "table")
                  }
                  className="ml-2"
                >
                  {viewMode === "table" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <rect width="7" height="7" x="3" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="14" rx="1" />
                      <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <line x1="21" x2="3" y1="6" y2="6" />
                      <line x1="21" x2="3" y1="12" y2="12" />
                      <line x1="21" x2="3" y1="18" y2="18" />
                    </svg>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t("admin.articles.toggleView", {
                    view: viewMode === "table" ? "Grid" : "Table",
                  })}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start">
            <AlertCircle className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <h3 className="font-medium text-red-600">
                {t("admin.articles.errorLoading")}
              </h3>
              <p className="mt-1 text-sm text-red-600">
                {message || t("admin.settings.error")}
              </p>
              <Button
                variant="outline"
                className="mt-3 border-red-300 bg-red-50 hover:bg-red-100 text-red-600"
                onClick={retryFetch}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {t("common.retry")}
              </Button>
            </div>
          </div>
        </div>
      ) : isLoading && articles.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isRtl ? "text-right" : ""}>
                    {t("admin.articles.articleTitle")}
                  </TableHead>
                  <TableHead className={isRtl ? "text-right" : ""}>
                    {t("admin.articles.author")}
                  </TableHead>
                  <TableHead className={isRtl ? "text-right" : ""}>
                    {t("admin.articles.createdAt")}
                  </TableHead>
                  <TableHead className={isRtl ? "text-right" : ""}>
                    {t("admin.articles.views")}
                  </TableHead>
                  <TableHead className={isRtl ? "text-right" : ""}>
                    {t("admin.articles.status")}
                  </TableHead>
                  <TableHead className={isRtl ? "text-left" : "text-right"}>
                    {t("admin.articles.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <ArticleTableSkeleton />
              </TableBody>
            </Table>
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <FileEdit className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {t("admin.articles.noArticles")}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || statusFilter !== "all"
              ? t("admin.articles.tryAdjusting")
              : t("admin.articles.getStarted")}
          </p>
          <Button onClick={handleCreateArticle} className="mt-6">
            <Plus className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {t("admin.articles.createNew")}
          </Button>
        </div>
      ) : (
        <>
          {viewMode === "table" && (
            <div className="rounded-md border hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={isRtl ? "text-right" : ""}>
                      {t("admin.articles.articleTitle")}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : ""}>
                      {t("admin.articles.author")}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : ""}>
                      {t("admin.articles.createdAt")}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : ""}>
                      {t("admin.articles.views")}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : ""}>
                      {isRtl ? "اللغة" : "Language"}
                    </TableHead>
                    <TableHead className={isRtl ? "text-right" : ""}>
                      {t("admin.articles.status")}
                    </TableHead>
                    <TableHead className={isRtl ? "text-left" : "text-right"}>
                      {t("admin.articles.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      onDelete={handleDeleteArticle}
                      onEdit={handleEditArticle}
                      onView={handleViewArticle}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Card view - always shown on mobile, shown on md+ when grid mode selected */}
          <div
            className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
              viewMode === "table" ? "md:hidden" : ""
            }`}
          >
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onDelete={handleDeleteArticle}
                onEdit={handleEditArticle}
                onView={handleViewArticle}
              />
            ))}
          </div>

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
        </>
      )}
    </div>
  );
}
