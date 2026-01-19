import Joi from "joi";

export const createUserSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().allow("", null).optional(),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).allow("", null).optional().messages({
      "string.min": "Password must be at least 6 characters",
    }),
    role: Joi.string().valid("admin", "moderator", "user", "teacher").default("user"),
    status: Joi.string().valid("active", "inactive", "invited").default("active"),
  }).unknown(true),
});

export const updateUserSchema = Joi.object({
  body: Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    status: Joi.string().valid("active", "inactive"),
  }),
});

export const updateUserRoleSchema = Joi.object({
  body: Joi.object({
    role: Joi.string().valid("admin", "moderator", "user", "teacher").required(),
  }),
});
