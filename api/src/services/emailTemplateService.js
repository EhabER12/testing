import EmailTemplate from "../models/emailTemplateModel.js";
import { EmailService } from "./emailService.js";
import { ApiError } from "../utils/apiError.js";
import logger from "../utils/logger.js";

class EmailTemplateService {
  constructor() {
    this.emailService = new EmailService();
  }

  // Get all templates
  async getAllTemplates() {
    return EmailTemplate.find().sort({ createdAt: -1 });
  }

  // Get template by name
  async getTemplateByName(name) {
    const template = await EmailTemplate.findOne({ name });
    if (!template) {
      throw new ApiError(404, `Email template '${name}' not found`);
    }
    return template;
  }

  // Create or update template
  async saveTemplate(data) {
    const { name } = data;
    return EmailTemplate.findOneAndUpdate({ name }, data, {
      upsert: true,
      new: true,
      runValidators: true,
    });
  }

  // Send email using a template
  async sendTemplatedEmail(to, templateName, variables = {}, lang = "ar") {
    try {
      const template = await this.getTemplateByName(templateName);
      if (!template.isActive) {
        logger.warn(`Template ${templateName} is inactive, skip sending`);
        return;
      }

      let subject = template.subject[lang] || template.subject.en;
      let content = template.content[lang] || template.content.en;

      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        subject = subject.replace(regex, value);
        content = content.replace(regex, value);
      });

      await this.emailService.sendEmail(to, subject, content);
      logger.info(`Templated email '${templateName}' sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send templated email '${templateName}' to ${to}`, {
        error: error.message,
      });
      throw error;
    }
  }
}

export default new EmailTemplateService();
