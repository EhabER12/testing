import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios";

export interface TeacherProfitStats {
  courseSales: {
    totalProfit: number;
    transactionCount: number;
    avgPercentage: number;
  };
  subscriptions: {
    totalProfit: number;
    transactionCount: number;
    avgPercentage: number;
  };
  totalProfit: number;
  totalTransactions: number;
  currency: string;
  recentTransactions: TeacherProfitTransaction[];
}

export interface TeacherProfitTransaction {
  id: string;
  revenueType: "course_sale" | "subscription";
  totalAmount: number;
  profitPercentage: number;
  profitAmount: number;
  currency: string;
  transactionDate: string;
  status: "pending" | "paid" | "cancelled";
  sourceId: any;
}

export interface UpdateProfitPercentagesPayload {
  teacherId: string;
  courseSales?: number;
  subscriptions?: number;
}

// Get teacher's own profit stats
export const getMyProfitStatsThunk = createAsyncThunk<
  TeacherProfitStats,
  { startDate?: string; endDate?: string; revenueType?: string } | undefined,
  { rejectValue: string }
>("teacherProfit/getMyStats", async (params = {}, thunkAPI) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.revenueType) queryParams.append("revenueType", params.revenueType);

    const response = await axiosInstance.get(
      `/teacher-profit/my-stats?${queryParams.toString()}`
    );
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Failed to fetch profit stats";
    return thunkAPI.rejectWithValue(message);
  }
});

// Admin: Get all teachers profit stats
export const getAllTeachersProfitStatsThunk = createAsyncThunk<
  any[],
  { startDate?: string; endDate?: string } | undefined,
  { rejectValue: string }
>("teacherProfit/getAllTeachers", async (params = {}, thunkAPI) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const response = await axiosInstance.get(
      `/teacher-profit/all-teachers?${queryParams.toString()}`
    );
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Failed to fetch teachers profit";
    return thunkAPI.rejectWithValue(message);
  }
});

// Admin: Update teacher profit percentages
export const updateTeacherProfitPercentagesThunk = createAsyncThunk<
  any,
  UpdateProfitPercentagesPayload,
  { rejectValue: string }
>("teacherProfit/updatePercentages", async (data, thunkAPI) => {
  try {
    const { teacherId, ...percentages } = data;
    const response = await axiosInstance.put(
      `/teacher-profit/teacher/${teacherId}/percentages`,
      percentages
    );
    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to update profit percentages";
    return thunkAPI.rejectWithValue(message);
  }
});
