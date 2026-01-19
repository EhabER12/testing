import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios";

// Types
export interface BilingualText {
  ar: string;
  en: string;
}

export interface Category {
  id: string;
  name: BilingualText;
  slug: string;
  description: BilingualText;
  image?: string;
  isActive: boolean;
  order: number;
  productCount?: number;
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryState {
  categories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
}

// Async Thunks
export const getCategories = createAsyncThunk<
  Category[],
  { active?: boolean } | undefined,
  { rejectValue: string }
>("categories/getAll", async (params, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/categories", { params });
    return response.data.categories || response.data.data || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch categories";
    return thunkAPI.rejectWithValue(message);
  }
});

export const getCategoryById = createAsyncThunk<
  Category,
  string,
  { rejectValue: string }
>("categories/getById", async (id, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data.category || response.data.data || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch category";
    return thunkAPI.rejectWithValue(message);
  }
});

export const createCategory = createAsyncThunk<
  Category,
  FormData,
  { rejectValue: string }
>("categories/create", async (categoryData, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/categories", categoryData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.category || response.data.data || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to create category";
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateCategory = createAsyncThunk<
  Category,
  { id: string; data: FormData },
  { rejectValue: string }
>("categories/update", async ({ id, data }, thunkAPI) => {
  try {
    const response = await axiosInstance.put(`/categories/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.category || response.data.data || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update category";
    return thunkAPI.rejectWithValue(message);
  }
});

export const deleteCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("categories/delete", async (id, thunkAPI) => {
  try {
    await axiosInstance.delete(`/categories/${id}`);
    return id;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete category";
    return thunkAPI.rejectWithValue(message);
  }
});

export const toggleCategoryStatus = createAsyncThunk<
  Category,
  { id: string; isActive: boolean },
  { rejectValue: string }
>("categories/toggleStatus", async ({ id, isActive }, thunkAPI) => {
  try {
    const response = await axiosInstance.patch(`/categories/${id}/status`, {
      isActive,
    });
    return response.data.category || response.data.data || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to toggle category status";
    return thunkAPI.rejectWithValue(message);
  }
});

export const reorderCategories = createAsyncThunk<
  void,
  string[],
  { rejectValue: string }
>("categories/reorder", async (orderedIds, thunkAPI) => {
  try {
    await axiosInstance.post("/categories/reorder", { orderedIds });
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to reorder categories";
    return thunkAPI.rejectWithValue(message);
  }
});

const initialState: CategoryState = {
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
};

export const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    resetCategoryError: (state) => {
      state.error = null;
    },
    resetCurrentCategory: (state) => {
      state.currentCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Categories
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Category By ID
      .addCase(getCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCategory = action.payload;
      })
      .addCase(getCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.unshift(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCategory = action.payload;
        state.categories = state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c
        );
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(
          (c) => c.id !== action.payload
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Toggle Status
      .addCase(toggleCategoryStatus.fulfilled, (state, action) => {
        state.categories = state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c
        );
      });
  },
});

export const { resetCategoryError, resetCurrentCategory } =
  categorySlice.actions;
export default categorySlice.reducer;
