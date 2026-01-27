import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { BilingualText } from "./courseService";

export interface StudentMember {
  id: string;
  _id?: string;
  userId?: {
    id: string;
    _id?: string;
    fullName: BilingualText;
    email: string;
  };
  name: BilingualText;
  phone: string;
  governorate?: string;
  startDate: string;
  billingDay: number;
  nextDueDate: string;
  status: "active" | "due_soon" | "overdue" | "paused" | "cancelled";
  packageId?: {
    id: string;
    _id?: string;
    name: BilingualText;
  };
  packagePrice?: number;
  renewalHistory: any[];
  lastReminderSent?: string;
  reminderCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy or optional
  studentName?: BilingualText;
  whatsappNumber?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

export interface CreateStudentMemberData {
  userId: string;
  studentName: BilingualText;
  whatsappNumber: string;
  subscriptionEndDate: string;
  notes?: string;
  packageId?: string;
  packagePrice?: number;
}

// Get all student members
export const getStudentMembers = createAsyncThunk(
  "studentMembers/getAll",
  async (_, { rejectWithValue }) => {
    try {
      // Request all records without pagination for dropdown lists
      const response = await axios.get("/student-members?limit=9999");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch student members"
      );
    }
  }
);

// Get single student member
export const getStudentMember = createAsyncThunk(
  "studentMembers/getOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/student-members/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch student member"
      );
    }
  }
);

// Get current user's subscriptions
export const getMySubscriptions = createAsyncThunk(
  "studentMembers/getMy",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/student-members/my");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch your subscriptions"
      );
    }
  }
);

// Create student member
export const createStudentMember = createAsyncThunk(
  "studentMembers/create",
  async (data: CreateStudentMemberData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/student-members", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create student member"
      );
    }
  }
);

// Update student member
export const updateStudentMember = createAsyncThunk(
  "studentMembers/update",
  async (
    { id, data }: { id: string; data: Partial<CreateStudentMemberData> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/student-members/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update student member"
      );
    }
  }
);

// Delete student member
export const deleteStudentMember = createAsyncThunk(
  "studentMembers/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/student-members/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete student member"
      );
    }
  }
);

// Renew subscription
export const renewSubscription = createAsyncThunk(
  "studentMembers/renew",
  async (
    { id, endDate }: { id: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`/student-members/${id}/renew`, {
        subscriptionEndDate: endDate,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to renew subscription"
      );
    }
  }
);
// Import student members from CSV
export const importStudentMembers = createAsyncThunk(
  "studentMembers/import",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/student-members/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to import student members"
      );
    }
  }
);
