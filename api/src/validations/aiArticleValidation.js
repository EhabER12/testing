import Joi from "joi";

// Settings validation schema
export const settingsSchema = Joi.object({
  promptTemplate: Joi.string().min(50).max(5000),
  numberOfParagraphs: Joi.number().integer().min(2).max(20),
  averageWordsPerParagraph: Joi.number().integer().min(50).max(500),
  targetKeywords: Joi.array().items(Joi.string().trim().max(100)),
  language: Joi.string().valid("ar", "en"),
  includeImages: Joi.boolean(),
  includeCoverImage: Joi.boolean(),
  imageSearchKeywords: Joi.array().items(Joi.string().trim().max(100)),
  autoPublish: Joi.boolean(),
  totalArticlesNeeded: Joi.number().integer().min(1).max(1000),
  articlesPerDay: Joi.number().integer().min(1).max(10),
  startDate: Joi.date().iso(),
  generationTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm format
  whatsappNotificationNumbers: Joi.array().items(
    Joi.string().pattern(/^\+?\d{10,15}$/) // Phone number pattern
  ),
  notifyOnCompletion: Joi.boolean(),
  isActive: Joi.boolean(),
});

// Titles validation schema
export const addTitlesSchema = Joi.object({
  titles: Joi.array()
    .items(Joi.string().trim().min(5).max(200))
    .min(1)
    .max(100)
    .required(),
});

// Test prompt validation schema
export const testPromptSchema = Joi.object({
  promptTemplate: Joi.string().min(50).max(5000),
  sampleTitle: Joi.string().trim().min(5).max(200),
  settings: Joi.object({
    numberOfParagraphs: Joi.number().integer().min(2).max(20),
    averageWordsPerParagraph: Joi.number().integer().min(50).max(500),
    targetKeywords: Joi.array().items(Joi.string()),
    language: Joi.string().valid("ar", "en"),
  }),
});

// Generate now validation schema
export const generateNowSchema = Joi.object({
  count: Joi.number().integer().min(1).max(10).default(1),
});

// Test WhatsApp validation schema
export const testWhatsappSchema = Joi.object({
  number: Joi.string()
    .pattern(/^\+?\d{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),
});

// Reset validation schema
export const resetSchema = Joi.object({
  resetTitles: Joi.boolean().default(false),
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: errorMessages,
        },
      });
    }

    req.body = value;
    next();
  };
};
