/**
 * Authentication Rate Limiter
 * Stricter rate limiting for auth endpoints to prevent brute force attacks
 */

import rateLimit from "express-rate-limit";

/**
 * Extract client IP address from request
 * Supports Cloudflare, nginx, and direct connections
 */
const getClientIP = (req) => {
  return (
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
};

// Disable IPv6 validation for custom key generator
const validationConfig = { 
  xForwardedForHeader: false, 
  keyGeneratorIpFallback: false 
};

/**
 * Rate limiter for login attempts
 * Strict limits to prevent brute force attacks
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  skipSuccessfulRequests: true, // Only count failed attempts
  validate: validationConfig,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * Rate limiter for registration
 * Moderate limits to prevent spam registrations
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
    retryAfter: 60 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  validate: validationConfig,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * Rate limiter for password reset requests
 * Prevent email enumeration and spam
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
    retryAfter: 60 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  validate: validationConfig,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * Rate limiter for token refresh
 * Moderate limits for token refresh operations
 */
export const tokenRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 refreshes per 15 minutes
  message: {
    success: false,
    message: "Too many token refresh requests. Please try again later.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  validate: validationConfig,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * Rate limiter for sensitive operations (e.g., password change)
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  validate: validationConfig,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

export default {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  tokenRefreshLimiter,
  sensitiveLimiter,
};
