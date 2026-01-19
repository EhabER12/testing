export class ApiResponse {
  static success(res, data, message = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    });
  }

  static error(res, error, statusCode = 500) {
    if (typeof error === "string") {
      return res.status(statusCode).json({
        success: false,
        error: {
          code: "ERROR",
          message: error,
          details: null,
        },
      });
    }

    return res.status(error.statusCode || statusCode).json({
      success: false,
      error: {
        code: error.code || "SERVER_ERROR",
        message: error.message || "Something went wrong",
        details: error.details || null,
      },
    });
  }
}

export default ApiResponse;
