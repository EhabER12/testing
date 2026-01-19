import mongoose from "mongoose";
import Progress from "../models/progressModel.js";
import Course from "../models/courseModel.js";
import Lesson from "../models/lessonModel.js";
import Section from "../models/sectionModel.js";
import Quiz from "../models/quizModel.js";
import certificateService from "./certificateService.js";
import notificationService from "./notificationService.js";

class ProgressService {
  // Enroll in a course
  async enrollInCourse(userId, courseId) {
    const { CourseService } = await import("./courseService.js");
    const courseService = new CourseService();
    return courseService.enrollStudent(courseId, userId);
  }

  // Get user progress for a course
  async getUserProgress(userId, courseId) {
    const progress = await Progress.findOne({ userId, courseId })
      .populate("courseId", "title slug thumbnail certificateSettings")
      .populate("lastAccessedLessonId", "title");

    if (!progress) {
      return null;
    }

    // Sync counts if needed
    const totalLessonsCount = await Lesson.countDocuments({ courseId });
    const totalQuizzesCount = await Quiz.countDocuments({ courseId, isPublished: true });
    const totalItemsCount = totalLessonsCount + totalQuizzesCount;

    if (
      progress.totalLessonsCount !== totalLessonsCount ||
      progress.totalQuizzesCount !== totalQuizzesCount ||
      progress.totalItemsCount !== totalItemsCount
    ) {
      progress.totalLessonsCount = totalLessonsCount;
      progress.totalQuizzesCount = totalQuizzesCount;
      progress.totalItemsCount = totalItemsCount;
      
      // Recalculate percentage
      if (progress.totalItemsCount > 0) {
        progress.percentage = Math.round(
          ((progress.completedLessonsCount + progress.completedQuizzesCount) / progress.totalItemsCount) * 100
        );
      }
      
      await progress.save();
    }

    return progress;
  }

  // Get all user enrollments
  async getUserEnrollments(userId, filters = {}) {
    const query = { userId };

    if (filters.isCompleted !== undefined) {
      query.isCompleted = filters.isCompleted;
    }

    const enrollments = await Progress.find(query)
      .populate("courseId", "title slug thumbnail instructor")
      .sort({ lastAccessedAt: -1 });

    return enrollments;
  }

  // Mark lesson as completed
  async markLessonCompleted(userId, courseId, lessonId) {
    let progress = await Progress.findOne({ userId, courseId });

    // Auto-enroll if not enrolled (only works for free courses)
    if (!progress) {
      progress = await this.enrollInCourse(userId, courseId);
    }

    // Use model method to mark lesson complete and update percentage
    await progress.markLessonComplete(lessonId);

    // Check completion
    await this._checkAndHandleCompletion(userId, courseId, progress);

    return progress;
  }

  // Mark quiz as completed
  async markQuizProgress(userId, quizId, score, passed, attemptId = null) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return null;

    let progress = await Progress.findOne({ userId, courseId: quiz.courseId });

    // Auto-enroll if not enrolled (only works for free courses)
    if (!progress) {
      progress = await this.enrollInCourse(userId, quiz.courseId);
    }

    // Use model method to mark quiz complete
    await progress.markQuizComplete(quizId, score, passed);

    // Handle exam status if it's the designated certificate exam
    const course = await Course.findById(quiz.courseId);
    const isExam = course?.certificateSettings?.examQuizId?.toString() === quizId.toString();

    if (isExam) {
      if (passed && (!progress.examScore || score > progress.examScore)) {
        progress.examPassed = true;
        progress.examScore = score;
        if (attemptId) progress.examAttemptId = attemptId;
        await progress.save();
      }
    }

    // Check completion
    await this._checkAndHandleCompletion(userId, quiz.courseId, progress);

    return progress;
  }

  // Centralized completion handler
  async _checkAndHandleCompletion(userId, courseId, progress) {
    // If already marked as completed, don't re-trigger everything
    // But we might need to if a new mandatory item was added later? 
    // Actually progress.percentage >= 100 already handles the counts.

    if (progress.percentage >= 100) {
      const course = await Course.findById(courseId);
      if (!course) return;

      // If course requires specific exam status, check it
      const needsExam = course.certificateSettings?.requiresExam;
      const examPassed = progress.examPassed;

      if (!needsExam || examPassed) {
        if (!progress.isCompleted) {
          progress.isCompleted = true;
          progress.completedAt = new Date();
          await progress.save();

          // Update course completion stats
          await Course.findByIdAndUpdate(courseId, {
            $inc: { "stats.completedCount": 1 },
          });

          // Notify course completion
          try {
            await notificationService.notifyCourseCompleted(userId, course);
          } catch (notifError) {
            console.log("Course completion notification failed:", notifError.message);
          }

          // Auto-issue certificate if enabled
          if (course.certificateSettings?.enabled && course.certificateSettings?.autoIssue) {
            try {
              await certificateService.issueCertificate(userId, courseId, userId);
            } catch (certError) {
              console.log("Certificate auto-issue failed:", certError.message);
            }
          }
        }
      }
    }
  }

  // Update current lesson
  async updateCurrentLesson(userId, courseId, lessonId) {
    let progress = await Progress.findOne({ userId, courseId });

    // Auto-enroll if not enrolled (only works for free courses)
    if (!progress) {
      progress = await this.enrollInCourse(userId, courseId);
    }

    progress.lastAccessedLessonId = lessonId;
    progress.lastAccessedAt = new Date();
    await progress.save();

    return progress;
  }

  // Reset progress
  async resetProgress(userId, courseId) {
    const progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      throw new Error("Progress not found");
    }

    progress.completedLessons = [];
    progress.completedLessonsCount = 0;
    progress.completedQuizzes = [];
    progress.completedQuizzesCount = 0;
    progress.percentage = 0;
    progress.isCompleted = false;
    progress.completedAt = null;
    progress.lastAccessedLessonId = null;
    progress.examPassed = false;
    progress.examScore = null;
    progress.examAttemptId = null;
    
    await progress.save();

    return progress;
  }

  // Get course progress statistics (Admin/Teacher)
  async getCourseProgressStats(courseId) {
    const totalEnrollments = await Progress.countDocuments({ courseId });
    const completedEnrollments = await Progress.countDocuments({
      courseId,
      isCompleted: true,
    });

    const avgProgress = await Progress.aggregate([
      { $match: { courseId } },
      {
        $group: {
          _id: null,
          averagePercentage: { $avg: "$percentage" },
        },
      },
    ]);

    return {
      totalEnrollments,
      completedEnrollments,
      completionRate:
        totalEnrollments > 0
          ? (completedEnrollments / totalEnrollments) * 100
          : 0,
      averageProgress:
        avgProgress.length > 0 ? avgProgress[0].averagePercentage : 0,
    };
  }

  // Get students progress for a course (Admin/Teacher)
  async getStudentsProgress(courseId, filters = {}) {
    const query = { courseId };

    if (filters.isCompleted !== undefined) {
      query.isCompleted = filters.isCompleted;
    }

    const progress = await Progress.find(query)
      .populate("userId", "fullName email avatar")
      .sort({ enrolledAt: -1 });

    return progress;
  }
}

export default new ProgressService();
