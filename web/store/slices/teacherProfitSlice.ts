import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getMyProfitStatsThunk,
  getAllTeachersProfitStatsThunk,
  updateTeacherProfitPercentagesThunk,
  TeacherProfitStats,
} from "../services/teacherProfitService";

interface TeacherProfitState {
  myStats: TeacherProfitStats | null;
  allTeachersStats: any[];
  isLoading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: TeacherProfitState = {
  myStats: null,
  allTeachersStats: [],
  isLoading: false,
  error: null,
  message: null,
};

const teacherProfitSlice = createSlice({
  name: "teacherProfit",
  initialState,
  reducers: {
    resetState: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get My Stats
      .addCase(getMyProfitStatsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyProfitStatsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myStats = action.payload;
      })
      .addCase(getMyProfitStatsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get All Teachers Stats
      .addCase(getAllTeachersProfitStatsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllTeachersProfitStatsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allTeachersStats = action.payload;
      })
      .addCase(getAllTeachersProfitStatsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Percentages
      .addCase(updateTeacherProfitPercentagesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTeacherProfitPercentagesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = "Profit percentages updated successfully";
      })
      .addCase(updateTeacherProfitPercentagesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetState } = teacherProfitSlice.actions;
export default teacherProfitSlice.reducer;
