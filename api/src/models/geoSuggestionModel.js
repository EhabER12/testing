import mongoose from "mongoose";

const geoSuggestionSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.ObjectId,
      ref: "Article",
      required: true,
      index: true,
    },

    // Type of optimization
    type: {
      type: String,
      enum: [
        "missing_keyword", // Classic SEO: Keyword gap
        "direct_answer", // GEO: Optimize for AI Direct Answers/Snippets
        "internal_link", // Topic Cluster: Missing internal link
        "structured_data", // Schema: Missing JSON-LD
        "content_expansion", // Topic Authority: Content too thin
        "geo_targeting", // Local SEO: Missing location context
      ],
      required: true,
    },

    // Priority for the user
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    // "Why are we suggesting this?" (e.g., "Keyword 'Salla' has 5k impressions but is missing.")
    reasoning: {
      type: String,
      required: true,
    },

    // Technical data or content diff
    data: {
      // For keyword/content:
      originalContent: String,
      suggestedContent: String, // The new paragraph/section
      targetKeyword: String,

      // For links:
      targetArticleId: mongoose.Schema.ObjectId,
      anchorText: String,

      // For schema:
      schemaType: String,
      schemaJson: Object,
    },

    // Admin Review Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "applied"],
      default: "pending",
      index: true,
    },

    // Feedback or rejection reason
    adminFeedback: String,
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

const GeoSuggestion = mongoose.model("GeoSuggestion", geoSuggestionSchema);

export default GeoSuggestion;
