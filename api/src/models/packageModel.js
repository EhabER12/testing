import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    // Package Name (Bilingual)
    name: {
      ar: {
        type: String,
        required: [true, "Arabic name is required"],
      },
      en: {
        type: String,
        required: [true, "English name is required"],
      },
    },

    // Package Description
    description: {
      ar: { type: String },
      en: { type: String },
    },

    // Pricing
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    currency: {
      type: String,
      enum: ["EGP", "SAR", "USD"],
      default: "EGP",
    },

    // Duration
    duration: {
      value: {
        type: Number,
        required: [true, "Duration value is required"],
      },
      unit: {
        type: String,
        enum: ["day", "week", "month", "year"],
        default: "month",
      },
    },

    // Package Limits
    limits: {
      maxStudents: {
        type: Number,
        default: null, // null = unlimited
      },
      maxSessions: {
        type: Number,
        default: null, // null = unlimited
      },
      sessionsPerWeek: {
        type: Number,
        default: null,
      },
    },

    // Features
    features: [
      {
        ar: { type: String },
        en: { type: String },
      },
    ],

    // Package Settings
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Statistics
    stats: {
      enrolledCount: {
        type: Number,
        default: 0,
      },
      activeCount: {
        type: Number,
        default: 0,
      },
      revenue: {
        type: Number,
        default: 0,
      },
    },

    // Metadata
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
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
packageSchema.index({ isActive: 1 });
packageSchema.index({ displayOrder: 1 });

// Virtual: Monthly price (for comparison)
packageSchema.virtual("monthlyPrice").get(function () {
  const multipliers = {
    day: 30,
    week: 4.33,
    month: 1,
    year: 1 / 12,
  };
  return this.price * (multipliers[this.duration.unit] || 1);
});

const Package = mongoose.model("Package", packageSchema);

export default Package;
