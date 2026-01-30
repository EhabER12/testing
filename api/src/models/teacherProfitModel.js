import mongoose from "mongoose";

const teacherProfitSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    revenueType: {
      type: String,
      enum: ["course_sale", "subscription"],
      required: true,
    },
    // Reference to the source
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sourceModel",
    },
    sourceModel: {
      type: String,
      enum: ["Course", "StudentMember", "TeacherGroup"],
    },
    // Financial details
    totalAmount: {
      type: Number,
      required: true,
    },
    profitPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    profitAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["EGP", "SAR", "USD"],
      required: true,
    },
    // Tracking
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
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
  }
);

// Indexes
teacherProfitSchema.index({ teacherId: 1, transactionDate: -1 });
teacherProfitSchema.index({ revenueType: 1 });
teacherProfitSchema.index({ status: 1 });

const TeacherProfit = mongoose.model("TeacherProfit", teacherProfitSchema);
export default TeacherProfit;
