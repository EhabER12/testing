import axiosInstance from "@/lib/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export interface PaymentMethod {
    _id: string;
    provider: "paypal" | "cashier" | "stripe";
    displayName: {
        ar: string;
        en: string;
    };
    description?: {
        ar: string;
        en: string;
    };
    credentials: {
        // PayPal
        clientId?: string;
        clientSecret?: string;
        webhookId?: string;

        // Cashier
        mid?: string;
        paymentApiKey?: string;
        secretKey?: string;
    };
    mode: "sandbox" | "live" | "test";
    config: {
        returnUrl?: string;
        cancelUrl?: string;
        checkoutUrl?: string;
        callbackUrl?: string;
        redirectUrl?: string;
        paymentMethod?: string;
    };
    isActive: boolean;
    order: number;
    logo?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Get all payment methods
export const getPaymentMethodsThunk = createAsyncThunk<
    PaymentMethod[],
    { includeInactive?: boolean },
    { rejectValue: string }
>("paymentMethods/getAll", async ({ includeInactive }, thunkAPI) => {
    try {
        const params = includeInactive ? "?includeInactive=true" : "";
        const response = await axiosInstance.get(`/payment-methods${params}`);
        return response.data.data;
    } catch (error: any) {
        const message =
            (error.response && error.response.data && error.response.data.message) ||
            error.message ||
            error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Get payment method by ID
export const getPaymentMethodByIdThunk = createAsyncThunk<
    PaymentMethod,
    string,
    { rejectValue: string }
>("paymentMethods/getById", async (id, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/payment-methods/${id}`);
        return response.data.data;
    } catch (error: any) {
        const message =
            (error.response && error.response.data && error.response.data.message) ||
            error.message ||
            error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create payment method
export const createPaymentMethodThunk = createAsyncThunk<
    PaymentMethod,
    Partial<PaymentMethod>,
    { rejectValue: string }
>("paymentMethods/create", async (data, thunkAPI) => {
    try {
        const response = await axiosInstance.post("/payment-methods", data);
        return response.data.data;
    } catch (error: any) {
        const message =
            (error.response && error.response.data && error.response.data.message) ||
            error.message ||
            error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update payment method
export const updatePaymentMethodThunk = createAsyncThunk<
    PaymentMethod,
    { id: string; data: Partial<PaymentMethod> },
    { rejectValue: string }
>("paymentMethods/update", async ({ id, data }, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/payment-methods/${id}`, data);
        return response.data.data;
    } catch (error: any) {
        const message =
            (error.response && error.response.data && error.response.data.message) ||
            error.message ||
            error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete payment method
export const deletePaymentMethodThunk = createAsyncThunk<
    void,
    string,
    { rejectValue: string }
>("paymentMethods/delete", async (id, thunkAPI) => {
    try {
        await axiosInstance.delete(`/payment-methods/${id}`);
    } catch (error: any) {
        const message =
            (error.response && error.response.data && error.response.data.message) ||
            error.message ||
            error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Toggle payment method status
export const togglePaymentMethodThunk = createAsyncThunk<
    PaymentMethod,
    string,
    { rejectValue: string }
>("paymentMethods/toggle", async (id, thunkAPI) => {
    try {
        const response = await axiosInstance.patch(`/payment-methods/${id}/toggle`);
        return response.data.data;
    } catch (error: any) {
        const message =
            (error.response && error.response.data && error.response.data.message) ||
            error.message ||
            error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});
