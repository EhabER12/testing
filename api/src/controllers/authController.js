import { AuthService } from "../services/authService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

const authService = new AuthService();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const userData = req.body;
    const user = await authService.register(userData);

    return ApiResponse.success(res, user, "User registered successfully", 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    // Track login info for moderator/admin users
    if (user.role === "moderator" || user.role === "admin") {
      const ipAddress =
        req.headers["cf-connecting-ip"] ||
        req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.ip;

      // Update login info asynchronously (don't block the response)
      authService
        .updateLoginInfo(user._id, ipAddress)
        .catch((err) =>
          logger.error("Failed to update login info", { error: err.message })
        );
    }

    return ApiResponse.success(res, user, "Login successful");
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.error(res, "Refresh token is required", 400);
    }

    const tokens = await authService.refreshToken(refreshToken);

    return ApiResponse.success(res, tokens, "Token refreshed successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await authService.getProfile(userId);

    return ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Call the service method
    await authService.forgotPassword(email);

    // Always return a success message to prevent email enumeration attacks
    return ApiResponse.success(
      res,
      null,
      "If an account with that email exists, a password reset link has been sent."
    );
  } catch (error) {
    // Log the error but still return generic message
    logger.error("Forgot password error", { error: error.message });
    
    // Still return a generic success message to prevent email enumeration
    return ApiResponse.success(
      res,
      null,
      "If an account with that email exists, a password reset link has been sent."
    );
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Call the service method
    await authService.resetPassword(token, password);

    return ApiResponse.success(
      res,
      null,
      "Password has been reset successfully."
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Complete Registration
// @route   POST /api/auth/complete-registration
// @access  Public
export const completeRegistration = async (req, res, next) => {
  try {
    const { token, name, password } = req.body;
    const user = await authService.completeRegistration(token, name, password);

    return ApiResponse.success(
      res,
      user,
      "Registration completed successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return ApiResponse.error(res, "Verification token is required", 400);
    }

    const result = await authService.verifyEmail(token);

    return ApiResponse.success(
      res,
      result,
      "Email verified successfully. You can now login."
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ApiResponse.error(res, "Email is required", 400);
    }

    await authService.resendVerificationEmail(email);

    // Always return success to prevent email enumeration
    return ApiResponse.success(
      res,
      null,
      "If an account with that email exists and is not verified, a verification email has been sent."
    );
  } catch (error) {
    // Handle "already verified" error specifically
    if (error.message === "Email is already verified") {
      return ApiResponse.error(res, error.message, 400);
    }
    next(error);
  }
};
