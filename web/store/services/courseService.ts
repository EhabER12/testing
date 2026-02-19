import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

export interface BilingualText {
  ar: string;
  en: string;
}

export interface Course {
  id: string;
  _id?: string;
  title: BilingualText;
  slug: string;
  description: BilingualText;
  shortDescription?: BilingualText;
  thumbnail?: string;
  instructorId: {
    id: string;
    _id?: string;
    fullName: BilingualText;
    email: string;
  };
  categoryId?: string | { id: string; _id?: string; name: BilingualText };
  accessType: "free" | "paid" | "byPackage";
  price?: number;
  currency?: "SAR" | "EGP" | "USD";
  duration?: number;
  level?: "beginner" | "intermediate" | "advanced";
  language?: string;
  isPublished: boolean;
  publishRequestedAt?: string;
  publishedAt?: string;
  approvalStatus?: {
    status: "none" | "pending" | "approved" | "rejected";
    reason?: string;
    updatedAt?: string;
  };
  certificateSettings?: {
    enabled: boolean;
    requiresExam: boolean;
    passingScore?: number;
    examQuizId?: string;
    templateId?: string;
  };
  stats: {
    enrolledCount: number;
    completedCount: number;
    completionRate: number;
    averageRating: number;
    totalReviews: number;
  };
  contentStats: {
    sectionsCount: number;
    lessonsCount: number;
    quizzesCount: number;
    totalDuration: number;
  };
  sections?: any[];
  userProgress?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseData {
  title: BilingualText;
  description: BilingualText;
  thumbnail?: string;
  categoryId?: string;
  accessType: "free" | "paid" | "byPackage";
  price?: number;
  currency?: "SAR" | "EGP" | "USD";
  duration?: number;
  level?: "beginner" | "intermediate" | "advanced";
  language?: string;
  certificateSettings?: {
    enabled: boolean;
    requiresExam: boolean;
    passingScore?: number;
    examQuizId?: string;
    templateId?: string;
  };
}

// Get all courses
export const getCourses = createAsyncThunk(
  "courses/getAll",
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get("/courses", { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch courses"
      );
    }
  }
);

// Get single course
export const getCourse = createAsyncThunk(
  "courses/getOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/courses/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch course"
      );
    }
  }
);

// Get course by slug
export const getCourseBySlug = createAsyncThunk(
  "courses/getBySlug",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/courses/slug/${slug}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch course"
      );
    }
  }
);

// Create course
export const createCourse = createAsyncThunk(
  "courses/create",
  async (data: CreateCourseData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/courses", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create course"
      );
    }
  }
);

// Update course
export const updateCourse = createAsyncThunk(
  "courses/update",
  async ({ id, data }: { id: string; data: Partial<CreateCourseData> }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/courses/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update course"
      );
    }
  }
);

// Delete course
export const deleteCourse = createAsyncThunk(
  "courses/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/courses/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete course"
      );
    }
  }
);

// Publish course (Admin approve)
export const publishCourse = createAsyncThunk(
  "courses/publish",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/courses/${id}/publish`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to publish course"
      );
    }
  }
);

// Reject course publish (Admin reject)
export const rejectCoursePublish = createAsyncThunk(
  "courses/rejectPublish",
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/courses/${id}/reject`, { reason });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject course"
      );
    }
  }
);

// Unpublish course (set isPublished to false)
export const unpublishCourse = createAsyncThunk(
  "courses/unpublish",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/courses/${id}`, { isPublished: false });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to unpublish course"
      );
    }
  }
);

// Request publish (for teachers)
export const requestPublishCourse = createAsyncThunk(
  "courses/requestPublish",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/courses/${id}/publish-request`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit publish request"
      );
    }
  }
);

// Enroll in course
export const enrollCourse = createAsyncThunk(
  "courses/enroll",
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/courses/${courseId}/enroll`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to enroll in course"
      );
    }
  }
);

// Get enrolled courses
export const getEnrolledCourses = createAsyncThunk(
  "courses/enrolled",
  async (
    params: { page?: number; limit?: number } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get("/courses/my/enrolled", { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enrolled courses"
      );
    }
  }
);

// Get my teaching courses (for teachers)
export const getMyTeachingCourses = createAsyncThunk(
  "courses/teaching",
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get("/courses/my/teaching", { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch teaching courses"
      );
    }
  }
);
