import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
      index: true,
    },

    // Enrollment
    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    // Completed Lessons
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    completedLessonsCount: {
      type: Number,
      default: 0,
    },
    // Completed Quizzes
    completedQuizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    completedQuizzesCount: {
      type: Number,
      default: 0,
    },
    totalItemsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalLessonsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuizzesCount: {
      type: Number,
      default: 0,
    },

    // Progress Percentage
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Completion
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },

    // Exam Status (if required)
    examPassed: {
      type: Boolean,
      default: false,
    },
    examScore: {
      type: Number,
    },
    examAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizAttempt",
    },

    // Certificate Status
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
    },

    // Activity
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },

    // Time spent (in minutes)
    totalTimeSpent: {
      type: Number,
      default: 0,
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

// Compound unique index (one progress per user per course)
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Method: Mark lesson as completed
progressSchema.methods.markLessonComplete = async function (lessonId) {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    this.completedLessonsCount = this.completedLessons.length;
    
    // Calculate percentage
    const totalItems = this.totalItemsCount || (this.totalLessonsCount + this.totalQuizzesCount) || 1;
    this.percentage = Math.round(
      ((this.completedLessonsCount + this.completedQuizzesCount) / totalItems) * 100
    );
    
    // Check if completed
    if (this.percentage >= 100) {
      this.isCompleted = true;
      this.completedAt = new Date();
    }
    
    this.lastAccessedAt = new Date();
    await this.save();
  }
};

// Method: Mark quiz as completed
progressSchema.methods.markQuizComplete = async function (quizId, score, passed) {
  if (passed) {
    if (!this.completedQuizzes.includes(quizId)) {
      this.completedQuizzes.push(quizId);
      this.completedQuizzesCount = this.completedQuizzes.length;
    }
    
    // Calculate percentage
    const totalItems = this.totalItemsCount || (this.totalLessonsCount + this.totalQuizzesCount) || 1;
    this.percentage = Math.round(
      ((this.completedLessonsCount + this.completedQuizzesCount) / totalItems) * 100
    );
    
    // Check if completed
    if (this.percentage >= 100) {
      this.isCompleted = true;
      this.completedAt = new Date();
    }
    
    this.lastAccessedAt = new Date();
    await this.save();
  }
};

// Static method: Get or create progress
progressSchema.statics.getOrCreate = async function (userId, courseId, totalLessons) {
  let progress = await this.findOne({ userId, courseId });
  
  if (!progress) {
    progress = await this.create({
      userId,
      courseId,
      totalLessonsCount: totalLessons || 0,
      enrolledAt: new Date(),
    });
  }
  
  return progress;
};

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
