import Joi from "joi";

export const createFormSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    status: Joi.string().valid("published", "draft").default("draft"),
    fields: Joi.array()
      .items(
        Joi.object({
          id: Joi.string(),
          label: Joi.string().required(),
          type: Joi.string()
            .valid(
              "text",
              "email",
              "tel",
              "number",
              "select",
              "checkbox",
              "radio",
              "textarea",
              "date"
            )
            .required(),
          required: Joi.boolean().default(false),
          options: Joi.when("type", {
            is: Joi.string().valid("select", "checkbox", "radio"),
            then: Joi.array().items(Joi.string()).required(),
            otherwise: Joi.array().items(Joi.string()),
          }),
          placeholder: Joi.string(),
        })
      )
      .required(),
  }),
});

export const submitFormSchema = Joi.object({
  body: Joi.object({
    data: Joi.alternatives()
      .try(
        Joi.object(), 
        Joi.string() 
      )
      .required(),
  }).unknown(true), 
});
