/**
 * Pagination Middleware
 * Enforces safe pagination limits to prevent abuse
 */

// Default pagination settings
const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  minLimit: 1,
};

/**
 * Middleware to validate and sanitize pagination parameters
 * @param {Object} options - Custom options to override defaults
 */
const paginationMiddleware = (options = {}) => {
  const config = {
    ...PAGINATION_DEFAULTS,
    ...options,
  };

  return (req, res, next) => {
    // Parse page
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) {
      page = config.page;
    }

    // Parse limit
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < config.minLimit) {
      limit = config.limit;
    }
    if (limit > config.maxLimit) {
      limit = config.maxLimit;
    }

    // Parse sort
    let sortField = req.query.sortBy || req.query.sort || "createdAt";
    let sortOrder = req.query.sortOrder || req.query.order || "desc";
    
    // Validate sort order
    sortOrder = ["asc", "desc"].includes(sortOrder.toLowerCase()) 
      ? sortOrder.toLowerCase() 
      : "desc";

    // Attach to request
    req.pagination = {
      page,
      limit,
      skip: (page - 1) * limit,
      sort: { [sortField]: sortOrder === "desc" ? -1 : 1 },
    };

    // Also update query params for backward compatibility
    req.query.page = page;
    req.query.limit = limit;

    next();
  };
};

/**
 * Helper to create paginated response
 * @param {Array} data - The data array
 * @param {number} total - Total count of items
 * @param {Object} pagination - Pagination info from req.pagination
 */
const createPaginatedResponse = (data, total, pagination) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    results: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Validate and sanitize ID parameters
 * Prevents injection attacks via ID parameters
 */
const validateIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // MongoDB ObjectId pattern (24 hex characters)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (id && !objectIdPattern.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }
    
    next();
  };
};

export default paginationMiddleware;
export { paginationMiddleware, createPaginatedResponse, validateIdParam, PAGINATION_DEFAULTS };
