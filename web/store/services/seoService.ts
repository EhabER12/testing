import axiosInstance from "@/lib/axios";

export interface SeoSiteStats {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface KeywordOpportunity {
  keyword: string;
  page: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface ArticleWithSeoData {
  _id: string;
  title: string;
  slug: string;
  seoData: {
    lastCheck: string;
    clicks7d: number;
    impressions7d: number;
    avgPos7d: number;
  };
  aiSearchOptimized: boolean;
  createdAt: string;
}

export interface GeoSuggestion {
  _id: string;
  articleId: {
    _id: string;
    title: string;
    slug: string;
  };
  type:
    | "missing_keyword"
    | "direct_answer"
    | "internal_link"
    | "structured_data"
    | "content_expansion"
    | "geo_targeting";
  priority: "high" | "medium" | "low";
  reasoning: string;
  data: {
    originalContent?: string;
    suggestedContent?: string;
    targetKeyword?: string;
    currentOccurrences?: number;
  };
  status: "pending" | "approved" | "rejected" | "applied";
  createdAt: string;
}

// Test GSC Connection
export const testGscConnection = async () => {
  const response = await axiosInstance.get("/seo/test-connection");
  return response.data;
};

// Sync GSC Data
export const syncGscData = async () => {
  const response = await axiosInstance.post("/seo/sync");
  return response.data;
};

// Get Site Stats
export const getSiteStats = async (): Promise<SeoSiteStats> => {
  const response = await axiosInstance.get("/seo/site-stats");
  return response.data.data;
};

// Get Keyword Opportunities
export const getKeywordOpportunities = async (): Promise<
  KeywordOpportunity[]
> => {
  const response = await axiosInstance.get("/seo/opportunities/keywords");
  return response.data.data;
};

// Get Articles with SEO Data
export const getArticlesWithSeoData = async (): Promise<
  ArticleWithSeoData[]
> => {
  const response = await axiosInstance.get("/seo/articles");
  return response.data.data;
};

// Audit an Article
export const auditArticle = async (articleId: string) => {
  const response = await axiosInstance.post(`/seo/audit/${articleId}`);
  return response.data;
};

// Get Pending Suggestions
export const getPendingSuggestions = async (): Promise<GeoSuggestion[]> => {
  const response = await axiosInstance.get("/seo/suggestions");
  return response.data.data;
};

// Apply a Suggestion
export const applySuggestion = async (suggestionId: string) => {
  const response = await axiosInstance.post(
    `/seo/suggestions/${suggestionId}/apply`
  );
  return response.data;
};

// Reject a Suggestion
export const rejectSuggestion = async (
  suggestionId: string,
  reason?: string
) => {
  const response = await axiosInstance.post(
    `/seo/suggestions/${suggestionId}/reject`,
    { reason }
  );
  return response.data;
};

// Content Health Types
export interface ContentHealthReport {
  generatedAt: string;
  summary: {
    totalArticles: number;
    decayingArticles: number;
    cannibalizationIssues: number;
    healthScore: number;
  };
  decayAlerts: {
    articleId: string;
    title: string;
    slug: string;
    previousPosition: string;
    currentPosition: string;
    decayAmount: string;
    severity: "critical" | "high" | "medium" | "low";
    recommendation: string;
  }[];
  cannibalizationAlerts: {
    keyword: string;
    pages: { title: string; slug: string; position: string }[];
    severity: "critical" | "high" | "medium";
  }[];
}

export interface OrphanPage {
  id: string;
  title: string;
  slug: string;
  type: string;
}

// Get Content Health Report
export const getContentHealth = async (): Promise<ContentHealthReport> => {
  const response = await axiosInstance.get("/seo/health");
  return response.data.data;
};

// Get Orphan Pages
export const getOrphanPages = async (): Promise<OrphanPage[]> => {
  const response = await axiosInstance.get("/seo/links/orphans");
  return response.data.data;
};

// Get Decaying Content
export const getDecayingContent = async () => {
  const response = await axiosInstance.get("/seo/health/decay");
  return response.data.data;
};
