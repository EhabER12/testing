import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const certificateSchema = new mongoose.Schema(
  {
    // User & Course
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    studentMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentMember",
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: function () { return !this.packageId; }, // Required if no packageId
      index: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      index: true,
    },

    // Certificate Info
    certificateNumber: {
      type: String,
      required: [true, "Certificate number is required"],
      unique: true,
      index: true,
    },
    studentName: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    courseName: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    issuedAt: {
      type: Date,
      required: [true, "Issue date is required"],
      default: Date.now,
    },

    // Template Used
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificateTemplate",
    },

    // Generated PDF
    pdfUrl: {
      type: String,
    },
    pdfGenerated: {
      type: Boolean,
      default: false,
    },

    // Issuance Info
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isBulkIssued: {
      type: Boolean,
      default: false,
    },
    bulkBatchId: {
      type: String, // For tracking bulk issuances
    },

    // Verification
    verificationCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },

    // Status
    status: {
      type: String,
      enum: ["issued", "revoked", "expired"],
      default: "issued",
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    revokeReason: {
      type: String,
    },

    // Metadata
    metadata: {
      examScore: Number,
      completionDate: Date,
      totalLessons: Number,
      courseDuration: Number, // in minutes
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

// Compound unique index (one certificate per user per course OR per package)
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true, partialFilterExpression: { courseId: { $exists: true }, userId: { $exists: true } } });
certificateSchema.index({ userId: 1, packageId: 1 }, { unique: true, partialFilterExpression: { packageId: { $exists: true }, userId: { $exists: true } } });
certificateSchema.index({ studentMemberId: 1, packageId: 1 }, { unique: true, partialFilterExpression: { packageId: { $exists: true }, studentMemberId: { $exists: true } } });

// Pre-save: Generate certificate number if not provided
certificateSchema.pre("save", function (next) {
  if (!this.certificateNumber) {
    const year = new Date().getFullYear();
    const randomId = uuidv4().split("-")[0].toUpperCase();
    this.certificateNumber = `CERT-${year}-${randomId}`;
  }

  if (!this.verificationCode) {
    this.verificationCode = uuidv4();
  }

  next();
});

// Method: Revoke certificate
certificateSchema.methods.revoke = async function (revokedBy, reason = "") {
  this.status = "revoked";
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokeReason = reason;
  await this.save();
};

// Static method: Verify certificate by number
certificateSchema.statics.verifyByNumber = async function (certificateNumber) {
  const certificate = await this.findOne({
    certificateNumber,
    status: "issued",
  })
    .populate("userId", "name email")
    .populate("courseId", "title");

  return certificate;
};

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
