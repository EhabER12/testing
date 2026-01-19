import { createSlice } from "@reduxjs/toolkit";
import {
  getStudentMembers,
  getStudentMember,
  getMySubscriptions,
  createStudentMember,
  updateStudentMember,
  deleteStudentMember,
  renewSubscription,
  StudentMember,
} from "../services/studentMemberService";

interface StudentMemberState {
  studentMembers: StudentMember[];
  mySubscriptions: StudentMember[];
  currentStudentMember: StudentMember | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StudentMemberState = {
  studentMembers: [],
  mySubscriptions: [],
  currentStudentMember: null,
  isLoading: false,
  error: null,
};

const studentMemberSlice = createSlice({
  name: "studentMembers",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentStudentMember: (state) => {
      state.currentStudentMember = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all student members
      .addCase(getStudentMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStudentMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentMembers = action.payload;
      })
      .addCase(getStudentMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get single student member
      .addCase(getStudentMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStudentMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentStudentMember = action.payload;
      })
      .addCase(getStudentMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get my subscriptions
      .addCase(getMySubscriptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMySubscriptions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mySubscriptions = action.payload;
      })
      .addCase(getMySubscriptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create student member
      .addCase(createStudentMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createStudentMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentMembers.push(action.payload);
      })
      .addCase(createStudentMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update student member
      .addCase(updateStudentMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStudentMember.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.studentMembers.findIndex(
          (s) => (s.id || s._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.studentMembers[index] = action.payload;
        }
        state.currentStudentMember = action.payload;
      })
      .addCase(updateStudentMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete student member
      .addCase(deleteStudentMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStudentMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentMembers = state.studentMembers.filter(
          (s) => (s.id || s._id) !== action.payload
        );
      })
      .addCase(deleteStudentMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Renew subscription
      .addCase(renewSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.studentMembers.findIndex(
          (s) => (s.id || s._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.studentMembers[index] = action.payload;
        }
        state.currentStudentMember = action.payload;
      })
      .addCase(renewSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentStudentMember } =
  studentMemberSlice.actions;
export default studentMemberSlice.reducer;
