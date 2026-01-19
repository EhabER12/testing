import { SettingsRepository } from "../repositories/settingsRepository.js";
import { ApiError } from "../utils/apiError.js";
import crypto from "crypto";

export class ManualPaymentMethodController {
  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  async getAllMethods(req, res, next) {
    try {
      const settings = await this.settingsRepository.getSettings();
      const methods = settings.paymentGateways.manualMethods || [];

      // Only return enabled methods for public access
      const enabledMethods = req.user
        ? methods
        : methods.filter((m) => m.isEnabled);

      res.status(200).json({
        success: true,
        methods: enabledMethods.sort((a, b) => a.order - b.order),
      });
    } catch (error) {
      next(error);
    }
  }

  async createMethod(req, res, next) {
    try {
      let {
        title,
        description,
        isEnabled,
        requiresAttachment,
        instructions,
        order,
      } = req.body;

      // Parse JSON strings from form-data (multipart sends objects as strings)
      if (typeof title === "string") {
        try {
          title = JSON.parse(title);
        } catch (e) {
          /* keep as is */
        }
      }
      if (typeof description === "string") {
        try {
          description = JSON.parse(description);
        } catch (e) {
          /* keep as is */
        }
      }
      if (typeof instructions === "string") {
        try {
          instructions = JSON.parse(instructions);
        } catch (e) {
          /* keep as is */
        }
      }
      // Parse boolean strings from form-data
      if (typeof isEnabled === "string") {
        isEnabled = isEnabled === "true";
      }
      if (typeof requiresAttachment === "string") {
        requiresAttachment = requiresAttachment === "true";
      }
      if (typeof order === "string") {
        order = parseInt(order, 10);
      }

      if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
      }

      const settings = await this.settingsRepository.getSettings();

      const newMethod = {
        id: crypto.randomUUID(),
        title,
        description,
        imageUrl: req.file ? req.file.path : "",
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        requiresAttachment:
          requiresAttachment !== undefined ? requiresAttachment : true,
        instructions: instructions || "",
        order:
          order !== undefined
            ? order
            : settings.paymentGateways.manualMethods.length,
      };

      settings.paymentGateways.manualMethods.push(newMethod);
      await settings.save();

      res.status(201).json({
        success: true,
        message: "Manual payment method created successfully",
        method: newMethod,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMethod(req, res, next) {
    try {
      const { id } = req.params;
      let {
        title,
        description,
        isEnabled,
        requiresAttachment,
        instructions,
        order,
      } = req.body;

      // Parse JSON strings from form-data (multipart sends objects as strings)
      if (typeof title === "string") {
        try {
          title = JSON.parse(title);
        } catch (e) {
          /* keep as is */
        }
      }
      if (typeof description === "string") {
        try {
          description = JSON.parse(description);
        } catch (e) {
          /* keep as is */
        }
      }
      if (typeof instructions === "string") {
        try {
          instructions = JSON.parse(instructions);
        } catch (e) {
          /* keep as is */
        }
      }
      // Parse boolean strings from form-data
      if (typeof isEnabled === "string") {
        isEnabled = isEnabled === "true";
      }
      if (typeof requiresAttachment === "string") {
        requiresAttachment = requiresAttachment === "true";
      }
      if (typeof order === "string") {
        order = parseInt(order, 10);
      }

      const settings = await this.settingsRepository.getSettings();
      const methodIndex = settings.paymentGateways.manualMethods.findIndex(
        (m) => m.id === id
      );

      if (methodIndex === -1) {
        throw new ApiError(404, "Payment method not found");
      }

      const updatedMethod = {
        ...settings.paymentGateways.manualMethods[methodIndex].toObject(),
        title:
          title || settings.paymentGateways.manualMethods[methodIndex].title,
        description:
          description ||
          settings.paymentGateways.manualMethods[methodIndex].description,
        imageUrl: req.file
          ? req.file.path
          : settings.paymentGateways.manualMethods[methodIndex].imageUrl,
        isEnabled:
          isEnabled !== undefined
            ? isEnabled
            : settings.paymentGateways.manualMethods[methodIndex].isEnabled,
        requiresAttachment:
          requiresAttachment !== undefined
            ? requiresAttachment
            : settings.paymentGateways.manualMethods[methodIndex]
                .requiresAttachment,
        instructions:
          instructions !== undefined
            ? instructions
            : settings.paymentGateways.manualMethods[methodIndex].instructions,
        order:
          order !== undefined
            ? order
            : settings.paymentGateways.manualMethods[methodIndex].order,
      };

      settings.paymentGateways.manualMethods[methodIndex] = updatedMethod;
      await settings.save();

      res.status(200).json({
        success: true,
        message: "Manual payment method updated successfully",
        method: updatedMethod,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleMethod(req, res, next) {
    try {
      const { id } = req.params;
      const { isEnabled } = req.body;

      if (isEnabled === undefined) {
        throw new ApiError(400, "isEnabled field is required");
      }

      const settings = await this.settingsRepository.getSettings();
      const method = settings.paymentGateways.manualMethods.find(
        (m) => m.id === id
      );

      if (!method) {
        throw new ApiError(404, "Payment method not found");
      }

      method.isEnabled = isEnabled;
      await settings.save();

      res.status(200).json({
        success: true,
        message: "Payment method status updated successfully",
        method,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMethod(req, res, next) {
    try {
      const { id } = req.params;

      const settings = await this.settingsRepository.getSettings();
      const initialLength = settings.paymentGateways.manualMethods.length;

      settings.paymentGateways.manualMethods =
        settings.paymentGateways.manualMethods.filter((m) => m.id !== id);

      if (settings.paymentGateways.manualMethods.length === initialLength) {
        throw new ApiError(404, "Payment method not found");
      }

      await settings.save();

      res.status(200).json({
        success: true,
        message: "Manual payment method deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
