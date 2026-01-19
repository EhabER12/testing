import Joi from "joi";

export const updateSettingsSchema = Joi.object({
  body: Joi.object({
    siteName: Joi.string().required(),
    siteDescription: Joi.string().required(),
    socialLinks: Joi.array()
      .items(
        Joi.object({
          platform: Joi.string().required(),
          url: Joi.string().required(),
        })
      )
      .required(),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().required(),
    address: Joi.string().required(),
  }),
});
