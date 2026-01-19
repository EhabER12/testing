import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  approveReview,
  rejectReview,
  getUserReviewsThunk,
} from "../services/reviewService";
import { Review } from "../services/reviewService";

interface ReviewState {
  reviews: Review[];
  review: Review | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  totalPages: number;
  currentPage: number;
}

const initialState: ReviewState = {
  reviews: [],
  review: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  totalPages: 0,
  currentPage: 1,
};

export const reviewSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    resetReviewStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    resetReview: (state) => {
      state.review = null;
    },
    setReviews: (state, action: PayloadAction<Review[]>) => {
      state.reviews = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET ALL REVIEWS
      .addCase(getReviews.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.reviews = action.payload.data.results;
        state.totalPages = action.payload.data.pagination.pages;
        state.currentPage = action.payload.data.pagination.page;
        state.message = action.payload.message || "";
      })
      .addCase(getReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // GET USER REVIEWS
      .addCase(getUserReviewsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserReviewsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.reviews = action.payload.data.results;
        state.totalPages = action.payload.data.pagination.pages;
        state.currentPage = action.payload.data.pagination.page;
        state.message = action.payload.message || "";
      })
      .addCase(getUserReviewsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // GET REVIEW BY ID
      .addCase(getReviewById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getReviewById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.review = action.payload;
      })
      .addCase(getReviewById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // CREATE REVIEW
      .addCase(createReview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Add to reviews list if needed, or rely on re-fetch
        // state.reviews.push(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // UPDATE REVIEW
      .addCase(updateReview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updateReview.fulfilled,
        (state, action: PayloadAction<Review>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.reviews = state.reviews.map((review: Review) =>
            review._id === action.payload._id ? action.payload : review
          );
          if (state.review && state.review._id === action.payload._id) {
            state.review = action.payload;
          }
        }
      )
      .addCase(updateReview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // APPROVE REVIEW
      .addCase(approveReview.pending, (state) => {
        // May not need loading state change if UI handles optimistically
      })
      .addCase(
        approveReview.fulfilled,
        (state, action: PayloadAction<Review>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.reviews = state.reviews.map((review: Review) =>
            review._id === action.payload._id ? action.payload : review
          );
        }
      )
      .addCase(approveReview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // REJECT REVIEW
      .addCase(rejectReview.pending, (state) => {
        // May not need loading state change
      })
      .addCase(
        rejectReview.fulfilled,
        (state, action: PayloadAction<Review>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.reviews = state.reviews.map((review: Review) =>
            review._id === action.payload._id ? action.payload : review
          );
        }
      )
      .addCase(rejectReview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { resetReviewStatus, resetReview, setReviews } =
  reviewSlice.actions;
export default reviewSlice.reducer;
