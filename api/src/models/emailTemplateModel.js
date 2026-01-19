import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    content: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    variables: [
      {
        name: String,
        description: String,
      },
    ],
    type: {
      type: String,
      enum: ["registration", "order_confirmation", "teacher_approval", "teacher_rejection", "course_enrollment", "certificate_issued", "password_reset", "custom"],
      default: "custom",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);

export default EmailTemplate;
