import couponService from "../services/couponService.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, amount, currency, context } = req.query;

    const result = await couponService.validateCouponForOrder({
      code,
      amount: Number(amount || 0),
      currency,
      context: context || "checkout",
      userId: req.user?._id || null,
    });

    return ApiResponse.success(
      res,
      {
        code: result.code,
        originalAmount: result.originalAmount,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        currency: result.currency,
        context: result.context,
        coupon: result.snapshot,
      },
      "Coupon applied successfully"
    );
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await couponService.getAllCoupons(req.query);
    return ApiResponse.success(res, coupons);
  } catch (error) {
    next(error);
  }
};

export const getCouponReport = async (req, res, next) => {
  try {
    const report = await couponService.getCouponReport({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      currency: req.query.currency,
      limit: req.query.limit,
    });

    return ApiResponse.success(res, report);
  } catch (error) {
    next(error);
  }
};

export const getCouponById = async (req, res, next) => {
  try {
    const coupon = await couponService.getCouponById(req.params.id);
    return ApiResponse.success(res, coupon);
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.body, req.user._id);
    return ApiResponse.success(res, coupon, "Coupon created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(
      req.params.id,
      req.body,
      req.user._id
    );
    return ApiResponse.success(res, coupon, "Coupon updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const result = await couponService.deleteCoupon(req.params.id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};
