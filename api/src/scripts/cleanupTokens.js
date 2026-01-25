import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, "../../.env") });

const cleanupTokens = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Connected to MongoDB for token cleanup");

    const now = new Date();

    // Cleanup expired password reset tokens
    const resetResult = await User.updateMany(
      { passwordResetExpires: { $lt: now } },
      {
        $unset: {
          passwordResetToken: "",
          passwordResetExpires: "",
        },
      }
    );
    logger.info(`Cleaned up ${resetResult.modifiedCount} expired password reset tokens`);

    // Cleanup expired email verification tokens
    const verificationResult = await User.updateMany(
      { emailVerificationExpires: { $lt: now }, isEmailVerified: false },
      {
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: "",
        },
      }
    );
    logger.info(`Cleaned up ${verificationResult.modifiedCount} expired email verification tokens`);

    // Cleanup expired invited verification tokens
    const invitedResult = await User.updateMany(
        { verificationTokenExpire: { $lt: now }, status: "invited" },
        {
          $unset: {
            verificationToken: "",
            verificationTokenExpire: "",
          },
        }
      );
      logger.info(`Cleaned up ${invitedResult.modifiedCount} expired invited verification tokens`);

    await mongoose.connection.close();
    logger.info("Cleanup completed and connection closed");
    process.exit(0);
  } catch (error) {
    logger.error("Cleanup failed:", error);
    process.exit(1);
  }
};

cleanupTokens();
