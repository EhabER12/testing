import Quiz from "../models/quizModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";
import Progress from "../models/progressModel.js";
import Course from "../models/courseModel.js";
import Section from "../models/sectionModel.js";
import notificationService from "./notificationService.js";

class QuizService {
  // Helper to clean bilingual objects
  _cleanBilingual(obj) {
    if (!obj) return undefined;
    const hasAr = typeof obj.ar === "string" && obj.ar.trim().length > 0;
    const hasEn = typeof obj.en === "string" && obj.en.trim().length > 0;

    if (!hasAr && !hasEn) return undefined;

    // If one is missing, use the other as fallback to satisfy 'required: true' in sub-schema
    const cleanObj = {
      ar: hasAr ? obj.ar : obj.en,
      en: hasEn ? obj.en : obj.ar,
    };

    return cleanObj;
  }

  // Create Quiz (Admin/Teacher)
  async createQuiz(data, createdBy) {
    // Handle empty strings for optional IDs
    if (data.sectionId === "" || data.sectionId === null) {
      delete data.sectionId;
    }
    if (data.courseId === "" || data.courseId === null) {
      delete data.courseId;
    }

    // Clean bilingual fields
    if (data.title) data.title = this._cleanBilingual(data.title);
    if (data.description) data.description = this._cleanBilingual(data.description);

    if (data.questions) {
      data.questions = data.questions.map((q) => {
        const cleanedQ = { ...q };
        cleanedQ.questionText = this._cleanBilingual(q.questionText);
        cleanedQ.explanation = this._cleanBilingual(q.explanation);
        if (q.choices) {
          cleanedQ.choices = q.choices.map((c) => this._cleanBilingual(c));
        }
        return cleanedQ;
      });
    }

    const quiz = await Quiz.create({
      ...data,
      createdBy,
    });

    return quiz;
  }

  // Get Quiz by Slug (Public)
  async getQuizBySlug(slug, includeAnswers = false) {
    const quizDoc = await Quiz.findOne({ slug, isPublished: true })
      .populate("createdBy", "fullName");

    if (!quizDoc) {
      throw new Error("Quiz not found");
    }

    const quiz = quizDoc.toJSON();

    if (!includeAnswers) {
      quiz.questions = quiz.questions.map((q) => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    return quiz;
  }

  // Get Quiz by ID
  async getQuizById(quizId, includeAnswers = false) {
    const quizDoc = await Quiz.findById(quizId)
      .populate("courseId", "title slug")
      .populate("sectionId", "title")
      .populate("createdBy", "fullName email");

    if (!quizDoc) {
      throw new Error("Quiz not found");
    }

    const quiz = quizDoc.toJSON();

    // Remove correct answers if student is viewing
    if (!includeAnswers) {
      quiz.questions = quiz.questions.map((q) => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    return quiz;
  }

  // Get all quizzes for a course
  async getQuizzesByCourse(courseId) {
    const quizzes = await Quiz.find({ courseId, isPublished: true }, "-questions")
      .populate("sectionId", "title order")
      .sort({ createdAt: 1 });

    return quizzes;
  }

  // Get all quizzes for a section
  async getQuizzesBySection(sectionId) {
    const quizzes = await Quiz.find({ sectionId, isPublished: true }, "-questions").sort({
      createdAt: 1,
    });

    return quizzes;
  }

  // Get all quizzes for courses the user is enrolled in
  async getMyQuizzes(userId) {
    const enrollments = await Progress.find({ userId }).select("courseId");
    const courseIds = enrollments.map((e) => e.courseId);

    if (courseIds.length === 0) {
      return [];
    }

    const quizzes = await Quiz.find({ 
      courseId: { $in: courseIds }, 
      isPublished: true 
    }, "-questions")
      .populate("courseId", "title slug")
      .populate("sectionId", "title order")
      .sort({ createdAt: -1 });

    // Fetch best attempts for these quizzes
    const quizIds = quizzes.map(q => q._id);
    const attempts = await QuizAttempt.find({ 
      userId, 
      quizId: { $in: quizIds } 
    }).sort({ score: -1 });

    // Attach best attempt to each quiz
    const quizzesWithAttempts = quizzes.map(quiz => {
      const quizJson = quiz.toJSON();
      const userAttempts = attempts.filter(a => a.quizId.toString() === quiz._id.toString());
      
      quizJson.userBestAttempt = userAttempts[0] || null;
      quizJson.userAttemptsCount = userAttempts.length;
      
      return quizJson;
    });

    return quizzesWithAttempts;
  }

  // Update Quiz
  async updateQuiz(quizId, updates, userId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Handle empty sectionId
    if (updates.sectionId === "" || updates.sectionId === null) {
      updates.sectionId = null;
    }
    if (updates.courseId === "" || updates.courseId === null) {
      updates.courseId = null;
    }

    // Clean bilingual fields
    if (updates.title) updates.title = this._cleanBilingual(updates.title);
    if (updates.description) updates.description = this._cleanBilingual(updates.description);

    if (updates.questions) {
      updates.questions = updates.questions.map((q) => {
        const cleanedQ = { ...q };
        cleanedQ.questionText = this._cleanBilingual(q.questionText);
        cleanedQ.explanation = this._cleanBilingual(q.explanation);
        if (q.choices) {
          cleanedQ.choices = q.choices.map((c) => this._cleanBilingual(c));
        }
        return cleanedQ;
      });
    }

    const oldPublished = quiz.isPublished;
    
    // Update quiz
    Object.keys(updates).forEach((key) => {
      quiz[key] = updates[key];
    });

    quiz.updatedBy = userId;
    await quiz.save();

    // If newly published, notify enrolled students
    if (!oldPublished && quiz.isPublished) {
      try {
        // Get enrolled students
        const progressList = await Progress.find({ courseId: quiz.courseId }).select("userId");
        const studentIds = progressList.map(p => p.userId);
        
        for (const studentId of studentIds) {
          await notificationService.notifyQuizAssigned(studentId, quiz);
        }
      } catch (notifError) {
        console.log("Failed to notify students about new quiz:", notifError.message);
      }
    }

    return quiz;
  }

  // Delete Quiz
  async deleteQuiz(quizId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Check if there are attempts
    const attemptsCount = await QuizAttempt.countDocuments({ quizId });
    if (attemptsCount > 0) {
      throw new Error(
        "Cannot delete quiz with existing attempts. Archive it instead."
      );
    }

    await quiz.deleteOne();
    return { message: "Quiz deleted successfully" };
  }

  // Submit Quiz Attempt
  async submitQuizAttempt(userId, quizId, answers) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (!quiz.isPublished) {
      throw new Error("Quiz is not published yet");
    }

    // Check previous attempts
    const previousAttempts = await QuizAttempt.find({ userId, quizId });
    const attemptsCount = previousAttempts.length;

    if (
      quiz.attemptsAllowed &&
      quiz.attemptsAllowed > 0 &&
      attemptsCount >= quiz.attemptsAllowed
    ) {
      throw new Error(
        `Maximum attempts (${quiz.attemptsAllowed}) reached for this quiz`
      );
    }

    // Calculate score
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const gradedAnswers = answers.map((answer) => {
      const question = quiz.questions.id(answer.questionId);
      if (!question) {
        throw new Error(`Question ${answer.questionId} not found`);
      }

      totalPoints += question.points;
      const isCorrect = question.correctAnswer === answer.chosenAnswer;
      const pointsEarned = isCorrect ? question.points : 0;

      if (isCorrect) correctCount++;
      earnedPoints += pointsEarned;

      return {
        questionId: answer.questionId,
        chosenAnswer: answer.chosenAnswer,
        isCorrect,
        correctAnswer: question.correctAnswer,
        pointsEarned,
      };
    });

    // Calculate percentage
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    // Create attempt
    const attemptData = {
      userId,
      quizId,
      answers: gradedAnswers,
      score: Math.round(percentage * 100) / 100, // percentage for frontend
      percentage: Math.round(percentage * 100) / 100,
      totalPoints,
      earnedPoints,
      passed,
      attemptNumber: attemptsCount + 1,
      completedAt: new Date(),
    };

    if (quiz.courseId) {
      attemptData.courseId = quiz.courseId;
    }

    const attempt = await QuizAttempt.create(attemptData);

    // Update progress (only if tied to a course)
    if (quiz.courseId) {
      try {
        const progressService = (await import("./progressService.js")).default;
        await progressService.markQuizProgress(userId, quizId, Math.round(percentage * 100) / 100, passed, attempt._id);
      } catch (progressError) {
        console.log("Failed to update quiz progress:", progressError.message);
      }
    }

    // Update quiz stats
    quiz.stats.totalAttempts += 1;
    if (passed) quiz.stats.passedAttempts += 1;
    await quiz.save();

    return attempt;
  }

  // Get user's attempts for a quiz
  async getUserAttempts(userId, quizId) {
    const attempts = await QuizAttempt.find({ userId, quizId })
      .sort({ createdAt: -1 })
      .populate("quizId", "title passingScore");

    return attempts;
  }

  // Get best attempt for a user
  async getUserBestAttempt(userId, quizId) {
    const bestAttempt = await QuizAttempt.findOne({ userId, quizId })
      .sort({ score: -1 })
      .limit(1);

    return bestAttempt;
  }

  // Check if user can take certificate (passed all required quizzes)
  async canUserGetCertificate(userId, courseId) {
    // Get course with required quizzes
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Get progress
    const progress = await Progress.findOne({ userId, courseId });
    if (!progress || !progress.isCompleted) {
      return {
        canGet: false,
        reason: "Course not completed",
      };
    }

    // If course doesn't require certificate exam, user can get it
    if (!course.certificateSettings.requiresExam) {
      return {
        canGet: true,
        reason: "No exam required",
      };
    }

    // Check required quizzes
    const requiredQuizzes = await Quiz.find({
      courseId,
      isRequiredForCertificate: true,
      isPublished: true,
    });

    if (requiredQuizzes.length === 0) {
      return {
        canGet: true,
        reason: "No required quizzes found",
      };
    }

    // Check if user passed all required quizzes
    const failedQuizzes = [];
    for (const quiz of requiredQuizzes) {
      const bestAttempt = await this.getUserBestAttempt(userId, quiz._id);
      if (!bestAttempt || !bestAttempt.passed) {
        failedQuizzes.push(quiz.title);
      }
    }

    if (failedQuizzes.length > 0) {
      return {
        canGet: false,
        reason: "Failed required quizzes",
        failedQuizzes,
      };
    }

    return {
      canGet: true,
      reason: "All requirements met",
    };
  }

  // Get quiz statistics (Admin/Teacher)
  async getQuizStatistics(quizId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const attempts = await QuizAttempt.find({ quizId });

    const stats = {
      totalAttempts: attempts.length,
      totalPasses: attempts.filter((a) => a.passed).length,
      totalFails: attempts.filter((a) => !a.passed).length,
      averageScore:
        attempts.length > 0
          ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
          : 0,
      highestScore: attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0,
      lowestScore: attempts.length > 0 ? Math.min(...attempts.map((a) => a.score)) : 0,
      passRate:
        attempts.length > 0
          ? (attempts.filter((a) => a.passed).length / attempts.length) * 100
          : 0,
      questionStats: quiz.questions.map(q => {
        const questionAttempts = attempts.map(a => a.answers.find(ans => ans.questionId.toString() === q._id.toString())).filter(Boolean);
        const correctCount = questionAttempts.filter(ans => ans.isCorrect).length;
        return {
          questionId: q._id,
          questionText: q.questionText,
          correctRate: questionAttempts.length > 0 ? (correctCount / questionAttempts.length) * 100 : 0,
          totalAttempts: questionAttempts.length
        };
      })
    };

    return stats;
  }
}

export default new QuizService();
