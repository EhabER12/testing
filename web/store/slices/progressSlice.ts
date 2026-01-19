import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getUserProgress,
  markLessonCompleted,
  updateCurrentLesson,
  getUserEnrollments,
  Progress,
} from "../services/progressService";

interface ProgressState {
  currentProgress: Progress | null;
  enrollments: any[];
  isLoading: boolean;
  error: string | null;
  markingComplete: boolean;
}

const initialState: ProgressState = {
  currentProgress: null,
  enrollments: [],
  isLoading: false,
  error: null,
  markingComplete: false,
};

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    clearProgress: (state) => {
      state.currentProgress = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get user progress
      .addCase(getUserProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserProgress.fulfilled, (state, action: PayloadAction<Progress>) => {
        state.isLoading = false;
        state.currentProgress = action.payload;
      })
      .addCase(getUserProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Mark lesson completed
      .addCase(markLessonCompleted.pending, (state) => {
        state.markingComplete = true;
        state.error = null;
      })
      .addCase(markLessonCompleted.fulfilled, (state, action: PayloadAction<Progress>) => {
        state.markingComplete = false;
        state.currentProgress = action.payload;
      })
      .addCase(markLessonCompleted.rejected, (state, action) => {
        state.markingComplete = false;
        state.error = action.payload as string;
      })
      // Update current lesson
      .addCase(updateCurrentLesson.fulfilled, (state, action: PayloadAction<Progress>) => {
        state.currentProgress = action.payload;
      })
      // Get user enrollments
      .addCase(getUserEnrollments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserEnrollments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enrollments = action.payload;
      })
      .addCase(getUserEnrollments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProgress } = progressSlice.actions;
export default progressSlice.reducer;
