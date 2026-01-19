import axiosInstance from "@/lib/axios";

// Types
export interface ReadyTitle {
  _id: string;
  title: string;
  used: boolean;
  usedAt?: string;
  articleId?: string;
}

export interface AiArticleSettings {
  _id: string;
  promptTemplate: string;
  numberOfParagraphs: number;
  averageWordsPerParagraph: number;
  targetKeywords: string[];
  language: "ar" | "en";
  readyTitles: ReadyTitle[];
  includeImages: boolean;
  includeCoverImage: boolean;
  imageSearchKeywords: string[];
  autoPublish: boolean;
  totalArticlesNeeded: number;
  articlesPerDay: number;
  startDate: string;
  generationTime: string;
  whatsappNotificationNumbers: string[];
  notifyOnCompletion: boolean;
  isActive: boolean;
  articlesGenerated: number;
  lastGeneratedAt?: string;
  remainingArticles: number;
  unusedTitlesCount: number;
  estimatedDaysRemaining: number;
  progressPercentage: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AiArticleProgress {
  configured: boolean;
  isActive: boolean;
  totalNeeded: number;
  generated: number;
  remaining: number;
  progressPercentage: number;
  estimatedDaysRemaining: number;
  articlesPerDay: number;
  unusedTitles: number;
  pendingJobs: number;
  completedToday: number;
  failedToday: number;
  lastGeneratedAt?: string;
}

export interface AiArticleJob {
  _id: string;
  settings: string;
  titleUsed: string;
  titleId?: string;
  scheduledFor: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  articleId?: {
    _id: string;
    title: string;
    slug: string;
    status: string;
  };
  executedAt?: string;
  completedAt?: string;
  executionTimeMs?: number;
  error?: string;
  retryCount: number;
  notificationSent: boolean;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestPromptResult {
  prompt: string;
  rawResponse: string;
  parsed: {
    title: string;
    excerpt: string;
    content: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
  };
  model: string;
  article: {
    _id: string;
    title: string;
    slug: string;
    status: string;
  };
}

// API functions
export const getAiArticleSettings = async () => {
  const response = await axiosInstance.get("/ai-articles/settings");
  return response.data.data;
};

export const updateAiArticleSettings = async (
  data: Partial<AiArticleSettings>
) => {
  const response = await axiosInstance.post("/ai-articles/settings", data);
  return response.data.data;
};

export const getAiArticleProgress = async (): Promise<AiArticleProgress> => {
  const response = await axiosInstance.get("/ai-articles/progress");
  return response.data.data;
};

export const getAiArticleTitles = async (
  status?: "used" | "unused" | "all"
) => {
  const response = await axiosInstance.get("/ai-articles/titles", {
    params: { status },
  });
  return response.data.data;
};

export const addAiArticleTitles = async (titles: string[]) => {
  const response = await axiosInstance.post("/ai-articles/titles", { titles });
  return response.data.data;
};

export const removeAiArticleTitle = async (id: string) => {
  const response = await axiosInstance.delete(`/ai-articles/titles/${id}`);
  return response.data.data;
};

export const testAiArticlePrompt = async (data: {
  promptTemplate?: string;
  sampleTitle?: string;
  settings?: Partial<AiArticleSettings>;
}): Promise<TestPromptResult> => {
  const response = await axiosInstance.post("/ai-articles/test-prompt", data);
  return response.data.data;
};

export const generateArticlesNow = async (count: number = 1) => {
  const response = await axiosInstance.post("/ai-articles/generate-now", {
    count,
  });
  return response.data.data;
};

export const getAiArticleJobs = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const response = await axiosInstance.get("/ai-articles/jobs", { params });
  return response.data.data;
};

export const retryAiArticleJob = async (id: string) => {
  const response = await axiosInstance.post(`/ai-articles/jobs/${id}/retry`);
  return response.data.data;
};

export const cancelPendingJobs = async () => {
  const response = await axiosInstance.post("/ai-articles/cancel-pending");
  return response.data.data;
};

export const testWhatsappConnection = async (number: string) => {
  const response = await axiosInstance.post("/ai-articles/test-whatsapp", {
    number,
  });
  return response.data.data;
};

export const resetAiArticleProgress = async (resetTitles: boolean = false) => {
  const response = await axiosInstance.post("/ai-articles/reset", {
    resetTitles,
  });
  return response.data.data;
};
