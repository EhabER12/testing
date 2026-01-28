import { SettingsRepository } from "../repositories/settingsRepository.js";
import { EmailService } from "./emailService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SettingsService {
  constructor() {
    this.settingsRepository = new SettingsRepository();
    this.emailService = new EmailService();
    this.uploadsDir = path.resolve(__dirname, "../../uploads");
  }

  async getSettings() {
    return this.settingsRepository.getSettings();
  }

  async getPublicSettings() {
    return this.settingsRepository.getPublicSettings();
  }

  fileExists(filePath) {
    try {
      if (!filePath) return false;
      return fs.existsSync(filePath);
    } catch (error) {
      console.error(`Error checking if file exists: ${filePath}`, error);
      return false;
    }
  }

  safeDeleteFile(filePath) {
    try {
      if (this.fileExists(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file: ${filePath}`, error);
      return false;
    }
  }

  ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  getPublicUrl(filePath) {
    if (!filePath) return null;

    const filename = path.basename(filePath);

    return `/uploads/${filename}`;
  }

  async updateSettings(
    settingsData,
    userId,
    logoFile,
    faviconFile,
    logoArFile,
    heroBackgroundFile
  ) {
    // Ensure uploads directory exists
    this.ensureUploadsDirectory();

    const jsonFields = [
      "socialLinks",
      "notifications",
      "paymentGateways",
      "headerDisplay",
      "marketingBanners",
      "theme",
      "navbarLinks",
      "homepageSections",
      "promoModal",
      "homepageBanner",
      "homepageCourses",
      "emailSettings",
      "authorityBar",
      "reviewsSettings",
      "whyGenounSettings",
      "financeSettings",
    ];
    for (const field of jsonFields) {
      if (typeof settingsData[field] === "string") {
        try {
          settingsData[field] = JSON.parse(settingsData[field]);
        } catch (error) {
          console.error(`Error parsing ${field}:`, error);
          throw new Error(`Invalid ${field} format`);
        }
      }
    }

    // Sanitize marketing banners to remove temporary IDs
    if (
      settingsData.marketingBanners &&
      Array.isArray(settingsData.marketingBanners.banners)
    ) {
      settingsData.marketingBanners.banners =
        settingsData.marketingBanners.banners.map((banner) => {
          const { _id, ...rest } = banner;
          // If _id is a temporary string (starts with 'temp-'), remove it entirely so Mongoose generates a new ObjectId
          // If it's a valid ObjectId string, keep it (or let Mongoose handle it)
          if (_id && typeof _id === "string" && _id.startsWith("temp-")) {
            return rest;
          }
          return banner;
        });
    }

    // Get current settings
    const currentSettings = await this.settingsRepository.getSettings();

    // Handle logo file if provided
    if (logoFile) {
      // Delete old logo if exists
      if (currentSettings.logo) {
        // Remove the base URL part to get the actual file path
        const oldLogoPath = currentSettings.logo.startsWith("/uploads/")
          ? path.join(this.uploadsDir, path.basename(currentSettings.logo))
          : currentSettings.logo;

        this.safeDeleteFile(oldLogoPath);
      }

      // Store the public URL path instead of the file system path
      settingsData.logo = this.getPublicUrl(logoFile.path);
    }

    // Handle ARABIC logo file if provided
    if (logoArFile) {
      // Delete old logo_ar if exists
      if (currentSettings.logo_ar) {
        const oldLogoArPath = currentSettings.logo_ar.startsWith("/uploads/")
          ? path.join(this.uploadsDir, path.basename(currentSettings.logo_ar))
          : currentSettings.logo_ar;

        this.safeDeleteFile(oldLogoArPath);
      }

      settingsData.logo_ar = this.getPublicUrl(logoArFile.path);
    }

    if (faviconFile) {
      if (currentSettings.favicon) {
        const oldFaviconPath = currentSettings.favicon.startsWith("/uploads/")
          ? path.join(this.uploadsDir, path.basename(currentSettings.favicon))
          : currentSettings.favicon;

        this.safeDeleteFile(oldFaviconPath);
      }

      settingsData.favicon = this.getPublicUrl(faviconFile.path);
    }

    // Handle Hero Background file if provided
    if (heroBackgroundFile) {
      // Initialize homepageSections if not exists in settingsData
      if (!settingsData.homepageSections) {
        settingsData.homepageSections = currentSettings.homepageSections || {};
      }
      if (!settingsData.homepageSections.hero) {
        settingsData.homepageSections.hero = currentSettings.homepageSections?.hero || {};
      }

      // Delete old background if exists
      const oldBg = currentSettings.homepageSections?.hero?.backgroundImage;
      if (oldBg) {
        const oldBgPath = oldBg.startsWith("/uploads/")
          ? path.join(this.uploadsDir, path.basename(oldBg))
          : oldBg;
        this.safeDeleteFile(oldBgPath);
      }

      settingsData.homepageSections.hero.backgroundImage = this.getPublicUrl(heroBackgroundFile.path);
    }

    return this.settingsRepository.updateSettings(settingsData, userId);
  }
}
