import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  createCustomerManualPaymentThunk,
  getPaymentHistoryThunk,
  getUserPaymentHistoryThunk,
  getPaymentDetailsThunk,
  getRevenueStatisticsThunk,
  updatePaymentStatusThunk,
  cancelPaymentThunk,
  PaymentIntent,
  Payment,
  RevenueStatistics,
} from "../services/paymentService";

interface PaymentState {
  payments: Payment[];
  payment: Payment | null;
  paymentRedirectUrl: string | null;
  revenueStatistics: RevenueStatistics | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const initialState: PaymentState = {
  payments: [],
  payment: null,
  paymentRedirectUrl: null,
  revenueStatistics: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

export const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    resetPaymentStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
      state.paymentRedirectUrl = null;
    },
    resetPayment: (state) => {
      state.payment = null;
    },
    setPayments: (state, action: PayloadAction<Payment[]>) => {
      state.payments = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE CUSTOMER MANUAL PAYMENT
      .addCase(createCustomerManualPaymentThunk.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        createCustomerManualPaymentThunk.fulfilled,
        (state, action: PayloadAction<Payment>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.payment = action.payload;
          state.message = "Payment submitted successfully!";
        }
      )
      .addCase(createCustomerManualPaymentThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      // GET PAYMENT HISTORY (Admin)
      .addCase(getPaymentHistoryThunk.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        getPaymentHistoryThunk.fulfilled,
        (state, action: PayloadAction<Payment[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.payments = Array.isArray(action.payload) ? action.payload : [];
        }
      )
      .addCase(getPaymentHistoryThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.payments = [];
      })

      // GET USER PAYMENT HISTORY (Personal)
      .addCase(getUserPaymentHistoryThunk.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(
        getUserPaymentHistoryThunk.fulfilled,
        (state, action: PayloadAction<Payment[]>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.payments = Array.isArray(action.payload) ? action.payload : [];
        }
      )
      .addCase(getUserPaymentHistoryThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.payments = [];
      })
      // GET PAYMENT DETAILS (Admin)
      .addCase(getPaymentDetailsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        getPaymentDetailsThunk.fulfilled,
        (state, action: PayloadAction<Payment>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.payment = action.payload;
        }
      )
      .addCase(getPaymentDetailsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // GET REVENUE STATISTICS
      .addCase(getRevenueStatisticsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        getRevenueStatisticsThunk.fulfilled,
        (state, action: PayloadAction<RevenueStatistics>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.revenueStatistics = action.payload;
        }
      )
      .addCase(getRevenueStatisticsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // UPDATE PAYMENT STATUS
      .addCase(updatePaymentStatusThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updatePaymentStatusThunk.fulfilled,
        (state, action: PayloadAction<Payment>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.message = "Payment status updated successfully";
          // Update the payment in the list
          const index = state.payments.findIndex(
            (p) =>
              p.id === action.payload.id || (p as any)._id === action.payload.id
          );
          if (index !== -1) {
            state.payments[index] = action.payload;
          }
          if (
            state.payment &&
            (state.payment.id === action.payload.id ||
              (state.payment as any)._id === action.payload.id)
          ) {
            state.payment = action.payload;
          }
        }
      )
      .addCase(updatePaymentStatusThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // CANCEL PAYMENT
      .addCase(cancelPaymentThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        cancelPaymentThunk.fulfilled,
        (state, action: PayloadAction<Payment>) => {
          state.isLoading = false;
          state.isSuccess = true;
          state.message = "Payment cancelled successfully";
          // Update the payment in the list
          const index = state.payments.findIndex(
            (p) =>
              p.id === action.payload.id ||
              (p as any)._id === (action.payload as any)._id
          );
          if (index !== -1) {
            state.payments[index] = action.payload;
          }
          if (
            state.payment &&
            (state.payment.id === action.payload.id ||
              (state.payment as any)._id === (action.payload as any)._id)
          ) {
            state.payment = action.payload;
          }
        }
      )
      .addCase(cancelPaymentThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  },
});

export const { resetPaymentStatus, resetPayment, setPayments } =
  paymentSlice.actions;
export default paymentSlice.reducer;
