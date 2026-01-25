import mongoose from "mongoose";

const placeholderSchema = new mongoose.Schema(
  {
    text: { type: String }, // For custom text
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    fontSize: { type: Number, default: 24 },
    fontFamily: { type: String, default: "Arial" },
    color: { type: String, default: "#000000" },
    align: { type: String, enum: ["left", "center", "right"], default: "center" },
    fontWeight: { type: String, enum: ["normal", "bold"], default: "normal" },
  },
  { _id: false }
);

const imagePlaceholderSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 100 },
  },
  { _id: false }
);

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      unique: true,
    },
    description: {
      type: String,
    },

    // Linked Package (Optional)
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },

    // Background Image
    backgroundImage: {
      type: String,
      required: [true, "Background image is required"],
    },
    width: {
      type: Number,
      default: 1200, // pixels
    },
    height: {
      type: Number,
      default: 900, // pixels
    },
    orientation: {
      type: String,
      enum: ["portrait", "landscape"],
      default: "landscape",
    },

    // Text Placeholders Positions
    placeholders: {
      studentName: placeholderSchema,
      courseName: placeholderSchema,
      issuedDate: placeholderSchema,
      certificateNumber: placeholderSchema,
      customText: [placeholderSchema],
      images: [imagePlaceholderSchema],
      signature: {
        x: { type: Number },
        y: { type: Number },
        width: { type: Number, default: 200 },
        height: { type: Number, default: 100 },
      },
    },

    // Default Settings
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Ensure only one default template
certificateTemplateSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const CertificateTemplate = mongoose.model("CertificateTemplate", certificateTemplateSchema);

export default CertificateTemplate;
