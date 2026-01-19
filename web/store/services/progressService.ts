import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";

export interface Progress {
  id: string;
  _id?: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  completedLessonsCount: number;
  completedQuizzes: string[];
  completedQuizzesCount: number;
  totalLessonsCount: number;
  totalQuizzesCount: number;
  totalItemsCount: number;
  percentage: number;
  isCompleted: boolean;
  enrolledAt: string;
  lastAccessedAt: string;
  lastAccessedLessonId?: string;
  completedAt?: string;
  examPassed?: boolean;
  examScore?: number;
  certificateIssued?: boolean;
  certificateId?: string;
  // Aliases for frontend compatibility
  progressPercentage?: number;
  totalLessons?: number;
  currentLessonId?: string;
}

// Get user progress for a course
export const getUserProgress = createAsyncThunk(
  "progress/getUserProgress",
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/progress/course/${courseId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch progress"
      );
    }
  }
);

// Mark lesson as completed
export const markLessonCompleted = createAsyncThunk(
  "progress/markLessonCompleted",
  async (
    { courseId, lessonId }: { courseId: string; lessonId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `/progress/course/${courseId}/lesson/${lessonId}/complete`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark lesson as completed"
      );
    }
  }
);

// Update current lesson (track where user is)
export const updateCurrentLesson = createAsyncThunk(
  "progress/updateCurrentLesson",
  async (
    { courseId, lessonId }: { courseId: string; lessonId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `/progress/course/${courseId}/current-lesson/${lessonId}`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update current lesson"
      );
    }
  }
);

// Get user enrollments
export const getUserEnrollments = createAsyncThunk(
  "progress/getUserEnrollments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/progress/my-courses");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enrollments"
      );
    }
  }
);
