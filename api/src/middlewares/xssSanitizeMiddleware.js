/**
 * XSS Sanitization Middleware
 * Modern replacement for deprecated xss-clean package
 * Uses sanitize-html for thorough XSS protection
 */

import sanitizeHtml from "sanitize-html";

// Configuration for different sanitization levels
const SANITIZE_OPTIONS = {
  // Strict: removes ALL HTML (for user input fields)
  strict: {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  },
  // Moderate: allows basic formatting (for rich text fields)
  moderate: {
    allowedTags: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
    allowedAttributes: {
      a: ["href", "title", "target"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  },
  // Rich: allows more HTML (for article content from admin)
  rich: {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "h1", "h2", "h3", "h4", "h5", "h6", "span", "div",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["class", "style"],
    },
    allowedSchemes: ["http", "https", "data"],
    allowedStyles: {
      "*": {
        "color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
        "text-align": [/^left$/, /^right$/, /^center$/],
        "font-size": [/^\d+(?:px|em|%)$/],
      },
    },
  },
};

/**
 * Recursively sanitize an object's string values
 */
const sanitizeObject = (obj, options = SANITIZE_OPTIONS.strict) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeHtml(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, options));
  }

  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, options);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Express middleware for XSS sanitization
 * @param {Object} options - Configuration options
 * @param {string[]} options.skipPaths - Paths to skip sanitization
 * @param {string[]} options.richTextFields - Fields that allow rich HTML
 * @param {string} options.level - Default sanitization level: 'strict', 'moderate', 'rich'
 */
const xssSanitize = (options = {}) => {
  const {
    skipPaths = [],
    richTextFields = ["content", "description", "body"],
    level = "strict",
  } = options;

  return (req, res, next) => {
    // Skip certain paths (e.g., file uploads, webhooks)
    if (skipPaths.some((path) => req.path.includes(path))) {
      return next();
    }

    // Sanitize request body
    if (req.body && typeof req.body === "object") {
      const sanitizedBody = {};
      
      for (const [key, value] of Object.entries(req.body)) {
        // Use rich sanitization for known rich text fields
        if (richTextFields.includes(key)) {
          sanitizedBody[key] = sanitizeObject(value, SANITIZE_OPTIONS.rich);
        } else {
          sanitizedBody[key] = sanitizeObject(value, SANITIZE_OPTIONS[level]);
        }
      }
      
      req.body = sanitizedBody;
    }

    // Sanitize query parameters (always strict)
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query, SANITIZE_OPTIONS.strict);
    }

    // Sanitize URL parameters (always strict)
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObject(req.params, SANITIZE_OPTIONS.strict);
    }

    next();
  };
};

// Export default middleware instance
export default xssSanitize;

// Export for custom use
export { sanitizeObject, SANITIZE_OPTIONS, xssSanitize };
