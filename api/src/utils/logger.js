/**
 * Professional Logger Utility
 * Replaces console.log with structured, environment-aware logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

class Logger {
  constructor() {
    this.level = this.getLogLevel();
    this.isProduction = process.env.NODE_ENV === "production";
  }

  getLogLevel() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
      return LOG_LEVELS[envLevel];
    }
    // Default: DEBUG in development, INFO in production
    return process.env.NODE_ENV === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    
    if (this.isProduction) {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    }

    // Pretty format for development
    const metaStr = Object.keys(meta).length > 0 
      ? ` ${JSON.stringify(meta)}` 
      : "";
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  colorize(color, text) {
    if (this.isProduction) return text;
    return `${COLORS[color]}${text}${COLORS.reset}`;
  }

  error(message, meta = {}) {
    if (this.level >= LOG_LEVELS.ERROR) {
      const formatted = this.formatMessage("ERROR", message, meta);
      console.error(this.colorize("red", formatted));
    }
  }

  warn(message, meta = {}) {
    if (this.level >= LOG_LEVELS.WARN) {
      const formatted = this.formatMessage("WARN", message, meta);
      console.warn(this.colorize("yellow", formatted));
    }
  }

  info(message, meta = {}) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage("INFO", message, meta);
      console.info(this.colorize("green", formatted));
    }
  }

  debug(message, meta = {}) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      const formatted = this.formatMessage("DEBUG", message, meta);
      console.debug(this.colorize("gray", formatted));
    }
  }

  // Success log (INFO level with success styling)
  success(message, meta = {}) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage("SUCCESS", message, meta);
      console.info(this.colorize("cyan", formatted));
    }
  }

  // HTTP request logging helper
  http(method, path, statusCode, duration) {
    const color = statusCode >= 500 ? "red" : statusCode >= 400 ? "yellow" : "green";
    const message = `${method} ${path} ${statusCode} - ${duration}ms`;
    
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(this.colorize(color, this.formatMessage("HTTP", message)));
    }
  }
}

// Export singleton instance
const logger = new Logger();

export default logger;
export { Logger, LOG_LEVELS };
