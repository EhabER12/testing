import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios";

// Types
export interface BilingualText {
  ar: string;
  en: string;
}

export interface SeoMeta {
  title: BilingualText;
  description: BilingualText;
}

export interface StaticPage {
  id: string;
  _id?: string;
  slug: string;
  title: BilingualText;
  content: BilingualText;
  isPublished: boolean;
  showInFooter: boolean;
  showInHeader: boolean;
  order: number;
  seoMeta: SeoMeta;
  createdAt: string;
  updatedAt: string;
}

interface StaticPageState {
  pages: StaticPage[];
  currentPage: StaticPage | null;
  loading: boolean;
  error: string | null;
}

const initialState: StaticPageState = {
  pages: [],
  currentPage: null,
  loading: false,
  error: null,
};

// Thunks
export const getStaticPages = createAsyncThunk<
  StaticPage[],
  { showInFooter?: boolean; showInHeader?: boolean } | undefined,
  { rejectValue: string }
>("staticPages/getAll", async (params, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/static-pages", { params });
    return response.data.pages;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const getStaticPageBySlug = createAsyncThunk<
  StaticPage,
  string,
  { rejectValue: string }
>("staticPages/getBySlug", async (slug, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/static-pages/${slug}`);
    return response.data.page;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateStaticPage = createAsyncThunk<
  StaticPage,
  { slug: string; data: Partial<StaticPage> },
  { rejectValue: string }
>("staticPages/update", async ({ slug, data }, thunkAPI) => {
  try {
    const response = await axiosInstance.put(`/static-pages/${slug}`, data);
    return response.data.page;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const seedStaticPages = createAsyncThunk<
  StaticPage[],
  void,
  { rejectValue: string }
>("staticPages/seed", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/static-pages/seed");
    return response.data.pages;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Slice
export const staticPageSlice = createSlice({
  name: "staticPages",
  initialState,
  reducers: {
    resetStaticPageError: (state) => {
      state.error = null;
    },
    resetCurrentStaticPage: (state) => {
      state.currentPage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all pages
      .addCase(getStaticPages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStaticPages.fulfilled, (state, action) => {
        state.loading = false;
        state.pages = action.payload;
      })
      .addCase(getStaticPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get page by slug
      .addCase(getStaticPageBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStaticPageBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPage = action.payload;
      })
      .addCase(getStaticPageBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update page
      .addCase(updateStaticPage.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateStaticPage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPage = action.payload;
        // Update in pages array
        state.pages = state.pages.map((p) =>
          p.slug === action.payload.slug ? action.payload : p
        );
      })
      .addCase(updateStaticPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Seed pages
      .addCase(seedStaticPages.pending, (state) => {
        state.loading = true;
      })
      .addCase(seedStaticPages.fulfilled, (state, action) => {
        state.loading = false;
        state.pages = action.payload;
      })
      .addCase(seedStaticPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetStaticPageError, resetCurrentStaticPage } =
  staticPageSlice.actions;
export default staticPageSlice.reducer;
