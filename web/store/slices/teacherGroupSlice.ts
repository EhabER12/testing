import { createSlice } from "@reduxjs/toolkit";
import {
  getTeacherGroups,
  getTeacherGroup,
  createTeacherGroup,
  updateTeacherGroup,
  deleteTeacherGroup,
  addStudentToGroup,
  removeStudentFromGroup,
  updateStudentStatus,
  getTeacherStatistics,
  getAllTeachersWithStats,
  TeacherGroup,
  TeacherStatistics,
  TeacherWithStats,
} from "../services/teacherGroupService";

interface TeacherGroupState {
  teacherGroups: TeacherGroup[];
  currentTeacherGroup: TeacherGroup | null;
  currentTeacherStats: TeacherStatistics | null;
  teachersWithStats: TeacherWithStats[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TeacherGroupState = {
  teacherGroups: [],
  currentTeacherGroup: null,
  currentTeacherStats: null,
  teachersWithStats: [],
  isLoading: false,
  error: null,
};

const teacherGroupSlice = createSlice({
  name: "teacherGroups",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTeacherGroup: (state) => {
      state.currentTeacherGroup = null;
      state.currentTeacherStats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET ALL TEACHER GROUPS
      .addCase(getTeacherGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTeacherGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teacherGroups = action.payload;
      })
      .addCase(getTeacherGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // GET TEACHER GROUP BY ID
      .addCase(getTeacherGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTeacherGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTeacherGroup = action.payload;
      })
      .addCase(getTeacherGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // CREATE TEACHER GROUP
      .addCase(createTeacherGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTeacherGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teacherGroups.unshift(action.payload);
        state.currentTeacherGroup = action.payload;
      })
      .addCase(createTeacherGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // UPDATE TEACHER GROUP
      .addCase(updateTeacherGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTeacherGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.teacherGroups.findIndex(
          (g) => (g.id || g._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.teacherGroups[index] = action.payload;
        }
        if ((state.currentTeacherGroup?.id || state.currentTeacherGroup?._id) === (action.payload.id || action.payload._id)) {
          state.currentTeacherGroup = action.payload;
        }
      })
      .addCase(updateTeacherGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // DELETE TEACHER GROUP
      .addCase(deleteTeacherGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTeacherGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teacherGroups = state.teacherGroups.filter(
          (g) => (g.id || g._id) !== action.payload
        );
        if ((state.currentTeacherGroup?.id || state.currentTeacherGroup?._id) === action.payload) {
          state.currentTeacherGroup = null;
        }
      })
      .addCase(deleteTeacherGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ADD STUDENT TO GROUP
      .addCase(addStudentToGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addStudentToGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.teacherGroups.findIndex(
          (g) => (g.id || g._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.teacherGroups[index] = action.payload;
        }
        if ((state.currentTeacherGroup?.id || state.currentTeacherGroup?._id) === (action.payload.id || action.payload._id)) {
          state.currentTeacherGroup = action.payload;
        }
      })
      .addCase(addStudentToGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // REMOVE STUDENT FROM GROUP
      .addCase(removeStudentFromGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeStudentFromGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.teacherGroups.findIndex(
          (g) => (g.id || g._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.teacherGroups[index] = action.payload;
        }
        if ((state.currentTeacherGroup?.id || state.currentTeacherGroup?._id) === (action.payload.id || action.payload._id)) {
          state.currentTeacherGroup = action.payload;
        }
      })
      .addCase(removeStudentFromGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // UPDATE STUDENT STATUS
      .addCase(updateStudentStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStudentStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.teacherGroups.findIndex(
          (g) => (g.id || g._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.teacherGroups[index] = action.payload;
        }
        if ((state.currentTeacherGroup?.id || state.currentTeacherGroup?._id) === (action.payload.id || action.payload._id)) {
          state.currentTeacherGroup = action.payload;
        }
      })
      .addCase(updateStudentStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // GET TEACHER STATISTICS
      .addCase(getTeacherStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTeacherStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTeacherStats = action.payload;
      })
      .addCase(getTeacherStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // GET ALL TEACHERS WITH STATS
      .addCase(getAllTeachersWithStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllTeachersWithStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teachersWithStats = action.payload;
      })
      .addCase(getAllTeachersWithStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentTeacherGroup } = teacherGroupSlice.actions;
export default teacherGroupSlice.reducer;
