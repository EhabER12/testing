import axiosInstance from "@/lib/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getOrCreateSessionId } from "./cartSessionService";

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  redirectUrl?: string;
}

export interface Payment {
  id: string;
  productId:
  | string
  | {
    _id?: string;
    id?: string;
    name?: {
      ar?: string;
      en?: string;
    };
    slug?: string;
    basePrice?: number;
    [key: string]: any;
  };
  serviceId?:
  | string
  | {
    _id?: string;
    id?: string;
    title?: {
      ar?: string;
      en?: string;
    };
    [key: string]: any;
  };
  userId?:
  | string
  | {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentIntentId?: string;
  createdAt?: string;
  updatedAt?: string;
  pricingTier?: {
    tierId?: string;
    people?: number;
    pricePerPerson?: number;
    label?: string;
  };
  billingInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  paymentDetails?: {
    orderId?: number;
    paymentToken?: string;
    iframeId?: string;
    merchantOrderId?: string;
    paypalOrderId?: string;
    approvalLink?: string;
    [key: string]: any;
  };
  merchantOrderId?: string;
  manualPaymentMethodId?: string;
  paymentProofUrl?: string;
  cartSessionId?: string;
  checkoutUrl?: string; // For Cashier/Redirects
  approvalUrl?: string; // For PayPal
}

// Get Payment History (Admin - all payments)
export const getPaymentHistoryThunk = createAsyncThunk(
  "payments/getHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<any>(`/payments`);

      if (
        response.data?.success &&
        Array.isArray(response.data?.data?.results)
      ) {
        return response.data.data.results;
      }

      if (Array.isArray(response.data?.data)) {
        return response.data.data;
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }

      console.warn("Unexpected payment response format:", response.data);
      return [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get User Payment History (Personal)
export const getUserPaymentHistoryThunk = createAsyncThunk(
  "payments/getUserHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<any>(`/payments/history`);

      if (
        response.data?.success &&
        Array.isArray(response.data?.data?.results)
      ) {
        return response.data.data.results;
      }

      if (Array.isArray(response.data?.data)) {
        return response.data.data;
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }

      // Also handle object return if filter is applied
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data;
      }

      console.warn("Unexpected payment response format:", response.data);
      return [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getPaymentDetailsThunk = createAsyncThunk<
  Payment,
  string,
  { rejectValue: string }
>("payments/details", async (paymentId, thunkAPI) => {
  try {
    const state = thunkAPI.getState() as { auth: { user?: { token: string } } };
    const token = state.auth.user?.token;
    if (!token) return thunkAPI.rejectWithValue("Not authorized");

    const response = await axiosInstance.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

interface CreateManualPaymentPayload {
  productId?: string;
  serviceId?: string;
  pricingTierId: string;
  manualPaymentMethodId: string;
  paymentProof?: File;
  billingInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    country?: string;
  };
  amount?: number;
  items?: any[];
  cartSessionId?: string;
  currency?: string;
}

export const createCustomerManualPaymentThunk = createAsyncThunk<
  Payment,
  CreateManualPaymentPayload,
  { rejectValue: string }
>("payments/customerManualCreate", async (paymentData, thunkAPI) => {
  try {
    const formData = new FormData();
    if (paymentData.productId) {
      formData.append("productId", paymentData.productId);
    }
    if (paymentData.serviceId) {
      formData.append("serviceId", paymentData.serviceId);
    }
    formData.append("pricingTierId", paymentData.pricingTierId);
    formData.append("manualPaymentMethodId", paymentData.manualPaymentMethodId);

    formData.append("billingInfo[name]", paymentData.billingInfo.name);
    formData.append("billingInfo[email]", paymentData.billingInfo.email);
    formData.append("billingInfo[phone]", paymentData.billingInfo.phone);
    if (paymentData.billingInfo.address) {
      formData.append("billingInfo[address]", paymentData.billingInfo.address);
    }
    if (paymentData.billingInfo.city) {
      formData.append("billingInfo[city]", paymentData.billingInfo.city);
    }
    if (paymentData.billingInfo.country) {
      formData.append("billingInfo[country]", paymentData.billingInfo.country);
    }
    // Pass amount and items inside billingInfo as a workaround
    if (paymentData.amount) {
      formData.append("billingInfo[amount]", paymentData.amount.toString());
    }
    if (paymentData.items) {
      formData.append("billingInfo[items]", JSON.stringify(paymentData.items));
    }

    if (paymentData.paymentProof) {
      formData.append("paymentProof", paymentData.paymentProof);
    }

    // Send cart session ID to link payment to cart
    const cartSessionId = paymentData.cartSessionId || getOrCreateSessionId();
    if (cartSessionId) {
      formData.append("cartSessionId", cartSessionId);
    }

    // Send currency (default to SAR)
    if (paymentData.currency) {
      formData.append("currency", paymentData.currency);
    }

    const response = await axiosInstance.post(
      "/payments/customer-manual",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 seconds for file uploads
      }
    );

    return response.data.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const createManualPaymentThunk = createAsyncThunk<
  Payment,
  CreateManualPaymentPayload & { amount?: number; currency?: string },
  { rejectValue: string }
>("payments/manualCreate", async (paymentData, thunkAPI) => {
  try {
    const formData = new FormData();
    if (paymentData.productId) {
      formData.append("productId", paymentData.productId);
    }
    if (paymentData.serviceId) {
      formData.append("serviceId", paymentData.serviceId);
    }
    formData.append("pricingTierId", paymentData.pricingTierId);
    formData.append("manualPaymentMethodId", paymentData.manualPaymentMethodId);

    if (paymentData.amount) {
      formData.append("amount", paymentData.amount.toString());
    }
    if (paymentData.currency) {
      formData.append("currency", paymentData.currency);
    }

    formData.append("billingInfo[name]", paymentData.billingInfo.name);
    formData.append("billingInfo[email]", paymentData.billingInfo.email);
    formData.append("billingInfo[phone]", paymentData.billingInfo.phone);
    if (paymentData.billingInfo.address) {
      formData.append("billingInfo[address]", paymentData.billingInfo.address);
    }
    if (paymentData.billingInfo.city) {
      formData.append("billingInfo[city]", paymentData.billingInfo.city);
    }
    if (paymentData.billingInfo.country) {
      formData.append("billingInfo[country]", paymentData.billingInfo.country);
    }

    if (paymentData.paymentProof) {
      formData.append("paymentProof", paymentData.paymentProof);
    }

    const response = await axiosInstance.post("/payments/manual", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const updatePaymentStatusThunk = createAsyncThunk<
  Payment,
  { id: string; status: string; failureReason?: string; note?: string },
  { rejectValue: string }
>(
  "payments/updateStatus",
  async ({ id, status, failureReason, note }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/payments/${id}/status`, {
        status,
        failureReason,
        note,
      });
      return response.data.data;
    } catch (error: any) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export interface RevenueStatistics {
  totalRevenue: number;
  totalPayments: number;
  monthlyRevenue: number;
  monthlyPayments: number;
}

export const getRevenueStatisticsThunk = createAsyncThunk<
  RevenueStatistics,
  void,
  { rejectValue: string }
>("payments/revenueStatistics", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/payments/statistics/revenue");
    return response.data.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const cancelPaymentThunk = createAsyncThunk<
  Payment,
  string,
  { rejectValue: string }
>("payments/cancel", async (id, thunkAPI) => {
  try {
    const response = await axiosInstance.post(`/payments/${id}/cancel`);
    return response.data.data;
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// ==================== NEW: PayPal & Cashier Thunks ====================

interface CreatePaypalPaymentPayload {
  courseId?: string;
  productId?: string;
  amount: number;
  currency?: string;
}

export const createPaypalPaymentThunk = createAsyncThunk<
  Payment,
  CreatePaypalPaymentPayload,
  { rejectValue: string }
>("payments/paypalCreate", async (data, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/payments/paypal/create", data);
    return response.data.data; // Expected to contain approvalUrl or payment details
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

interface CreateCashierPaymentPayload {
  courseId?: string;
  productId?: string;
  amount: number;
  currency?: string;
  customer?: {
    name: string;
    email: string;
  };
}

export const createCashierPaymentThunk = createAsyncThunk<
  Payment,
  CreateCashierPaymentPayload,
  { rejectValue: string }
>("payments/cashierCreate", async (data, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/payments/cashier/create", data);
    return response.data.data; // Expected to contain checkoutUrl
  } catch (error: any) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});
