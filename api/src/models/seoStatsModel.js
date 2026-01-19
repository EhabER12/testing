import mongoose from "mongoose";

const seoStatsSchema = new mongoose.Schema(
  {
    // Link to the article
    articleId: {
      type: mongoose.Schema.ObjectId,
      ref: "Article",
      required: true,
      index: true,
    },

    // Date of the stats snapshot
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Overall Metrics
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    position: { type: Number, default: 0 },

    // Top queries driving traffic to this page
    queries: [
      {
        query: String,
        clicks: Number,
        impressions: Number,
        ctr: Number,
        position: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find stats for a specific article on a specific date
seoStatsSchema.index({ articleId: 1, date: 1 }, { unique: true });

const SeoStats = mongoose.model("SeoStats", seoStatsSchema);

export default SeoStats;
