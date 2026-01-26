import { createSlice } from "@reduxjs/toolkit";
import {
  getQuizzes,
  getQuiz,
  getQuizBySlug,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  getQuizzesByCourse,
  getMyQuizzes,
  submitQuizAttempt,
  getUserBestAttempt,
  getQuizStatistics,
  getAllQuizAttempts,
  Quiz,
  QuizAttempt,
} from "../services/quizService";

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  bestAttempt: QuizAttempt | null;
  lastAttempt: QuizAttempt | null;
  statistics: any | null;
  attempts: any[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  bestAttempt: null,
  lastAttempt: null,
  statistics: null,
  attempts: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const quizSlice = createSlice({
  name: "quizzes",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentQuiz: (state) => {
      state.currentQuiz = null;
      state.bestAttempt = null;
      state.lastAttempt = null;
    },
    resetAttempt: (state) => {
      state.lastAttempt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all quizzes
      .addCase(getQuizzes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getQuizzes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes = action.payload;
      })
      .addCase(getQuizzes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get quizzes by course
      .addCase(getQuizzesByCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getQuizzesByCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes = action.payload;
      })
      .addCase(getQuizzesByCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get my quizzes
      .addCase(getMyQuizzes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyQuizzes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes = action.payload;
      })
      .addCase(getMyQuizzes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get single quiz
      .addCase(getQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuiz = action.payload;
      })
      .addCase(getQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get quiz by slug
      .addCase(getQuizBySlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getQuizBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuiz = action.payload;
      })
      .addCase(getQuizBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Submit attempt
      .addCase(submitQuizAttempt.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitQuizAttempt.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.lastAttempt = action.payload;
      })
      .addCase(submitQuizAttempt.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // Get best attempt
      .addCase(getUserBestAttempt.fulfilled, (state, action) => {
        state.bestAttempt = action.payload;
      })
      // Create quiz
      .addCase(createQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes.unshift(action.payload);
      })
      .addCase(createQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update quiz
      .addCase(updateQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.quizzes.findIndex(
          (q) => (q.id || q._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.quizzes[index] = action.payload;
        }
        state.currentQuiz = action.payload;
      })
      // Get Statistics
      .addCase(getQuizStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })
      // Get All Attempts
      .addCase(getAllQuizAttempts.fulfilled, (state, action) => {
        state.attempts = action.payload.data;
      })
      .addCase(updateQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete quiz
      .addCase(deleteQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizzes = state.quizzes.filter(
          (q) => (q.id || q._id) !== action.payload
        );
      })
      .addCase(deleteQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Publish quiz
      .addCase(publishQuiz.fulfilled, (state, action) => {
        const index = state.quizzes.findIndex(
          (q) => (q.id || q._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.quizzes[index] = action.payload;
        }
        state.currentQuiz = action.payload;
      });
  },
});

export const { clearError, clearCurrentQuiz, resetAttempt } = quizSlice.actions;
export default quizSlice.reducer;
