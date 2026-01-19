import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/apiError.js";

const userRepository = new UserRepository();

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(401, "Not authorized, no token");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, "Not authorized, user not found");
    }

    // Track activity for moderator/admin users (async, non-blocking)
    if (user.role === "moderator" || user.role === "admin") {
      const ipAddress =
        req.headers["cf-connecting-ip"] ||
        req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";

      // Update activity info in background (don't await to avoid slowing down requests)
      userRepository
        .update(user._id, {
          "activityInfo.lastActivityAt": new Date(),
          "activityInfo.lastIpAddress": ipAddress,
        })
        .catch((err) =>
          console.error("Failed to update user activity:", err.message)
        );
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      next(new ApiError(401, "Not authorized, invalid token"));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }

    if (!roles.includes(req.user.role)) {
      const rolesList = roles.join(", ");
      return next(
        new ApiError(403, `Not authorized. Required role(s): ${rolesList}`)
      );
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userRepository.findById(decoded.id);

        if (user) {
          req.user = user;
        }
      } catch (error) {
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
