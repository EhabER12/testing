import axios from "@/lib/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

const extractErrorMessage = (error: any): string => {
  const apiMessage = error?.response?.data?.error?.message;
  const flatMessage = error?.response?.data?.message;
  return apiMessage || flatMessage || error?.message || error?.toString();
};

export type CouponAppliesTo = "all" | "checkout" | "package";
export type CouponDiscountType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  _id?: string;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  currency: "EGP" | "SAR" | "USD";
  appliesTo: CouponAppliesTo;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidateCouponResponse {
  code: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: "EGP" | "SAR" | "USD";
  context: "checkout" | "package";
  coupon: {
    code: string;
    description?: string;
    discountType: CouponDiscountType;
    discountValue: number;
    maxDiscountAmount?: number | null;
    minOrderAmount?: number;
    currency: "EGP" | "SAR" | "USD";
    appliesTo: CouponAppliesTo;
  };
}

export interface CouponReportOverview {
  totalCoupons: number;
  activeCoupons: number;
  inactiveCoupons: number;
  currentlyValidCoupons: number;
  scheduledCoupons: number;
  expiredCoupons: number;
  expiringSoonCoupons: number;
  usedCoupons: number;
  utilizationRate: number;
  totalRedemptions: number;
  successfulRedemptions: number;
  successRate: number;
  totalDiscountAmount: number;
  totalNetRevenue: number;
  totalGrossRevenue: number;
  avgDiscountPerRedemption: number;
  avgOrderValueAfterDiscount: number;
  avgDiscountRate: number;
}

export interface CouponReportItem {
  code: string;
  isActive: boolean;
  appliesTo: CouponAppliesTo;
  discountType: CouponDiscountType | null;
  discountValue: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  remainingUses?: number | null;
  totalUses: number;
  successfulUses: number;
  successRate: number;
  totalDiscount: number;
  totalNetRevenue: number;
  totalGrossRevenue: number;
  avgDiscountPerUse: number;
  avgDiscountRate: number;
}

export interface CouponReportDaily {
  date: string;
  uses: number;
  totalDiscount: number;
  totalNetRevenue: number;
  totalGrossRevenue: number;
}

export interface CouponReportContextItem {
  context: "checkout" | "package";
  totalUses: number;
  successfulUses: number;
  successRate: number;
  totalDiscount: number;
  totalNetRevenue: number;
  totalGrossRevenue: number;
}

export interface CouponReportResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  currency: "EGP" | "SAR" | "USD";
  overview: CouponReportOverview;
  topCoupons: CouponReportItem[];
  dailyTrend: CouponReportDaily[];
  contextBreakdown: CouponReportContextItem[];
}

export const validateCouponThunk = createAsyncThunk(
  "coupons/validate",
  async (
    {
      code,
      amount,
      currency,
      context,
    }: {
      code: string;
      amount: number;
      currency: "EGP" | "SAR" | "USD";
      context: "checkout" | "package";
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        code: code.trim(),
        amount: String(amount),
        currency,
        context,
      });
      const response = await axios.get(`/coupons/validate?${params.toString()}`);
      return response.data.data as ValidateCouponResponse;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const getCouponsThunk = createAsyncThunk(
  "coupons/getAll",
  async (filters: { isActive?: boolean; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append("isActive", String(filters.isActive));
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }
      const query = params.toString();
      const response = await axios.get(`/coupons${query ? `?${query}` : ""}`);
      return response.data.data as Coupon[];
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const getCouponReportThunk = createAsyncThunk(
  "coupons/report",
  async (
    filters:
      | {
        startDate?: string;
        endDate?: string;
        currency?: "EGP" | "SAR" | "USD";
        limit?: number;
      }
      | undefined,
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.currency) params.append("currency", filters.currency);
      if (filters?.limit) params.append("limit", String(filters.limit));

      const query = params.toString();
      const response = await axios.get(`/coupons/report${query ? `?${query}` : ""}`);
      return response.data.data as CouponReportResponse;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const getCouponThunk = createAsyncThunk(
  "coupons/getOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/coupons/${id}`);
      return response.data.data as Coupon;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const createCouponThunk = createAsyncThunk(
  "coupons/create",
  async (data: Partial<Coupon>, { rejectWithValue }) => {
    try {
      const response = await axios.post("/coupons", data);
      return response.data.data as Coupon;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateCouponThunk = createAsyncThunk(
  "coupons/update",
  async (
    { id, data }: { id: string; data: Partial<Coupon> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/coupons/${id}`, data);
      return response.data.data as Coupon;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deleteCouponThunk = createAsyncThunk(
  "coupons/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/coupons/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);
