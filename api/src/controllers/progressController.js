import progressService from "../services/progressService.js";

// Enroll in a course
export const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await progressService.enrollInCourse(userId, courseId);

    res.status(201).json({
      success: true,
      message: "Enrolled successfully",
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

// Get user progress for a course
export const getUserProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    let progress = await progressService.getUserProgress(userId, courseId);

    // If no progress, try to get or create one (auto-enroll for free courses)
    if (!progress) {
      try {
        progress = await progressService.enrollInCourse(userId, courseId);
      } catch (enrollError) {
        // If can't enroll (e.g. paid course), return empty progress structure
        // This ensures the student doesn't get "enrolled" status for free
        return res.status(200).json({
          success: true,
          data: null, // Return null data instead of fake progress object
          message: enrollError.message || "Not enrolled in this course"
        });
      }
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

// Get all user enrollments
export const getUserEnrollments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { isCompleted } = req.query;

    const filters = {};
    if (isCompleted !== undefined) {
      filters.isCompleted = isCompleted === "true";
    }

    const enrollments = await progressService.getUserEnrollments(
      userId,
      filters
    );

    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

// Mark lesson as completed
export const markLessonCompleted = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user._id;

    console.log('markLessonCompleted called:', { userId, courseId, lessonId });

    let progress;
    try {
      progress = await progressService.markLessonCompleted(
        userId,
        courseId,
        lessonId
      );
      console.log('Progress updated:', progress);
    } catch (markError) {
      console.error('markLessonCompleted error:', markError);
      return res.status(400).json({
        success: false,
        message: markError.message || "Could not mark lesson as completed",
      });
    }

    res.status(200).json({
      success: true,
      message: progress.isCompleted
        ? "Congratulations! Course completed!"
        : "Lesson marked as completed",
      data: progress,
    });
  } catch (error) {
    console.error('markLessonCompleted outer error:', error);
    next(error);
  }
};

// Update current lesson
export const updateCurrentLesson = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user._id;

    let progress;
    try {
      progress = await progressService.updateCurrentLesson(
        userId,
        courseId,
        lessonId
      );
    } catch (updateError) {
      // If can't update (e.g., course not found), return empty response
      return res.status(200).json({
        success: true,
        data: {
          userId,
          courseId,
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

// Reset progress
export const resetProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await progressService.resetProgress(userId, courseId);

    res.status(200).json({
      success: true,
      message: "Progress reset successfully",
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

// Get course progress statistics (Admin/Teacher)
export const getCourseProgressStats = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const stats = await progressService.getCourseProgressStats(courseId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get students progress for a course (Admin/Teacher)
export const getStudentsProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { isCompleted } = req.query;

    const filters = {};
    if (isCompleted !== undefined) {
      filters.isCompleted = isCompleted === "true";
    }

    const progress = await progressService.getStudentsProgress(
      courseId,
      filters
    );

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};
