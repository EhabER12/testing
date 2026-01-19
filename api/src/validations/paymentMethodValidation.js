import Joi from "joi";

export const createPaymentMethodSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    instructions: Joi.string().required(),
    isActive: Joi.boolean().default(true),
  }),
});

export const updatePaymentMethodSchema = Joi.object({
  body: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    instructions: Joi.string(),
    isActive: Joi.boolean(),
  }),
});

export const toggleActiveSchema = Joi.object({
  body: Joi.object({
    isActive: Joi.boolean().required(),
  }),
});
