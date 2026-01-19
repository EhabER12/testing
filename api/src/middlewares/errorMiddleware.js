import { ApiError, HTTP_STATUS, ERROR_CODES } from "../utils/apiError.js";
import logger from "../utils/logger.js";

/**
 * Global error handler middleware
 * Handles all errors consistently across the application
 */
export const errorHandler = (err, req, res, next) => {
  // Log error (with different levels based on type)
  if (err.isOperational === false || err.statusCode >= 500) {
    logger.error("Server error", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn("Client error", {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
    });
  }

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || String(err.statusCode),
        message: err.message,
        details: err.details || null,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
  }

  // Handle Multer (file upload) errors
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "File too large",
      LIMIT_FILE_COUNT: "Too many files",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
    };
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: "FILE_UPLOAD_ERROR",
        message: messages[err.code] || err.message,
      },
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((val) => ({
      path: val.path || val.properties?.path || null,
      message: val.message,
    }));
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Validation failed",
        details,
      },
    });
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      error: {
        code: ERROR_CODES.ALREADY_EXISTS,
        message: `${field} already exists`,
        details: { field, value: err.keyValue[field] },
      },
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_FORMAT,
        message: `Invalid ${err.path}: ${err.value}`,
      },
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.TOKEN_INVALID,
        message: "Invalid token",
      },
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: "Token expired",
      },
    });
  }

  // Handle syntax errors in JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_INPUT,
        message: "Invalid JSON in request body",
      },
    });
  }

  // Default server error
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Something went wrong on the server",
      ...(process.env.NODE_ENV === "development" && {
        details: err.message,
        stack: err.stack,
      }),
    },
  });
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${req.originalUrl} not found`,
    },
  });
};
