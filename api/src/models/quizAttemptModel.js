import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow guest attempts
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz ID is required"],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false,
      index: true,
    },

    // Answers (array of chosen answer indices)
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        chosenAnswer: {
          type: Number, // index
        },
        isCorrect: {
          type: Boolean,
        },
        correctAnswer: {
          type: Number, // index of correct choice
        },
        pointsEarned: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Score
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    earnedPoints: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Attempt Info
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    timeSpent: {
      type: Number, // in seconds
    },

    // IP and Device Info (for security)
    ipAddress: {
      type: String,
    },
    userAgent: {
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

// Compound indexes
quizAttemptSchema.index({ userId: 1, quizId: 1, attemptNumber: 1 });
quizAttemptSchema.index({ userId: 1, courseId: 1 });

// Static method to get user's best attempt for a quiz
quizAttemptSchema.statics.getBestAttempt = async function (userId, quizId) {
  return this.findOne({ userId, quizId })
    .sort({ score: -1 })
    .limit(1);
};

// Static method to get user's attempts count for a quiz
quizAttemptSchema.statics.getAttemptsCount = async function (userId, quizId) {
  return this.countDocuments({ userId, quizId });
};

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;
