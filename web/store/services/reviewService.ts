import axiosInstance from "@/lib/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { AuthState } from "../slices/authSlice";

export interface ReviewImage {
  id: string;
  url: string;
}

export interface Review {
  _id: string;
  id?: string;
  productId?: {
    _id?: string;
    id?: string;
    name?: {
      ar?: string;
      en?: string;
    };
    slug?: string;
  };
  serviceId?: {
    _id?: string;
    id?: string;
    title?: {
      ar?: string;
      en?: string;
    };
  };
  userId?: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  images?: ReviewImage[];
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string;
}

interface GetReviewsResponse {
  success: boolean;
  data: {
    results: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string | null;
}

export const getReviews = createAsyncThunk<
  GetReviewsResponse,
  | {
      page?: number;
      limit?: number;
      status?: string;
      productId?: string;
      serviceId?: string;
    }
  | undefined,
  { rejectValue: string }
>("reviews/getAll", async (params, thunkAPI) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.productId) queryParams.append("productId", params.productId);
    if (params?.serviceId) queryParams.append("serviceId", params.serviceId);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const url = `/reviews${query}`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const getUserReviewsThunk = createAsyncThunk<
  GetReviewsResponse,
  | {
      page?: number;
      limit?: number;
    }
  | undefined,
  { rejectValue: string }
>("reviews/getUserReviews", async (params, thunkAPI) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const url = `/reviews/my-reviews${query}`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Get review by ID
export const getReviewById = createAsyncThunk<
  Review,
  string,
  { rejectValue: string }
>("reviews/getById", async (reviewId, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/reviews/${reviewId}`);
    return response.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Create review
export const createReview = createAsyncThunk<
  Review,
  FormData,
  { rejectValue: string }
>("reviews/create", async (reviewData, thunkAPI) => {
  try {
    // Assuming create doesn't strictly require auth token based on backend routes?
    // Add token check if needed:
    // const state = thunkAPI.getState() as { auth: { user?: { token: string } } };
    // const token = state.auth.user?.token;
    // if (!token) return thunkAPI.rejectWithValue("Not authorized");

    const response = await axiosInstance.post("/reviews", reviewData);
    return response.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Update review
export const updateReview = createAsyncThunk<
  Review,
  { reviewId: string; reviewData: FormData },
  { rejectValue: string }
>("reviews/update", async ({ reviewId, reviewData }, thunkAPI) => {
  try {
    // Add token check if needed (assuming update requires admin/auth)
    const state = thunkAPI.getState() as { auth: { user?: { token: string } } };
    const token = state.auth.user?.token;
    if (!token) return thunkAPI.rejectWithValue("Not authorized");

    const response = await axiosInstance.put(
      `/reviews/${reviewId}`,
      reviewData
    );
    return response.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Approve review
export const approveReview = createAsyncThunk<
  Review,
  string,
  { rejectValue: string }
>("reviews/approve", async (reviewId, thunkAPI) => {
  try {
    const state = thunkAPI.getState() as { auth: AuthState };

    const token = state.auth.user?.token;

    if (!token) {
      console.error(
        "[approveReview Thunk] Rejecting - Not authorized (no token)."
      );
      return thunkAPI.rejectWithValue("Not authorized");
    }
    const url = `/reviews/${reviewId}/approve`;
    const response = await axiosInstance.post(url);

    return response.data;
  } catch (error: any) {
    console.error("[approveReview Thunk] Caught error:", error);
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Reject review
export const rejectReview = createAsyncThunk<
  Review,
  { reviewId: string; reason: string },
  { rejectValue: string }
>("reviews/reject", async ({ reviewId, reason }, thunkAPI) => {
  try {
    const state = thunkAPI.getState() as { auth: AuthState };

    const tokenFromDirectPath = state.auth.user?.token;
    const tokenFromNestedPath = (state.auth.user as any)?.data?.token;

    const token = tokenFromDirectPath;

    if (!token) {
      console.error(
        "[rejectReview Thunk] Rejecting - Not authorized (no token)."
      );
      return thunkAPI.rejectWithValue("Not authorized");
    }

    const url = `/reviews/${reviewId}/reject`;
    const payload = { reason };

    const response = await axiosInstance.post(url, payload);

    return response.data;
  } catch (error: any) {
    console.error("[rejectReview Thunk] Caught error:", error);
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});
