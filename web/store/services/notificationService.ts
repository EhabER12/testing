import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

export interface Notification {
  _id: string;
  id: string;
  recipient: string;
  title: { ar: string; en: string };
  message: { ar: string; en: string };
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = createAsyncThunk(
  "notifications/getAll",
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch notifications");
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/notifications/${id}/read`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark notification as read");
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await axios.put("/notifications/mark-all-read");
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark all as read");
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/notifications/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete notification");
    }
  }
);
