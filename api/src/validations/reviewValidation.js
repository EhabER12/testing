import Joi from "joi";

export const createReviewSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().optional(),
    serviceId: Joi.string().optional(),
    name: Joi.string().required(),
    email: Joi.string().email().optional().allow(""),
    phone: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required(),
  }),
});

export const updateReviewSchema = Joi.object({
  body: Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    phone: Joi.string(),
    rating: Joi.number().min(1).max(5),
    comment: Joi.string(),
    status: Joi.string().valid("pending", "approved", "rejected"),
  }),
});

export const rejectReviewSchema = Joi.object({
  body: Joi.object({
    reason: Joi.string(),
  }),
});
