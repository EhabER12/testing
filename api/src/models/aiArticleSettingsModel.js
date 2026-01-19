import mongoose from "mongoose";

const readyTitleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  articleId: {
    type: mongoose.Schema.ObjectId,
    ref: "Article",
  },
});

const aiArticleSettingsSchema = new mongoose.Schema(
  {
    // Prompt configuration
    promptTemplate: {
      type: String,
      required: [true, "Prompt template is required"],
      default: `Role & Mindset (Mandatory):
You are a senior content strategist and professional human writer, not an AI.
Write as if you have real-world experience, editorial judgment, and market awareness.
Avoid generic phrasing, filler language, robotic transitions, or predictable AI patterns.
Your writing must sound naturally human, confident, persuasive, and commercially aware, suitable for a senior Saudi / GCC market audience.

Task:
Write a high-quality, professional blog article about:
Title: {{title}}

Language & Audience:
- Write in {{language}}
- Target a senior, educated, decision-making audience
- Assume readers are knowledgeable and expect depth, clarity, and authority

Content Structure Requirements:
- Total paragraphs: {{paragraphs}}
- Each paragraph: approximately {{wordsPerParagraph}} words
- Include a strong introduction that establishes context, relevance, and value
- Include a clear conclusion that reinforces insights and leaves a lasting impression
- Use a logical narrative flow, not formulaic blog structure

SEO & Keyword Strategy:
- Naturally integrate these keywords without forced repetition: {{keywords}}
- Use semantic variations, synonyms, and contextual phrasing
- Optimize for search intent, not keyword stuffing
- Content must be SEO-friendly but editorial-grade, as if written for a premium publication

Headings & Formatting:
- Use proper heading hierarchy (H2 for main sections, H3 for subsections)
- Headings must be informative and compelling, not generic
- Paragraphs should be scannable, well-paced, and varied in sentence length
- Use bullet points only when they add clarity, not as filler

Tone & Style Guidelines:
- Professional, authoritative, and engaging
- Write like a human expert, not a content generator
- Avoid: Overused AI phrases ("In today's fast-paced world", "Moreover", "Furthermore"), repetitive sentence structures, over-explaining obvious concepts
- Include: Natural transitions, subtle persuasion, confident experience-based language

Human Authenticity Rules (Critical):
- Vary sentence rhythm and paragraph length
- Show judgment: emphasize what matters, skip what doesn't
- Do not sound neutral or generic — sound intentional
- Write as if this article reflects your personal professional reputation

Quality Benchmark:
The final article should feel like it was written by a senior SEO consultant, content director, or subject-matter expert — not by an AI or entry-level writer.`,
    },

    // Article configuration
    numberOfParagraphs: {
      type: Number,
      default: 5,
      min: 2,
      max: 20,
    },
    averageWordsPerParagraph: {
      type: Number,
      default: 150,
      min: 50,
      max: 500,
    },
    targetKeywords: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      enum: ["ar", "en"],
      default: "ar",
    },

    // Ready titles management
    readyTitles: [readyTitleSchema],

    // Image settings
    includeImages: {
      type: Boolean,
      default: true,
    },
    includeCoverImage: {
      type: Boolean,
      default: true,
    },
    imageSearchKeywords: {
      type: [String],
      default: [],
    },

    // Publishing settings
    autoPublish: {
      type: Boolean,
      default: false,
    },

    // Scheduling configuration
    totalArticlesNeeded: {
      type: Number,
      default: 10,
      min: 1,
    },
    articlesPerDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    generationTime: {
      type: String,
      default: "09:00", // HH:mm format
    },

    // WhatsApp notification
    whatsappNotificationNumbers: {
      type: [String],
      default: [],
    },
    notifyOnCompletion: {
      type: Boolean,
      default: true,
    },

    // Status tracking
    isActive: {
      type: Boolean,
      default: false,
    },
    articlesGenerated: {
      type: Number,
      default: 0,
    },
    lastGeneratedAt: {
      type: Date,
    },

    // Admin reference
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
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

// Virtual for remaining articles
aiArticleSettingsSchema.virtual("remainingArticles").get(function () {
  return Math.max(0, this.totalArticlesNeeded - this.articlesGenerated);
});

// Virtual for unused titles count
aiArticleSettingsSchema.virtual("unusedTitlesCount").get(function () {
  return this.readyTitles.filter((t) => !t.used).length;
});

// Virtual for estimated days remaining
aiArticleSettingsSchema.virtual("estimatedDaysRemaining").get(function () {
  if (this.articlesPerDay <= 0) return 0;
  return Math.ceil(this.remainingArticles / this.articlesPerDay);
});

// Virtual for progress percentage
aiArticleSettingsSchema.virtual("progressPercentage").get(function () {
  if (this.totalArticlesNeeded <= 0) return 100;
  return Math.round((this.articlesGenerated / this.totalArticlesNeeded) * 100);
});

// Static method to get or create settings
aiArticleSettingsSchema.statics.findOneOrCreate = async function (userId) {
  let settings = await this.findOne();
  if (settings) {
    return settings;
  }

  return this.create({
    createdBy: userId,
  });
};

// Method to get next available title
aiArticleSettingsSchema.methods.getNextTitle = function () {
  const unusedTitle = this.readyTitles.find((t) => !t.used);
  return unusedTitle || null;
};

// Method to mark title as used
aiArticleSettingsSchema.methods.markTitleUsed = async function (
  titleId,
  articleId
) {
  const title = this.readyTitles.id(titleId);
  if (title) {
    title.used = true;
    title.usedAt = new Date();
    title.articleId = articleId;
    await this.save();
  }
};

const AiArticleSettings = mongoose.model(
  "AiArticleSettings",
  aiArticleSettingsSchema
);

export default AiArticleSettings;
