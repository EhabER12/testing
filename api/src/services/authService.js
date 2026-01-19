import { UserRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/apiError.js";
import {
  generateToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  generateSecureToken,
  hashToken,
} from "../utils/jwtUtils.js";
import emailTemplateService from "./emailTemplateService.js";
import { EmailService } from "./emailService.js";
import logger from "../utils/logger.js";

// Password reset token expiry (1 hour)
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000;
// Email verification token expiry (24 hours)
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000;

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
  }

  async register(userData) {
    const { email, password, confirmPassword, fullName, phone, role } = userData;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new ApiError(400, "Passwords do not match");
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    // Validate and set role (only allow 'user' or 'teacher' for public registration)
    let userRole = "user"; // default
    if (role && ["user", "teacher"].includes(role)) {
      userRole = role;
    }

    // Generate email verification token
    const verificationToken = generateSecureToken(32);
    const hashedVerificationToken = hashToken(verificationToken);

    // Prepare user data
    const userPayload = {
      fullName,
      email,
      phone,
      password,
      role: userRole,
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY),
    };

    // If registering as teacher, require approval
    if (userRole === "teacher") {
      userPayload.teacherInfo = {
        isApproved: false,
        bio: "",
        specialization: "",
      };
    }

    // Create user with verification token
    const user = await this.userRepository.create(userPayload);

    // Send verification email
    await this.sendVerificationEmail(user, verificationToken);

    // Generate token pair (access + refresh)
    const tokens = generateTokenPair(user._id);

    logger.info("New user registered", { userId: user._id, email: user.email });

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      message: "Please check your email to verify your account.",
    };
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(user, token) {
    const verifyUrl = `${process.env.CLIENT_URL || process.env.WEBSITE_URL}/verify-email?token=${token}`;

    try {
      await emailTemplateService.sendTemplatedEmail(
        user.email,
        "registration",
        {
          name: user.fullName || user.name || "User",
          loginUrl: verifyUrl,
          year: new Date().getFullYear(),
        },
        "ar"
      );
      logger.info("Verification email sent using template", { userId: user._id, email: user.email });
    } catch (error) {
      logger.error("Failed to send verification email using template", { error: error.message, userId: user._id });
      // Fallback to basic email if template fails (optional)
    }
  }

  async login(email, password) {
    // Find user with password for authentication
    const user = await this.userRepository.findByEmail(email, true);

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Check if user is active
    if (user.status !== "active") {
      throw new ApiError(401, "Your account is inactive");
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Check if email is verified (optional: you can make this mandatory)
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === "true";
    if (requireEmailVerification && !user.isEmailVerified) {
      throw new ApiError(403, "Please verify your email before logging in. Check your inbox or request a new verification email.");
    }

    // Generate token pair
    const tokens = generateTokenPair(user._id);

    logger.info("User logged in", { userId: user._id, email: user.email });

    // Prepare response data
    const responseData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };

    // Include teacherInfo for teachers
    if (user.role === "teacher" && user.teacherInfo) {
      responseData.teacherInfo = {
        isApproved: user.teacherInfo.isApproved,
        bio: user.teacherInfo.bio,
        specialization: user.teacherInfo.specialization,
        canPublishDirectly: user.teacherInfo.canPublishDirectly,
      };
    }

    return responseData;
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    };
  }

  /**
   * Verify email using token
   */
  async verifyEmail(token) {
    const hashedToken = hashToken(token);

    // Find user with this verification token
    const user = await this.userRepository.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info("Email verified", { userId: user._id, email: user.email });

    return { success: true, email: user.email };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    const user = await this.userRepository.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      logger.debug("Resend verification requested for non-existent email", { email });
      return { success: true };
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new ApiError(400, "Email is already verified");
    }

    // Generate new verification token
    const verificationToken = generateSecureToken(32);
    const hashedVerificationToken = hashToken(verificationToken);

    // Update user with new token
    await this.userRepository.update(user._id, {
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY),
    });

    // Send verification email
    await this.sendVerificationEmail(user, verificationToken);

    return { success: true };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken, "refresh");

      // Get user
      const user = await this.userRepository.findById(decoded.id);

      if (!user || user.status !== "active") {
        throw new ApiError(401, "Invalid refresh token");
      }

      // Generate new token pair
      const tokens = generateTokenPair(user._id);

      logger.debug("Token refreshed", { userId: user._id });

      return {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      logger.warn("Token refresh failed", { error: error.message });
      throw new ApiError(401, "Invalid or expired refresh token");
    }
  }

  /**
   * Initiate password reset process
   */
  async forgotPassword(email) {
    const user = await this.userRepository.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      logger.debug("Password reset requested for non-existent email", { email });
      return { success: true };
    }

    // Generate reset token
    const resetToken = generateSecureToken(32);
    const hashedToken = hashToken(resetToken);

    // Save hashed token to user
    await this.userRepository.update(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_EXPIRY),
    });

    // Build reset URL
    const resetUrl = `${process.env.CLIENT_URL || process.env.WEBSITE_URL}/reset-password?token=${resetToken}`;

    // Send email
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a472a;">Password Reset Request</h2>
          <p>Hello ${user.name || "User"},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1a472a; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `;

      await this.emailService.sendEmail(
        user.email,
        "Password Reset Request",
        emailHtml
      );

      logger.info("Password reset email sent", { userId: user._id, email: user.email });
    } catch (error) {
      // Clear the reset token if email fails
      await this.userRepository.update(user._id, {
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });

      logger.error("Failed to send password reset email", { error: error.message, userId: user._id });
      throw new ApiError(500, "Failed to send reset email. Please try again later.");
    }

    return { success: true };
  }

  /**
   * Reset password using token
   */
  async resetPassword(token, newPassword) {
    // Hash the provided token
    const hashedToken = hashToken(token);

    // Find user with this token that hasn't expired
    const user = await this.userRepository.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info("Password reset successful", { userId: user._id, email: user.email });

    // Optionally send confirmation email
    try {
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a472a;">Password Changed Successfully</h2>
          <p>Hello ${user.name || "User"},</p>
          <p>Your password has been changed successfully.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `;

      await this.emailService.sendEmail(
        user.email,
        "Password Changed Successfully",
        confirmationHtml
      );
    } catch (error) {
      // Don't throw error if confirmation email fails
      logger.warn("Failed to send password change confirmation email", { error: error.message });
    }

    return { success: true };
  }

  async completeRegistration(token, name, password) {
    const hashedToken = hashToken(token);

    const user = await this.userRepository.findOne({
      verificationToken: hashedToken,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired token");
    }

    user.fullName = {
      ar: name,
      en: name,
    };
    user.password = password;
    user.status = "active";
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();

    const tokens = generateTokenPair(user._id);

    logger.info("User registration completed", { userId: user._id, email: user.email });

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  // Update login tracking info for employees/admins
  async updateLoginInfo(userId, ipAddress) {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;

    const update = {
      "activityInfo.lastLoginAt": new Date(),
      "activityInfo.lastIpAddress": ipAddress,
      "activityInfo.loginCount": (user.activityInfo?.loginCount || 0) + 1,
    };

    return this.userRepository.update(userId, update);
  }
}
