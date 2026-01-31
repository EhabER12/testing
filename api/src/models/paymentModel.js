import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    studentMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentMember",
    },
    cartSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CartSession",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "EGP",
      enum: ["EGP", "SAR", "USD"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "success",
        "delivered",
        "failed",
        "refunded",
        "cancelled",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: String,
    },
    merchantOrderId: {
      type: String,
    },
    // Pricing tier information
    pricingTier: {
      tierId: {
        type: String,
      },
      people: {
        type: Number,
        min: 1,
      },
      pricePerPerson: {
        type: Number,
        min: 0,
      },
      label: {
        type: String,
      },
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    billingInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
      apartment: String,
      floor: String,
      street: String,
      building: String,
      postalCode: String,
      city: String,
      country: String,
      state: String,
    },
    // Manual payment specific fields
    manualPaymentMethodId: {
      type: String,
    },
    paymentProofUrl: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    // Admin management fields
    adminNotes: {
      type: String,
    },
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
