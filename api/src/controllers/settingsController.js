import { SettingsService } from "../services/settingsService.js";
import emailTemplateService from "../services/emailTemplateService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { EmailService } from "../services/emailService.js";

const settingsService = new SettingsService();
const emailService = new EmailService();

// @desc    Get website settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    return ApiResponse.success(res, settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Get public website settings
// @route   GET /api/settings/public
// @access  Public
export const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getPublicSettings();
    return ApiResponse.success(res, settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update website settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res, next) => {
  try {
    const settingsData = req.body;
    const files = req.files || {};
    const userId = req.user._id;

    const settings = await settingsService.updateSettings(
      settingsData,
      userId,
      files.logo && files.logo.length > 0 ? files.logo[0] : null,
      files.favicon && files.favicon.length > 0 ? files.favicon[0] : null,
      files.logo_ar && files.logo_ar.length > 0 ? files.logo_ar[0] : null,
      files.heroBackground && files.heroBackground.length > 0 ? files.heroBackground[0] : null
    );

    // Trigger revalidation of homepage cache
    try {
      const webUrl = process.env.WEB_URL || 'http://localhost:3000';
      const revalidateSecret = process.env.REVALIDATE_SECRET || 'genoun-revalidate-secret';
      
      await fetch(`${webUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: revalidateSecret,
          all: true
        })
      });
    } catch (revalidateError) {
      // Log but don't fail the request if revalidation fails
      console.error('Failed to trigger cache revalidation:', revalidateError);
    }

    return ApiResponse.success(res, settings, "Settings updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Test email connection
// @route   POST /api/settings/email/test-connection
// @access  Private/Admin
export const testEmailConnection = async (req, res, next) => {
  try {
    await emailService.initialize();
    return ApiResponse.success(res, null, "Email connection successful");
  } catch (error) {
    next(error);
  }
};

// @desc    Test email notification
// @route   POST /api/settings/email/test-notification
// @access  Private/Admin
export const testEmailNotification = async (req, res, next) => {
  try {
    const { email } = req.body;
    await emailService.sendEmail(
      email,
      "Test Notification",
      "<h1>Success!</h1><p>Your email configuration is working correctly.</p>"
    );
    return ApiResponse.success(res, null, "Test email sent successfully");
  } catch (error) {
    next(error);
  }
};

// Email Template methods
export const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await emailTemplateService.getAllTemplates();
    return ApiResponse.success(res, templates, "Email templates retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const getTemplateByName = async (req, res, next) => {
  try {
    const template = await emailTemplateService.getTemplateByName(req.params.name);
    return ApiResponse.success(res, template, "Email template retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const saveTemplate = async (req, res, next) => {
  try {
    const template = await emailTemplateService.saveTemplate(req.body);
    return ApiResponse.success(res, template, "Email template saved successfully");
  } catch (error) {
    next(error);
  }
};
