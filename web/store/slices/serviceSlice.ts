import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios";

// Types
export interface BilingualText {
  ar: string;
  en: string;
}

export interface ServiceFeature {
  icon: string;
  title: BilingualText;
  description: BilingualText;
}

export interface ServiceStat {
  value: string;
  label: BilingualText;
  icon: string;
}

export interface PricingTier {
  name: BilingualText;
  price: number | null;
  currency: string;
  description: BilingualText;
  features: string[];
  isPopular: boolean;
}

export interface Service {
  id: string;
  title: BilingualText;
  slug: string;
  shortDescription: BilingualText;
  description: BilingualText;
  icon: string;
  coverImage: string;
  gallery: { url: string; alt: BilingualText }[];
  category: "salla" | "shopify" | "websites" | "seo" | "branding" | "other";
  features: ServiceFeature[];
  stats: ServiceStat[];
  pricingType: "fixed" | "tiers" | "quote";
  pricingTiers: PricingTier[];
  startingPrice: number | null;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  relatedServices: Partial<Service>[];
  seoData?: {
    views30d: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ServiceState {
  services: Service[];
  currentService: Service | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

// Async Thunks
export const getServices = createAsyncThunk<
  { services: Service[]; pagination: any },
  | {
      category?: string;
      featured?: boolean;
      active?: boolean;
      limit?: number;
      page?: number;
    }
  | undefined,
  { rejectValue: string }
>("services/getAll", async (params, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/services", { params });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const getFeaturedServices = createAsyncThunk<
  Service[],
  void,
  { rejectValue: string }
>("services/getFeatured", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/services/featured");
    return response.data.services;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const getServiceBySlug = createAsyncThunk<
  Service,
  string,
  { rejectValue: string }
>("services/getBySlug", async (slug, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/services/slug/${slug}`);
    return response.data.service;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const getServiceById = createAsyncThunk<
  Service,
  string,
  { rejectValue: string }
>("services/getById", async (id, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/services/${id}`);
    return response.data.service;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const createService = createAsyncThunk<
  Service,
  FormData,
  { rejectValue: string }
>("services/create", async (serviceData, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/services", serviceData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.service;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateService = createAsyncThunk<
  Service,
  { id: string; data: FormData },
  { rejectValue: string }
>("services/update", async ({ id, data }, thunkAPI) => {
  try {
    const response = await axiosInstance.put(`/services/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.service;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const deleteService = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("services/delete", async (id, thunkAPI) => {
  try {
    await axiosInstance.delete(`/services/${id}`);
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

export const toggleServiceStatus = createAsyncThunk<
  Service,
  { id: string; isActive?: boolean; isFeatured?: boolean },
  { rejectValue: string }
>("services/toggleStatus", async ({ id, isActive, isFeatured }, thunkAPI) => {
  try {
    const response = await axiosInstance.patch(`/services/${id}/status`, {
      isActive,
      isFeatured,
    });
    return response.data.service;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const syncServiceAnalytics = createAsyncThunk<
  { synced: number; errors: number; total: number },
  void,
  { rejectValue: string }
>("services/syncAnalytics", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/services/sync-analytics");
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to sync analytics";
    return thunkAPI.rejectWithValue(message);
  }
});

export const reorderServices = createAsyncThunk<
  void,
  string[],
  { rejectValue: string }
>("services/reorder", async (orderedIds, thunkAPI) => {
  try {
    await axiosInstance.post("/services/reorder", { orderedIds });
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

const initialState: ServiceState = {
  services: [],
  currentService: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
};

export const serviceSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    resetServiceError: (state) => {
      state.error = null;
    },
    resetCurrentService: (state) => {
      state.currentService = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Services
      .addCase(getServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload.services;
        state.totalPages = action.payload.pagination?.pages || 0;
        state.currentPage = action.payload.pagination?.page || 1;
      })
      .addCase(getServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Featured Services
      .addCase(getFeaturedServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFeaturedServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(getFeaturedServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Service By Slug
      .addCase(getServiceBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getServiceBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentService = action.payload;
      })
      .addCase(getServiceBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Service By ID
      .addCase(getServiceById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getServiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentService = action.payload;
      })
      .addCase(getServiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Service
      .addCase(createService.pending, (state) => {
        state.loading = true;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading = false;
        state.services.unshift(action.payload);
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Service
      .addCase(updateService.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.loading = false;
        state.currentService = action.payload;
        state.services = state.services.map((s) =>
          s.id === action.payload.id ? action.payload : s
        );
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Service
      .addCase(deleteService.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.loading = false;
        state.services = state.services.filter((s) => s.id !== action.payload);
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Toggle Status
      .addCase(toggleServiceStatus.fulfilled, (state, action) => {
        state.services = state.services.map((s) =>
          s.id === action.payload.id ? action.payload : s
        );
      });
  },
});

export const { resetServiceError, resetCurrentService } = serviceSlice.actions;
export default serviceSlice.reducer;
