import { PaymentService } from "../services/paymentService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

const paymentService = new PaymentService();

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
export const getAllPayments = async (req, res, next) => {
  try {
    const { page, limit, status, userId, productId, serviceId, packageId, studentMemberId } = req.query;
    const payments = await paymentService.getAllPayments({
      page,
      limit,
      status,
      userId,
      productId,
      serviceId,
      packageId,
      studentMemberId,
    });

    return ApiResponse.success(res, payments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history for the current user
// @route   GET /api/payments/history
// @access  Private
export const getUserPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const payments = await paymentService.getAllPayments({
      userId,
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      productId: req.query.productId,
      serviceId: req.query.serviceId,
    });

    return ApiResponse.success(res, payments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private/Admin
export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);

    return ApiResponse.success(res, payment);
  } catch (error) {
    next(error);
  }
};

// @desc    Create manual payment
// @route   POST /api/payments/manual
// @access  Private
export const createManualPayment = async (req, res, next) => {
  try {
    const {
      productId,
      serviceId,
      packageId,
      studentMemberId,
      amount,
      currency,
      pricingTierId,
      manualPaymentMethodId,
      billingInfo,
      notes,
    } = req.body;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin" || req.user.role === "moderator";
    const paymentProofUrl = req.file ? `uploads/${req.file.filename}` : null;

    if (!productId && !serviceId && !packageId) {
      return next(new ApiError(400, "Product ID, Service ID, or Package ID is required"));
    }

    if (!billingInfo || !billingInfo.name) {
      return next(new ApiError(400, "Customer name is required"));
    }

    if (isAdmin) {
      if (!amount || amount <= 0) {
        return next(new ApiError(400, "Valid amount is required"));
      }

      const payment = await paymentService.createAdminManualPayment({
        adminId: userId,
        productId,
        serviceId,
        amount,
        currency: currency || "EGP",
        billingInfo,
        notes,
      });

      return ApiResponse.success(
        res,
        payment,
        "Manual payment created successfully.",
        201
      );
    } else {
      if (!pricingTierId || !manualPaymentMethodId) {
        return next(
          new ApiError(400, "Pricing tier and payment method are required")
        );
      }

      const payment = await paymentService.createManualPayment({
        userId,
        productId,
        serviceId,
        packageId,
        studentMemberId,
        pricingTierId,
        manualPaymentMethodId,
        paymentProofUrl,
        billingInfo,
      });

      return ApiResponse.success(
        res,
        payment,
        "Manual payment created successfully. Awaiting admin approval.",
        201
      );
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create Customer Manual Payment
// @route   POST /api/payments/customer-manual
// @access  Public
export const createCustomerManualPayment = async (req, res, next) => {
  try {
    const {
      productId,
      serviceId,
      packageId,
      studentMemberId,
      pricingTierId,
      manualPaymentMethodId,
      billingInfo,
      cartSessionId,
      currency,
    } = req.body;

    const userId = req.user?._id || null;
    const paymentProofUrl = req.file ? `uploads/${req.file.filename}` : null;

    if (!productId && !serviceId && !packageId) {
      return next(new ApiError(400, "Product ID, Service ID, or Package ID is required"));
    }

    if (!pricingTierId) {
      return next(new ApiError(400, "Pricing tier ID is required"));
    }

    if (!manualPaymentMethodId) {
      return next(new ApiError(400, "Manual payment method ID is required"));
    }

    if (!billingInfo || !billingInfo.name || !billingInfo.email || !billingInfo.phone) {
      return next(new ApiError(400, "Customer name, email and phone are required"));
    }

    const payment = await paymentService.createManualPayment({
      userId,
      productId,
      serviceId,
      packageId,
      studentMemberId,
      pricingTierId,
      manualPaymentMethodId,
      paymentProofUrl,
      billingInfo,
      cartSessionId,
      currency,
    });

    res.status(201).json({
      success: true,
      message: "Payment submitted successfully. Awaiting verification.",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status
// @route   PUT /api/payments/:id/status
// @access  Private/Admin
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, failureReason, note } = req.body;
    const adminId = req.user._id;

    const payment = await paymentService.updatePaymentStatus(
      id,
      status,
      failureReason,
      adminId,
      note
    );

    return ApiResponse.success(
      res,
      payment,
      "Payment status updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin notes
// @route   PUT /api/payments/:id/notes
// @access  Private/Admin
export const updateAdminNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const payment = await paymentService.updateAdminNotes(
      id,
      adminNotes,
      adminId
    );

    return ApiResponse.success(
      res,
      payment,
      "Admin notes updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getRevenueStatistics = async (req, res, next) => {
  try {
    const statistics = await paymentService.getRevenueStatistics();
    return ApiResponse.success(res, statistics);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending payment
// @route   POST /api/payments/:id/cancel
// @access  Private
export const cancelPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const payment = await paymentService.cancelPayment(id, userId);

    return ApiResponse.success(res, payment, "Payment cancelled successfully");
  } catch (error) {
    next(error);
  }
};

// ==================== PayPal ====================

// @desc    Create PayPal payment
// @route   POST /api/payments/paypal/create
// @access  Private
export const createPaypalPayment = async (req, res, next) => {
  try {
    const { courseId, amount, currency = "USD" } = req.body;
    const userId = req.user._id;

    if (!courseId || !amount) {
      return next(new ApiError(400, "Course ID and amount are required"));
    }

    const payment = await paymentService.createPaypalPayment({
      userId,
      courseId,
      amount,
      currency,
    });

    return ApiResponse.success(
      res,
      payment,
      "PayPal payment created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Capture PayPal order
// @route   POST /api/payments/paypal/capture/:orderId
// @access  Private
export const capturePaypalOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const payment = await paymentService.capturePaypalOrder({
      orderId,
      userId,
    });

    return ApiResponse.success(
      res,
      payment,
      "PayPal payment captured successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ==================== Cashier ====================

// @desc    Create Cashier payment
// @route   POST /api/payments/cashier/create
// @access  Private
export const createCashierPayment = async (req, res, next) => {
  try {
    const { courseId, amount, currency = "EGP" } = req.body;
    const userId = req.user._id;
    const user = req.user;

    if (!courseId || !amount) {
      return next(new ApiError(400, "Course ID and amount are required"));
    }

    const payment = await paymentService.createCashierPayment({
      userId,
      courseId,
      amount,
      currency,
      customer: {
        name: user.name?.en || user.name?.ar || "Customer",
        email: user.email,
      },
    });

    return ApiResponse.success(
      res,
      payment,
      "Cashier payment created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Cashier payment callback
// @route   POST /api/payments/cashier/callback
// @access  Public
export const cashierCallback = async (req, res, next) => {
  try {
    const result = await paymentService.handleCashierCallback(req.body);

    // Cashier expects 200 OK
    res.status(200).json({
      success: true,
      message: "Callback processed",
    });
  } catch (error) {
    console.error("Cashier callback error:", error.message);
    // Still return 200 to avoid retries
    res.status(200).json({
      success: false,
      message: "Callback failed",
    });
  }
};
