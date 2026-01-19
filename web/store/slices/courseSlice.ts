import { createSlice } from "@reduxjs/toolkit";
import {
  getCourses,
  getCourse,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  enrollCourse,
  getEnrolledCourses,
  Course,
} from "../services/courseService";

interface CourseState {
  courses: Course[];
  enrolledCourses: any[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  enrolledCourses: [],
  currentCourse: null,
  isLoading: false,
  error: null,
};

const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all courses
      .addCase(getCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(getCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get single course
      .addCase(getCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourse = action.payload;
      })
      .addCase(getCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get course by slug
      .addCase(getCourseBySlug.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCourseBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourse = action.payload;
        // If course has sections, update the sections slice would handle it
        // But we need to make sure sections are in the course object
      })
      .addCase(getCourseBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create course
      .addCase(createCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses.push(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.courses.findIndex((c) => (c.id || c._id) === (action.payload.id || action.payload._id));
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        state.currentCourse = action.payload;
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete course
      .addCase(deleteCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = state.courses.filter((c) => (c.id || c._id) !== action.payload);
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Publish course
      .addCase(publishCourse.fulfilled, (state, action) => {
        const index = state.courses.findIndex((c) => (c.id || c._id) === (action.payload.id || action.payload._id));
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        state.currentCourse = action.payload;
      })
      // Unpublish course
      .addCase(unpublishCourse.fulfilled, (state, action) => {
        const index = state.courses.findIndex((c) => (c.id || c._id) === (action.payload.id || action.payload._id));
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        state.currentCourse = action.payload;
      })
      // Enroll in course
      .addCase(enrollCourse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(enrollCourse.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(enrollCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get enrolled courses
      .addCase(getEnrolledCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEnrolledCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enrolledCourses = action.payload;
      })
      .addCase(getEnrolledCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentCourse } = courseSlice.actions;
export default courseSlice.reducer;
