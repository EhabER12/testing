import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      enum: ["EGP", "SAR", "USD"],
      default: "EGP",
    },
    appliesTo: {
      type: String,
      enum: ["all", "checkout", "package"],
      default: "all",
    },
    usageLimit: {
      type: Number,
      min: 1,
      default: null,
    },
    perUserLimit: {
      type: Number,
      min: 1,
      default: null,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

couponSchema.pre("save", function (next) {
  if (
    this.discountType === "percentage" &&
    (this.discountValue <= 0 || this.discountValue > 100)
  ) {
    return next(new Error("Percentage discount must be between 0 and 100"));
  }

  if (this.discountType === "fixed" && this.discountValue <= 0) {
    return next(new Error("Fixed discount must be greater than 0"));
  }

  if (this.startsAt && this.expiresAt && this.expiresAt <= this.startsAt) {
    return next(new Error("Coupon expiry must be after start date"));
  }

  return next();
});

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, appliesTo: 1 });
couponSchema.index({ startsAt: 1, expiresAt: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
