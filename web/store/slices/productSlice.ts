import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios";

// Types
export interface BilingualText {
  ar: string;
  en: string;
}

export interface ProductVariant {
  id: string;
  name: BilingualText;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stock?: number;
  isDefault?: boolean;
}

export interface ProductAddon {
  id: string;
  name: BilingualText;
  description?: BilingualText;
  price: number;
  image?: string;
}

export interface ProductCustomField {
  label: BilingualText;
  type: "text" | "textarea" | "url" | "file" | "number" | "email" | "date";
  required: boolean;
  placeholder?: BilingualText;
}

export interface Product {
  id: string;
  name: BilingualText;
  slug: string;
  description: BilingualText;
  shortDescription: BilingualText;
  categoryId: string;
  category?: {
    id: string;
    name: BilingualText;
    slug: string;
  };
  coverImage: string;
  gallery: string[];
  basePrice: number;
  compareAtPrice?: number;
  currency: string;
  variants: ProductVariant[];
  addons: ProductAddon[];
  isActive: boolean;
  isFeatured: boolean;
  stock?: number;
  sku?: string;
  order: number;
  customFields?: ProductCustomField[];
  seoData?: {
    views30d: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalProducts: number;
}

// Async Thunks
export const getProducts = createAsyncThunk<
  { products: Product[]; pagination: any },
  | {
      categoryId?: string;
      featured?: boolean;
      active?: boolean;
      limit?: number;
      page?: number;
      search?: string;
    }
  | undefined,
  { rejectValue: string }
>("products/getAll", async (params, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/products", { params });
    return {
      products: response.data.products || response.data.data || [],
      pagination: response.data.pagination || {},
    };
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch products";
    return thunkAPI.rejectWithValue(message);
  }
});

export const getFeaturedProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: string }
>("products/getFeatured", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/products/featured");
    return response.data.products || response.data.data || [];
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch featured products";
    return thunkAPI.rejectWithValue(message);
  }
});

export const getProductBySlug = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>("products/getBySlug", async (slug, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/products/slug/${slug}`);
    return response.data.product || response.data.data || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch product";
    return thunkAPI.rejectWithValue(message);
  }
});

export const getProductById = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>("products/getById", async (id, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data.product || response.data.data || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch product";
    return thunkAPI.rejectWithValue(message);
  }
});

export const createProduct = createAsyncThunk<
  Product,
  FormData,
  { rejectValue: string }
>("products/create", async (productData, thunkAPI) => {
  try {
    // Don't manually set multipart Content-Type; the browser/axios must include the boundary.
    const response = await axiosInstance.post("/products", productData);
    return response.data.product || response.data.data || response.data;
  } catch (error: any) {
    const apiError = error.response?.data?.error;
    const details = Array.isArray(apiError?.details)
      ? apiError.details
          .map((d: any) => `${d?.path ? `${d.path}: ` : ""}${d?.message || ""}`)
          .filter(Boolean)
          .join(", ")
      : "";
    const message =
      (apiError?.message
        ? details
          ? `${apiError.message} (${details})`
          : apiError.message
        : null) ||
      error.response?.data?.message ||
      error.message ||
      "Failed to create product";
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  { id: string; data: FormData },
  { rejectValue: string }
>("products/update", async ({ id, data }, thunkAPI) => {
  try {
    // Don't manually set multipart Content-Type; the browser/axios must include the boundary.
    const response = await axiosInstance.put(`/products/${id}`, data);
    return response.data.product || response.data.data || response.data;
  } catch (error: any) {
    const apiError = error.response?.data?.error;
    const details = Array.isArray(apiError?.details)
      ? apiError.details
          .map((d: any) => `${d?.path ? `${d.path}: ` : ""}${d?.message || ""}`)
          .filter(Boolean)
          .join(", ")
      : "";
    const message =
      (apiError?.message
        ? details
          ? `${apiError.message} (${details})`
          : apiError.message
        : null) ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update product";
    return thunkAPI.rejectWithValue(message);
  }
});

export const deleteProduct = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("products/delete", async (id, thunkAPI) => {
  try {
    await axiosInstance.delete(`/products/${id}`);
    return id;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete product";
    return thunkAPI.rejectWithValue(message);
  }
});

export const toggleProductStatus = createAsyncThunk<
  Product,
  { id: string; isActive?: boolean; isFeatured?: boolean },
  { rejectValue: string }
>("products/toggleStatus", async ({ id, isActive, isFeatured }, thunkAPI) => {
  try {
    const response = await axiosInstance.patch(`/products/${id}/status`, {
      isActive,
      isFeatured,
    });
    return response.data.product || response.data.data || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update product status";
    return thunkAPI.rejectWithValue(message);
  }
});

export const syncProductAnalytics = createAsyncThunk<
  { synced: number; errors: number; total: number },
  void,
  { rejectValue: string }
>("products/syncAnalytics", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/products/sync-analytics");
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

const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  currentProduct: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalProducts: 0,
};

export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    resetProductError: (state) => {
      state.error = null;
    },
    resetCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Products
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPages = action.payload.pagination?.pages || 0;
        state.currentPage = action.payload.pagination?.page || 1;
        state.totalProducts = action.payload.pagination?.total || 0;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Featured Products
      .addCase(getFeaturedProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFeaturedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredProducts = action.payload;
      })
      .addCase(getFeaturedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Product By Slug
      .addCase(getProductBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(getProductBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Product By ID
      .addCase(getProductById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(getProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload);
        state.totalProducts += 1;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
        state.products = state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
        state.totalProducts -= 1;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Toggle Status
      .addCase(toggleProductStatus.fulfilled, (state, action) => {
        state.products = state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
      });
  },
});

export const { resetProductError, resetCurrentProduct } = productSlice.actions;
export default productSlice.reducer;
