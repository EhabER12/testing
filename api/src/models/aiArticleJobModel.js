import mongoose from "mongoose";

const aiArticleJobSchema = new mongoose.Schema(
  {
    // Reference to settings
    settings: {
      type: mongoose.Schema.ObjectId,
      ref: "AiArticleSettings",
      required: true,
    },

    // Title used for this job
    titleUsed: {
      type: String,
      required: true,
    },
    titleId: {
      type: mongoose.Schema.ObjectId,
    },

    // Scheduling
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },

    // Result
    articleId: {
      type: mongoose.Schema.ObjectId,
      ref: "Article",
    },

    // Execution details
    executedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    executionTimeMs: {
      type: Number,
    },

    // Error handling
    error: {
      type: String,
    },
    errorStack: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },

    // Notification status
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationSentAt: {
      type: Date,
    },
    notificationError: {
      type: String,
    },

    // Generated content (for debugging/preview)
    generatedContent: {
      title: String,
      excerpt: String,
      contentLength: Number,
      imageUrls: [String],
    },

    // Batch tracking (for daily summaries)
    batchId: {
      type: String,
      index: true,
    },
    batchIndex: {
      type: Number,
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

// Index for finding pending jobs
aiArticleJobSchema.index({ status: 1, scheduledFor: 1 });

// Index for batch notifications
aiArticleJobSchema.index({ batchId: 1, status: 1 });

// Static method to get pending jobs
aiArticleJobSchema.statics.getPendingJobs = async function (limit = 10) {
  return this.find({
    status: "pending",
    scheduledFor: { $lte: new Date() },
  })
    .sort({ scheduledFor: 1 })
    .limit(limit)
    .populate("settings");
};

// Static method to get jobs by batch
aiArticleJobSchema.statics.getJobsByBatch = async function (batchId) {
  return this.find({ batchId }).sort({ batchIndex: 1 });
};

// Static method to check if batch is complete
aiArticleJobSchema.statics.isBatchComplete = async function (batchId) {
  const pendingOrInProgress = await this.countDocuments({
    batchId,
    status: { $in: ["pending", "in_progress"] },
  });
  return pendingOrInProgress === 0;
};

// Method to mark as in progress
aiArticleJobSchema.methods.markInProgress = async function () {
  this.status = "in_progress";
  this.executedAt = new Date();
  await this.save();
};

// Method to mark as completed
aiArticleJobSchema.methods.markCompleted = async function (articleId, content) {
  this.status = "completed";
  this.articleId = articleId;
  this.completedAt = new Date();
  this.executionTimeMs = this.completedAt - this.executedAt;
  if (content) {
    this.generatedContent = {
      title: content.title,
      excerpt: content.excerpt,
      contentLength: content.content?.length || 0,
      imageUrls: content.imageUrls || [],
    };
  }
  await this.save();
};

// Method to mark as failed
aiArticleJobSchema.methods.markFailed = async function (error) {
  this.status = "failed";
  this.error = error.message || String(error);
  this.errorStack = error.stack;
  this.completedAt = new Date();
  this.executionTimeMs = this.executedAt
    ? this.completedAt - this.executedAt
    : 0;
  await this.save();
};

// Method to retry job
aiArticleJobSchema.methods.retry = async function () {
  if (this.retryCount >= this.maxRetries) {
    return false;
  }
  this.retryCount += 1;
  this.status = "pending";
  this.error = null;
  this.errorStack = null;
  await this.save();
  return true;
};

const AiArticleJob = mongoose.model("AiArticleJob", aiArticleJobSchema);

export default AiArticleJob;
