import { TeacherProfitService } from "../services/teacherProfitService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

const profitService = new TeacherProfitService();

// Get teacher's own profit statistics
export const getMyProfitStats = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { startDate, endDate, revenueType, status } = req.query;

    const stats = await profitService.getTeacherProfitStats(teacherId, {
      startDate,
      endDate,
      revenueType,
      status,
    });

    return ApiResponse.success(res, stats, "Profit statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Admin: Get all teachers profit statistics
export const getAllTeachersProfitStats = async (req, res, next) => {
  try {
    const { startDate, endDate, revenueType } = req.query;

    const stats = await profitService.getAllTeachersProfitStats({
      startDate,
      endDate,
      revenueType,
    });

    return ApiResponse.success(res, stats, "All teachers profit statistics retrieved");
  } catch (error) {
    next(error);
  }
};

// Admin: Update teacher's custom profit percentages
export const updateTeacherProfitPercentages = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { courseSales, subscriptions } = req.body;

    const User = (await import("../models/userModel.js")).default;
    const teacher = await User.findById(teacherId);

    if (!teacher || teacher.role !== "teacher") {
      return next(new ApiError(404, "Teacher not found"));
    }

    if (!teacher.teacherInfo) {
      teacher.teacherInfo = {};
    }

    teacher.teacherInfo.customProfitPercentages = {
      courseSales: courseSales !== undefined ? courseSales : teacher.teacherInfo.customProfitPercentages?.courseSales,
      subscriptions: subscriptions !== undefined ? subscriptions : teacher.teacherInfo.customProfitPercentages?.subscriptions,
    };

    await teacher.save();

    return ApiResponse.success(res, teacher, "Teacher profit percentages updated");
  } catch (error) {
    next(error);
  }
};

// Admin: Update course-specific profit percentage
export const updateCourseProfitPercentage = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { profitPercentage } = req.body;

    const Course = (await import("../models/courseModel.js")).default;
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new ApiError(404, "Course not found"));
    }

    course.teacherProfitPercentage = profitPercentage;
    await course.save();

    return ApiResponse.success(res, course, "Course profit percentage updated");
  } catch (error) {
    next(error);
  }
};

// Admin: Get profit transactions
export const getProfitTransactions = async (req, res, next) => {
  try {
    const { teacherId, startDate, endDate, revenueType, status, page, limit } = req.query;

    const data = await profitService.getProfitTransactions(
      {
        teacherId,
        startDate,
        endDate,
        revenueType,
        status,
      },
      { page, limit }
    );

    return ApiResponse.success(res, data, "Profit transactions retrieved");
  } catch (error) {
    next(error);
  }
};

// Admin: Mark profit as paid
export const markProfitAsPaid = async (req, res, next) => {
  try {
    const { profitId } = req.params;
    const { notes } = req.body;
    const payoutProofUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const profit = await profitService.updateProfitStatus(profitId, "paid", {
      notes,
      payoutProofUrl,
    });

    return ApiResponse.success(res, profit, "Profit marked as paid");
  } catch (error) {
    next(error);
  }
};
