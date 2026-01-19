import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { BilingualText } from "./courseService";
import { Quiz } from "./quizService";

export interface Lesson {
  id: string;
  _id?: string;
  sectionId: string;
  title: BilingualText;
  description?: BilingualText;
  videoSource: "youtube" | "vimeo" | "direct" | "none";
  videoUrl?: string;
  videoId?: string;
  duration?: number;
  order: number;
  materials?: {
    id?: string;
    _id?: string;
    title: BilingualText;
    url: string;
    type: "pdf" | "file" | "link";
    size?: number;
  }[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  _id?: string;
  courseId: string;
  title: BilingualText;
  description?: BilingualText;
  order: number;
  lessons?: Lesson[];
  quizzes?: Quiz[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionData {
  courseId: string;
  title: BilingualText;
  description?: BilingualText;
  order?: number;
}

export interface CreateLessonData {
  sectionId: string;
  courseId: string;
  title: BilingualText;
  description?: BilingualText;
  videoSource: "youtube" | "vimeo" | "direct" | "none";
  videoUrl?: string;
  videoId?: string;
  duration?: number;
  order?: number;
  materials?: {
    title: BilingualText;
    url: string;
    type: "pdf" | "file" | "link";
    size?: number;
  }[];
}

// Get course sections with lessons
export const getCourseSections = createAsyncThunk(
  "sections/getByCourse",
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/lms/sections/course/${courseId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sections"
      );
    }
  }
);

// Create section
export const createSection = createAsyncThunk(
  "sections/create",
  async (data: CreateSectionData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/lms/sections`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create section"
      );
    }
  }
);

// Update section
export const updateSection = createAsyncThunk(
  "sections/update",
  async (
    { id, data }: { id: string; data: Partial<CreateSectionData> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/lms/sections/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update section"
      );
    }
  }
);

// Delete section
export const deleteSection = createAsyncThunk(
  "sections/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/lms/sections/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete section"
      );
    }
  }
);

// Reorder sections
export const reorderSections = createAsyncThunk(
  "sections/reorder",
  async (
    { courseId, sections }: { courseId: string; sections: { id: string; order: number }[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`/lms/sections/course/${courseId}/reorder`, {
        sections,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reorder sections"
      );
    }
  }
);

// Create lesson
export const createLesson = createAsyncThunk(
  "lessons/create",
  async (data: CreateLessonData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/lms/lessons`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create lesson"
      );
    }
  }
);

// Update lesson
export const updateLesson = createAsyncThunk(
  "lessons/update",
  async (
    { id, data }: { id: string; data: Partial<CreateLessonData> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/lms/lessons/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update lesson"
      );
    }
  }
);

// Delete lesson
export const deleteLesson = createAsyncThunk(
  "lessons/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/lms/lessons/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete lesson"
      );
    }
  }
);

// Reorder lessons
export const reorderLessons = createAsyncThunk(
  "lessons/reorder",
  async (
    { sectionId, lessons }: { sectionId: string; lessons: { id: string; order: number }[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`/lms/lessons/section/${sectionId}/reorder`, {
        lessons,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reorder lessons"
      );
    }
  }
);
