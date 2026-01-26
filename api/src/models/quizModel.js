import mongoose from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid";

// Bilingual text schema
const bilingualTextSchema = new mongoose.Schema(
  {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

// Question schema
const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: bilingualTextSchema,
      required: [true, "Question text is required"],
    },
    type: {
      type: String,
      enum: ["mcq", "true_false"],
      default: "mcq",
    },
    choices: [bilingualTextSchema],
    correctAnswer: {
      type: Number, // index of correct choice
      required: [true, "Correct answer is required"],
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
    explanation: {
      type: bilingualTextSchema, // Optional explanation shown after answer
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: bilingualTextSchema,
      required: [true, "Quiz title is required"],
    },
    description: {
      type: bilingualTextSchema,
    },

    // Linked to Section OR Course OR General
    linkedTo: {
      type: String,
      enum: ["section", "course", "general"],
      required: true,
      default: "course",
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: function() {
        return this.linkedTo !== "general";
      },
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },

    // Settings
    passingScore: {
      type: Number,
      default: 70, // percentage
      min: 0,
      max: 100,
    },
    attemptsAllowed: {
      type: Number,
      default: null, // null = unlimited
    },
    timeLimit: {
      type: Number, // in minutes, null = no limit
      default: null,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true, // Show correct answers after submission
    },

    // Certificate Requirements
    isRequiredForCertificate: {
      type: Boolean,
      default: false,
    },

    // Questions
    questions: [questionSchema],

    // Publishing
    isPublished: {
      type: Boolean,
      default: true,
    },

    // Stats
    stats: {
      totalAttempts: {
        type: Number,
        default: 0,
      },
      passedAttempts: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
    },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
quizSchema.index({ courseId: 1, linkedTo: 1 });
quizSchema.index({ sectionId: 1 });
quizSchema.index({ slug: 1 });

// Pre-save: Generate slug for general quizzes
quizSchema.pre("save", async function (next) {
  if (this.linkedTo === "general" && !this.slug) {
    const titleSlug = slugify(this.title.en || this.title.ar, {
      lower: true,
      strict: true,
    });
    this.slug = `${titleSlug}-${nanoid(6)}`;
    this.isPublic = true; // General quizzes are public by default
  }
  next();
});

// Virtual: total points
quizSchema.virtual("totalPoints").get(function () {
  if (!this.questions) return 0;
  return this.questions.reduce((sum, q) => sum + q.points, 0);
});

// Virtual: questions count
quizSchema.virtual("questionsCount").get(function () {
  if (!this.questions) return 0;
  return this.questions.length;
});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
