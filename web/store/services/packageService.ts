import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { BilingualText } from "./courseService";

const extractErrorMessage = (error: any): string => {
  const apiMessage = error?.response?.data?.error?.message;
  const flatMessage = error?.response?.data?.message;
  return apiMessage || flatMessage || error?.message || error?.toString();
};

export interface Package {
  id: string;
  _id?: string;
  name: BilingualText;
  description?: BilingualText;
  price: number;
  currency: "EGP" | "SAR" | "USD";
  duration: {
    value: number;
    unit: "day" | "week" | "month" | "year";
  };
  limits: {
    maxStudents?: number;
    maxSessions?: number;
    sessionsPerWeek?: number;
  };
  features: BilingualText[];
  isActive: boolean;
  isPopular: boolean;
  displayOrder: number;
  stats: {
    enrolledCount: number;
    activeCount: number;
    revenue: number;
    totalCount?: number;
  };
  monthlyPrice?: number;
  createdBy: {
    id: string;
    _id?: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageData {
  name: BilingualText;
  description?: BilingualText;
  price: number;
  currency: "EGP" | "SAR" | "USD";
  duration: {
    value: number;
    unit: "day" | "week" | "month" | "year";
  };
  limits?: {
    maxStudents?: number;
    maxSessions?: number;
    sessionsPerWeek?: number;
  };
  features?: BilingualText[];
  isActive?: boolean;
  isPopular?: boolean;
  displayOrder?: number;
}

export interface PackageStats {
  packageId: string;
  packageName: BilingualText;
  price: number;
  stats: {
    active: number;
    dueSoon: number;
    overdue: number;
    paused: number;
    total: number;
    revenue: number;
  };
}

// Get all packages
export const getPackages = createAsyncThunk(
  "packages/getAll",
  async (filters: { isActive?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));

      const response = await axios.get(`/packages?${params.toString()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Get single package
export const getPackage = createAsyncThunk(
  "packages/getOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/packages/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Create package
export const createPackage = createAsyncThunk(
  "packages/create",
  async (data: CreatePackageData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/packages", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Update package
export const updatePackage = createAsyncThunk(
  "packages/update",
  async (
    { id, data }: { id: string; data: Partial<CreatePackageData> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/packages/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Delete package
export const deletePackage = createAsyncThunk(
  "packages/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/packages/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Get package statistics
export const getPackageStats = createAsyncThunk(
  "packages/stats",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/packages/${id}/stats`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Get package students
export const getPackageStudents = createAsyncThunk(
  "packages/students",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/packages/${id}/students`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);
