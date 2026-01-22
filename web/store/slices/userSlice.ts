import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  updateUser,
  approveTeacher,
  rejectTeacher,
} from "../services/userService";
import { User } from "./authSlice";

interface UserManagementState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  totalPages: number;
  currentPage: number;
  totalUsers: number;
  limit: number;
}

const initialState: UserManagementState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  totalPages: 1,
  currentPage: 1,
  totalUsers: 0,
  limit: 10,
};

export const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {
    resetUserManagementStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    resetSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE USER
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "User created successfully";
        state.users.push(action.payload);
        state.totalUsers += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // GET ALL USERS
      .addCase(getAllUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.users = action.payload.data.results;
        state.totalPages = action.payload.data.pagination.pages;
        state.currentPage = action.payload.data.pagination.page;
        state.totalUsers = action.payload.data.pagination.total;
        state.limit = action.payload.data.pagination.limit;
        if (action.payload.message) {
          const msg = action.payload.message;
          if (typeof msg === 'object' && msg !== null) {
            state.message = (msg as any).en || (msg as any).ar || JSON.stringify(msg);
          } else {
            state.message = String(msg);
          }
        }
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // GET USER BY ID
      .addCase(getUserById.pending, (state) => {
        state.isLoading = true;
        state.selectedUser = null; // Reset while fetching
      })
      .addCase(getUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.selectedUser = action.payload;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // UPDATE USER ROLE
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true; // Or handle loading per-user?
      })
      .addCase(
        updateUserRole.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.message = "User role updated successfully";
          // Update the user in the list
          state.users = state.users.map((user) =>
            user._id === action.payload._id ? action.payload : user
          );
          // Update selected user if it matches
          if (state.selectedUser?._id === action.payload._id) {
            state.selectedUser = action.payload;
          }
        }
      )
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // DELETE USER
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "User deleted successfully";
        state.users = state.users.filter((user) => user._id !== action.payload);
        if (state.selectedUser?._id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // UPDATE USER
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "User updated successfully";
        state.users = state.users.map((user) =>
          user._id === action.payload._id ? action.payload : user
        );
        if (state.selectedUser?._id === action.payload._id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // APPROVE TEACHER
      .addCase(approveTeacher.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(approveTeacher.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Teacher approved successfully";
        state.users = state.users.map((user) =>
          user._id === action.payload._id ? action.payload : user
        );
        if (state.selectedUser?._id === action.payload._id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(approveTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // REJECT TEACHER
      .addCase(rejectTeacher.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(rejectTeacher.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Teacher rejected successfully";
        state.users = state.users.map((user) =>
          user._id === action.payload._id ? action.payload : user
        );
        if (state.selectedUser?._id === action.payload._id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(rejectTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { resetUserManagementStatus, resetSelectedUser } =
  userManagementSlice.actions;
export default userManagementSlice.reducer;
