import mongoose from "mongoose";
import slugify from "slugify";

// Bilingual text schema for AR/EN support
const bilingualTextSchema = new mongoose.Schema(
  {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    // Basic Info
    title: {
      type: bilingualTextSchema,
      required: [true, "Course title is required"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: bilingualTextSchema,
      required: [true, "Course description is required"],
    },
    details: {
      type: bilingualTextSchema, // What you'll learn
    },

    // Category
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
      index: true,
    },

    // Visual
    thumbnail: {
      type: String,
      default: "",
    },

    // Access Control
    accessType: {
      type: String,
      enum: ["free", "paid", "byPackage"],
      default: "free",
    },
    price: {
      type: Number,
      default: 0,
    },
    compareAtPrice: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      enum: ["SAR", "EGP", "USD"],
      default: "EGP",
    },

    // Teacher profit configuration (overrides teacher and global defaults)
    teacherProfitPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Instructor
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
      index: true,
    },

    // Publishing
    isPublished: {
      type: Boolean,
      default: false,
    },
    isDraft: {
      type: Boolean,
      default: true,
    },
    publishRequestedAt: {
      type: Date,
    },
    approvalStatus: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      reason: String,
      updatedAt: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    publishApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    publishedAt: {
      type: Date,
    },

    // Certificate Settings
    certificateSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      requiresExam: {
        type: Boolean,
        default: false,
      },
      passingScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100,
      },
      examQuizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CertificateTemplate",
      },
      autoIssue: {
        type: Boolean,
        default: true,
      },
    },

    // Statistics
    stats: {
      enrolledCount: {
        type: Number,
        default: 0,
      },
      completedCount: {
        type: Number,
        default: 0,
      },
      completionRate: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
      views: {
        type: Number,
        default: 0,
      },
    },

    // Content Stats (auto-calculated)
    contentStats: {
      sectionsCount: {
        type: Number,
        default: 0,
      },
      lessonsCount: {
        type: Number,
        default: 0,
      },
      totalDuration: {
        type: Number,
        default: 0, // in minutes
      },
    },

    // SEO
    seo: {
      title: bilingualTextSchema,
      description: bilingualTextSchema,
      keywords: [String],
    },

    // Display
    order: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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
courseSchema.index({ categoryId: 1, isPublished: 1 });
courseSchema.index({ instructorId: 1, isPublished: 1 });
courseSchema.index({ isPublished: 1, isFeatured: 1 });
courseSchema.index({ slug: 1 });

// Pre-save: Generate slug if not provided
courseSchema.pre("save", function (next) {
  if (!this.slug && this.title.en) {
    this.slug = slugify(this.title.en, {
      lower: true,
      strict: true,
    });
  }
  next();
});

// Virtual: completion rate
courseSchema.virtual("completionRatePercentage").get(function () {
  if (this.stats.enrolledCount === 0) return 0;
  return Math.round((this.stats.completedCount / this.stats.enrolledCount) * 100);
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
