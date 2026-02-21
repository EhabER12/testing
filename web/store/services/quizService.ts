import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { BilingualText } from "./courseService";

export interface QuizQuestion {
  _id?: string;
  questionText: BilingualText;
  type: "mcq" | "true_false";
  choices: BilingualText[];
  correctAnswer: number; // index
  points: number;
  explanation?: BilingualText;
}

export interface Quiz {
  id: string;
  _id?: string;
  courseId: any; // Can be object or ID
  sectionId?: any;
  certificateTemplateId?: any;
  hasCertificateTemplate?: boolean;
  title: BilingualText;
  description?: BilingualText;
  linkedTo: "course" | "section" | "general";
  slug?: string;
  isPublic?: boolean;
  requiresRegistration?: boolean;
  questions: QuizQuestion[];
  passingScore: number;
  attemptsAllowed: number | null;
  timeLimit: number | null;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  isRequiredForCertificate: boolean;
  isPublished: boolean;
  stats: {
    totalAttempts: number;
    passedAttempts: number;
    averageScore: number;
  };
  totalPoints: number;
  questionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizData {
  courseId?: string;
  sectionId?: string;
  certificateTemplateId?: string;
  linkedTo: "course" | "section" | "general";
  title: BilingualText;
  description?: BilingualText;
  questions: QuizQuestion[];
  passingScore: number;
  attemptsAllowed?: number | null;
  timeLimit?: number | null;
  shuffleQuestions?: boolean;
  showCorrectAnswers?: boolean;
  isRequiredForCertificate?: boolean;
  requiresRegistration?: boolean;
  isPublished?: boolean;
}

export interface QuizAttempt {
  id: string;
  _id?: string;
  userId: string;
  quizId: string;
  courseId: string;
  answers: {
    questionId: string;
    chosenAnswer: number;
    isCorrect: boolean;
    correctAnswer?: number;
    pointsEarned: number;
  }[];
  score: number;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  completedAt: string;
}

// Get quiz by slug
export const getQuizBySlug = createAsyncThunk(
  "quizzes/getBySlug",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/quizzes/public/${slug}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch quiz"
      );
    }
  }
);

// Get all quizzes
export const getQuizzes = createAsyncThunk(
  "quizzes/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/quizzes");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch quizzes"
      );
    }
  }
);

// Get single quiz
export const getQuiz = createAsyncThunk(
  "quizzes/getOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/quizzes/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch quiz"
      );
    }
  }
);

// Create quiz
export const createQuiz = createAsyncThunk(
  "quizzes/create",
  async (data: CreateQuizData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/quizzes", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create quiz"
      );
    }
  }
);

// Update quiz
export const updateQuiz = createAsyncThunk(
  "quizzes/update",
  async (
    { id, data }: { id: string; data: Partial<CreateQuizData> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/quizzes/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update quiz"
      );
    }
  }
);

// Delete quiz
export const deleteQuiz = createAsyncThunk(
  "quizzes/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/quizzes/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete quiz"
      );
    }
  }
);

// Publish quiz
export const publishQuiz = createAsyncThunk(
  "quizzes/publish",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/quizzes/${id}`, { isPublished: true });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to publish quiz"
      );
    }
  }
);

// Submit quiz attempt
export const submitQuizAttempt = createAsyncThunk(
  "quizzes/submitAttempt",
  async (
    { quizId, answers }: { quizId: string; answers: { questionId: string; chosenAnswer: number }[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`/quizzes/${quizId}/attempt`, { answers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit quiz attempt"
      );
    }
  }
);

// Get user's best attempt
export const getUserBestAttempt = createAsyncThunk(
  "quizzes/getBestAttempt",
  async (quizId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/quizzes/${quizId}/attempts/me/best`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch best attempt"
      );
    }
  }
);

// Get quizzes by course
export const getQuizzesByCourse = createAsyncThunk(
  "quizzes/getByCourse",
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/quizzes/course/${courseId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch course quizzes"
      );
    }
  }
);

// Get my quizzes
export const getMyQuizzes = createAsyncThunk(
  "quizzes/getMyAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/quizzes/my/all");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch your quizzes"
      );
    }
  }
);

// Get quiz statistics
export const getQuizStatistics = createAsyncThunk(
  "quizzes/getStatistics",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/quizzes/${id}/statistics`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch statistics"
      );
    }
  }
);

// Get all quiz attempts
export const getAllQuizAttempts = createAsyncThunk(
  "quizzes/getAllAttempts",
  async ({ quizId, page = 1 }: { quizId: string; page?: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/quizzes/${quizId}/attempts/all?page=${page}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch attempts"
      );
    }
  }
);
