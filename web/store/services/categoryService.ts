import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

export interface BilingualText {
    ar: string;
    en: string;
}

export interface Category {
    _id: string;
    id?: string;
    name: BilingualText;
    description: BilingualText;
    image?: string;
    isActive: boolean;
    order: number;
    productCount?: number;
    courseCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryData {
    name: BilingualText;
    description: BilingualText;
    image?: File;
    isActive?: boolean;
    order?: number;
}

// Get all categories
export const getCategories = createAsyncThunk(
    "categories/getAll",
    async (activeOnly: boolean = false, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/categories${activeOnly ? "?active=true" : ""}`);
            return response.data.categories;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch categories"
            );
        }
    }
);

// Get single category
export const getCategory = createAsyncThunk(
    "categories/getOne",
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/categories/${id}`);
            return response.data.category;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch category"
            );
        }
    }
);

// Create category
export const createCategory = createAsyncThunk(
    "categories/create",
    async (data: CreateCategoryData, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append("name", JSON.stringify(data.name));
            formData.append("description", JSON.stringify(data.description));
            if (data.image) formData.append("image", data.image);
            if (data.isActive !== undefined) formData.append("isActive", String(data.isActive));
            if (data.order !== undefined) formData.append("order", String(data.order));

            const response = await axios.post("/categories", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.category;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to create category"
            );
        }
    }
);

// Update category
export const updateCategory = createAsyncThunk(
    "categories/update",
    async ({ id, data }: { id: string; data: Partial<CreateCategoryData> }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            if (data.name) formData.append("name", JSON.stringify(data.name));
            if (data.description) formData.append("description", JSON.stringify(data.description));
            if (data.image) formData.append("image", data.image);
            if (data.isActive !== undefined) formData.append("isActive", String(data.isActive));
            if (data.order !== undefined) formData.append("order", String(data.order));

            const response = await axios.put(`/categories/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.category;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to update category"
            );
        }
    }
);

// Delete category
export const deleteCategory = createAsyncThunk(
    "categories/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`/categories/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to delete category"
            );
        }
    }
);

// Toggle category status
export const toggleCategoryStatus = createAsyncThunk(
    "categories/toggleStatus",
    async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`/categories/${id}/status`, { isActive });
            return response.data.category;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to update category status"
            );
        }
    }
);
