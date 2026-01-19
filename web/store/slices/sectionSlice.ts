import { createSlice } from "@reduxjs/toolkit";
import {
  getCourseSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  Section,
} from "../services/sectionService";

interface SectionState {
  sections: Section[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SectionState = {
  sections: [],
  isLoading: false,
  error: null,
};

const sectionSlice = createSlice({
  name: "sections",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSections: (state) => {
      state.sections = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get course sections
      .addCase(getCourseSections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCourseSections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sections = action.payload;
      })
      .addCase(getCourseSections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create section
      .addCase(createSection.fulfilled, (state, action) => {
        state.sections.push(action.payload);
      })
      // Update section
      .addCase(updateSection.fulfilled, (state, action) => {
        const index = state.sections.findIndex((s) => (s.id || s._id) === (action.payload.id || action.payload._id));
        if (index !== -1) {
          state.sections[index] = action.payload;
        }
      })
      // Delete section
      .addCase(deleteSection.fulfilled, (state, action) => {
        state.sections = state.sections.filter((s) => (s.id || s._id) !== action.payload);
      })
      // Reorder sections
      .addCase(reorderSections.fulfilled, (state, action) => {
        state.sections = action.payload;
      })
      // Create lesson
      .addCase(createLesson.fulfilled, (state, action) => {
        const section = state.sections.find(
          (s) => (s.id || s._id) === action.payload.sectionId
        );
        if (section) {
          if (!section.lessons) section.lessons = [];
          section.lessons.push(action.payload);
        }
      })
      // Update lesson
      .addCase(updateLesson.fulfilled, (state, action) => {
        const section = state.sections.find(
          (s) => (s.id || s._id) === action.payload.sectionId
        );
        if (section?.lessons) {
          const lessonIndex = section.lessons.findIndex(
            (l) => (l.id || l._id) === (action.payload.id || action.payload._id)
          );
          if (lessonIndex !== -1) {
            section.lessons[lessonIndex] = action.payload;
          }
        }
      })
      // Delete lesson
      .addCase(deleteLesson.fulfilled, (state, action) => {
        state.sections.forEach((section) => {
          if (section.lessons) {
            section.lessons = section.lessons.filter((l) => (l.id || l._id) !== action.payload);
          }
        });
      })
      // Reorder lessons
      .addCase(reorderLessons.fulfilled, (state, action) => {
        const section = state.sections.find(
          (s) => (s.id || s._id) === action.payload.sectionId
        );
        if (section) {
          section.lessons = action.payload.lessons;
        }
      });
  },
});

export const { clearError, clearSections } = sectionSlice.actions;
export default sectionSlice.reducer;
