import { createSlice } from "@reduxjs/toolkit";
import {
  getPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  getPackageStats,
  getPackageStudents,
  Package,
  PackageStats,
} from "../services/packageService";
import { StudentMember } from "../services/studentMemberService";

interface PackageState {
  packages: Package[];
  currentPackage: Package | null;
  currentPackageStats: PackageStats | null;
  currentPackageStudents: StudentMember[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PackageState = {
  packages: [],
  currentPackage: null,
  currentPackageStats: null,
  currentPackageStudents: [],
  isLoading: false,
  error: null,
};

const packageSlice = createSlice({
  name: "packages",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPackage: (state) => {
      state.currentPackage = null;
      state.currentPackageStats = null;
      state.currentPackageStudents = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all packages
      .addCase(getPackages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPackages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packages = action.payload;
      })
      .addCase(getPackages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get single package
      .addCase(getPackage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPackage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPackage = action.payload;
      })
      .addCase(getPackage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create package
      .addCase(createPackage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packages.push(action.payload);
      })
      .addCase(createPackage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update package
      .addCase(updatePackage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePackage.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.packages.findIndex(
          (p) => (p.id || p._id) === (action.payload.id || action.payload._id)
        );
        if (index !== -1) {
          state.packages[index] = action.payload;
        }
        state.currentPackage = action.payload;
      })
      .addCase(updatePackage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete package
      .addCase(deletePackage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packages = state.packages.filter((p) => (p.id || p._id) !== action.payload);
      })
      .addCase(deletePackage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get package stats
      .addCase(getPackageStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPackageStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPackageStats = action.payload;
      })
      .addCase(getPackageStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get package students
      .addCase(getPackageStudents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPackageStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPackageStudents = action.payload;
      })
      .addCase(getPackageStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentPackage } = packageSlice.actions;
export default packageSlice.reducer;
