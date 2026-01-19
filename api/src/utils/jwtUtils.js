import jwt from "jsonwebtoken";
import crypto from "crypto";
import logger from "./logger.js";

// JWT Configuration
const JWT_CONFIG = {
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  issuer: process.env.JWT_ISSUER || "genoun-api",
  audience: process.env.JWT_AUDIENCE || "genoun-web",
};

// Minimum JWT secret length for security
const MIN_SECRET_LENGTH = 32;

/**
 * Validate JWT_SECRET meets security requirements
 */
const validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    logger.error("JWT_SECRET is not configured. Application cannot start securely.");
    throw new Error("JWT_SECRET environment variable is required");
  }
  
  if (secret.length < MIN_SECRET_LENGTH) {
    logger.warn(
      `JWT_SECRET is too short (${secret.length} chars). Minimum recommended: ${MIN_SECRET_LENGTH} chars.`,
      { currentLength: secret.length }
    );
  }
  
  // Check for weak/common secrets
  const weakSecrets = ["secret", "password", "jwt-secret", "zico", "123456"];
  if (weakSecrets.includes(secret.toLowerCase())) {
    logger.error("JWT_SECRET is using a weak/common value. This is a security risk.");
    if (process.env.NODE_ENV === "production") {
      throw new Error("Weak JWT_SECRET not allowed in production");
    }
  }
  
  return secret;
};

/**
 * Generate access token (short-lived)
 * @param {string} id - User ID
 * @param {object} additionalClaims - Additional claims to include
 * @returns {string} JWT access token
 */
export const generateToken = (id, additionalClaims = {}) => {
  const secret = validateJwtSecret();
  
  return jwt.sign(
    { 
      id,
      type: "access",
      ...additionalClaims,
    }, 
    secret, 
    {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }
  );
};

/**
 * Generate refresh token (long-lived)
 * @param {string} id - User ID
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (id) => {
  const secret = validateJwtSecret();
  
  return jwt.sign(
    { 
      id,
      type: "refresh",
      jti: crypto.randomBytes(16).toString("hex"), // Unique token ID
    }, 
    secret, 
    {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }
  );
};

/**
 * Verify and decode a token
 * @param {string} token - JWT token to verify
 * @param {string} expectedType - Expected token type ('access' or 'refresh')
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token, expectedType = "access") => {
  const secret = validateJwtSecret();
  
  const decoded = jwt.verify(token, secret, {
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
  
  // Validate token type
  if (expectedType && decoded.type !== expectedType) {
    throw new jwt.JsonWebTokenError(`Invalid token type. Expected ${expectedType}`);
  }
  
  return decoded;
};

/**
 * Generate both access and refresh tokens
 * @param {string} id - User ID
 * @param {object} additionalClaims - Additional claims for access token
 * @returns {object} Object containing accessToken and refreshToken
 */
export const generateTokenPair = (id, additionalClaims = {}) => {
  return {
    accessToken: generateToken(id, additionalClaims),
    refreshToken: generateRefreshToken(id),
    expiresIn: JWT_CONFIG.accessTokenExpiry,
  };
};

/**
 * Generate a secure random token (for password reset, etc.)
 * @param {number} bytes - Number of random bytes
 * @returns {string} Hex-encoded random token
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

/**
 * Hash a token (for storage)
 * @param {string} token - Token to hash
 * @returns {string} SHA-256 hash of the token
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export default {
  generateToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  generateSecureToken,
  hashToken,
  JWT_CONFIG,
};
