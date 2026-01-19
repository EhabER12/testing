import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios";

// Types
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  heroImage?: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  tags: string[];
  status: "draft" | "published" | "archived";
  language?: "en" | "ar";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  seoData?: {
    lastCheck: string;
    clicks7d: number;
    impressions7d: number;
    avgPos7d: number;
    views30d: number;
  };
}

interface ArticleState {
  articles: Article[];
  article: Article | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  totalPages: number;
  currentPage: number;
}

interface GetArticlesResponse {
  results: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Async Thunks

// Get all articles
export const getArticles = createAsyncThunk<
  GetArticlesResponse,
  | {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      language?: "en" | "ar";
    }
  | undefined,
  { rejectValue: string }
>("articles/getAll", async (params, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/articles", { params });
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Get article by slug
export const getArticleBySlug = createAsyncThunk<
  Article,
  string | { slug: string; incrementView?: boolean },
  { rejectValue: string }
>("articles/getBySlug", async (arg, thunkAPI) => {
  try {
    const slug = typeof arg === "string" ? arg : arg.slug;
    const incrementView = typeof arg === "string" ? true : arg.incrementView;

    const response = await axiosInstance.get(`/articles/${slug}`, {
      params: { incrementView },
    });
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Create article
export const createArticle = createAsyncThunk<
  Article,
  FormData,
  { rejectValue: string }
>("articles/create", async (articleData, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/articles", articleData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Update article
export const updateArticle = createAsyncThunk<
  Article,
  { id: string; data: FormData },
  { rejectValue: string }
>("articles/update", async ({ id, data }, thunkAPI) => {
  try {
    const response = await axiosInstance.put(`/articles/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Delete article
export const deleteArticle = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("articles/delete", async (id, thunkAPI) => {
  try {
    await axiosInstance.delete(`/articles/${id}`);
    return id;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Sync Analytics
export const syncArticleAnalytics = createAsyncThunk<
  { synced: number; errors: number; total: number },
  void,
  { rejectValue: string }
>("articles/syncAnalytics", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/articles/sync-analytics");
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

const initialState: ArticleState = {
  articles: [],
  article: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  totalPages: 0,
  currentPage: 1,
};

export const articleSlice = createSlice({
  name: "articles",
  initialState,
  reducers: {
    resetArticleStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    resetArticle: (state) => {
      state.article = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Articles
      .addCase(getArticles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getArticles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.articles = action.payload.results;
        state.totalPages = action.payload.pagination.pages;
        state.currentPage = action.payload.pagination.page;
      })
      .addCase(getArticles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Get Article By Slug
      .addCase(getArticleBySlug.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getArticleBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.article = action.payload;
      })
      .addCase(getArticleBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Create Article
      .addCase(createArticle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createArticle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.articles.unshift(action.payload);
      })
      .addCase(createArticle.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Update Article
      .addCase(updateArticle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateArticle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.article = action.payload;
        state.articles = state.articles.map((article) =>
          article.id === action.payload.id ? action.payload : article
        );
      })
      .addCase(updateArticle.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Delete Article
      .addCase(deleteArticle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.articles = state.articles.filter(
          (article) => article.id !== action.payload
        );
      })
      .addCase(deleteArticle.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { resetArticleStatus, resetArticle } = articleSlice.actions;
export default articleSlice.reducer;
