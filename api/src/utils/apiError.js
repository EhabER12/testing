/**
 * Centralized Error Types for API
 * Provides consistent error handling across the application
 */

// Standard HTTP Error Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error codes for client reference
export const ERROR_CODES = {
  // Authentication errors (1xxx)
  INVALID_CREDENTIALS: "AUTH_1001",
  TOKEN_EXPIRED: "AUTH_1002",
  TOKEN_INVALID: "AUTH_1003",
  UNAUTHORIZED: "AUTH_1004",
  FORBIDDEN: "AUTH_1005",
  ACCOUNT_INACTIVE: "AUTH_1006",
  
  // Validation errors (2xxx)
  VALIDATION_ERROR: "VAL_2001",
  INVALID_INPUT: "VAL_2002",
  MISSING_FIELD: "VAL_2003",
  INVALID_FORMAT: "VAL_2004",
  
  // Resource errors (3xxx)
  NOT_FOUND: "RES_3001",
  ALREADY_EXISTS: "RES_3002",
  CONFLICT: "RES_3003",
  
  // Business logic errors (4xxx)
  PAYMENT_FAILED: "BIZ_4001",
  INSUFFICIENT_FUNDS: "BIZ_4002",
  SERVICE_UNAVAILABLE: "BIZ_4003",
  RATE_LIMITED: "BIZ_4004",
  
  // Server errors (5xxx)
  INTERNAL_ERROR: "SRV_5001",
  DATABASE_ERROR: "SRV_5002",
  EXTERNAL_SERVICE_ERROR: "SRV_5003",
};

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = errorCode || this.generateErrorCode(statusCode, message);
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  generateErrorCode(statusCode, message) {
    const baseCode = String(statusCode);
    const messagePart = message
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")
      .substring(0, 20);

    return `${baseCode}_${messagePart}`;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Specific error types for common scenarios
 */

export class NotFoundError extends ApiError {
  constructor(resource = "Resource", details = null) {
    super(HTTP_STATUS.NOT_FOUND, `${resource} not found`, details, ERROR_CODES.NOT_FOUND);
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation failed", details = null) {
    super(HTTP_STATUS.BAD_REQUEST, message, details, ERROR_CODES.VALIDATION_ERROR);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized access", details = null) {
    super(HTTP_STATUS.UNAUTHORIZED, message, details, ERROR_CODES.UNAUTHORIZED);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Access forbidden", details = null) {
    super(HTTP_STATUS.FORBIDDEN, message, details, ERROR_CODES.FORBIDDEN);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource already exists", details = null) {
    super(HTTP_STATUS.CONFLICT, message, details, ERROR_CODES.ALREADY_EXISTS);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Too many requests", retryAfter = 60) {
    super(HTTP_STATUS.TOO_MANY_REQUESTS, message, { retryAfter }, ERROR_CODES.RATE_LIMITED);
  }
}

export class InternalError extends ApiError {
  constructor(message = "Internal server error", details = null) {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, details, ERROR_CODES.INTERNAL_ERROR);
    this.isOperational = false; // Programming error
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error factory for creating errors from error codes
 */
export const createError = (code, message, details = null) => {
  switch (code) {
    case ERROR_CODES.NOT_FOUND:
      return new NotFoundError(message, details);
    case ERROR_CODES.VALIDATION_ERROR:
      return new ValidationError(message, details);
    case ERROR_CODES.UNAUTHORIZED:
      return new UnauthorizedError(message, details);
    case ERROR_CODES.FORBIDDEN:
      return new ForbiddenError(message, details);
    case ERROR_CODES.ALREADY_EXISTS:
      return new ConflictError(message, details);
    case ERROR_CODES.RATE_LIMITED:
      return new RateLimitError(message);
    default:
      return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, details, code);
  }
};

export default ApiError;
