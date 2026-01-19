import mongoose from "mongoose";
import slugify from "slugify";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: [true, "Please add content"],
    },
    excerpt: {
      type: String,
      maxlength: [500, "Excerpt cannot be more than 500 characters"],
    },
    coverImage: {
      type: String,
    },
    // Optional: separate hero image for detail page (falls back to coverImage if not set)
    heroImage: {
      type: String,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    // SEO & GEO (Generative Engine Optimization) Metadata
    seoData: {
      lastCheck: Date,
      clicks7d: { type: Number, default: 0 },
      impressions7d: { type: Number, default: 0 },
      avgPos7d: { type: Number, default: 0 },
      views30d: { type: Number, default: 0 },
    },

    // Optimization Flags
    aiSearchOptimized: {
      type: Boolean,
      default: false, // Has the "Direct Answer" optimization run?
    },
    topicCluster: {
      type: String, // ID or Name of the cluster group
      index: true,
    },
    targetGeo: {
      type: String, // e.g., "SA", "AE"
      index: true,
    },

    publishedAt: {
      type: Date,
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    views: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      enum: ["en", "ar"],
      default: "en",
      index: true,
    },
    // Reading time in minutes (auto-calculated)
    readingTime: {
      type: Number,
      default: 1,
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

// Create slug from name and calculate reading time
articleSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    // Custom slug generator: preserve Arabic, replace spaces with (-), remove special chars
    this.slug = this.title
      .trim()
      .toLowerCase() // No effect on Arabic, but good for Mix
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\u0600-\u06FF\u0750-\u077F\-]/g, "") // Keep words, Arabic chars, and dashes
      .replace(/-+/g, "-"); // Remove duplicate dashes
  }

  // Calculate reading time based on content
  if (this.isModified("content") && this.content) {
    const plainText = this.content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    const wordCount = plainText.trim().split(/\s+/).length;
    // Average reading speed: 200 words per minute for Arabic, 250 for English
    const wordsPerMinute = this.language === "ar" ? 200 : 250;
    this.readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  next();
});

const Article = mongoose.model("Article", articleSchema);

export default Article;
