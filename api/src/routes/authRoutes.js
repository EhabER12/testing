import express from "express";
import {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  completeRegistration,
  refreshToken,
  verifyEmail,
  resendVerification,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate, schemas } from "../middlewares/validationMiddleware.js";
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  tokenRefreshLimiter,
} from "../middlewares/authRateLimiter.js";

const router = express.Router();

// Public routes with rate limiting
router.post("/register", registerLimiter, validate(schemas.auth.register), register);
router.post("/login", loginLimiter, validate(schemas.auth.login), login);
router.post("/refresh-token", tokenRefreshLimiter, refreshToken);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(schemas.auth.forgotPassword),
  forgotPassword
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validate(schemas.auth.resetPassword),
  resetPassword
);
router.post("/complete-registration", completeRegistration);

// Email verification routes
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", registerLimiter, resendVerification);

// Protected routes
router.get("/me", protect, getProfile);

export default router;
