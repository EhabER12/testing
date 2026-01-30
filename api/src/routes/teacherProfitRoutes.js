import express from "express";
import {
  getMyProfitStats,
  getAllTeachersProfitStats,
  updateTeacherProfitPercentages,
  updateCourseProfitPercentage,
  markProfitAsPaid,
} from "../controllers/teacherProfitController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Teacher routes
router.get("/my-stats", protect, authorize("teacher"), getMyProfitStats);

// Admin routes
router.get("/all-teachers", protect, authorize("admin"), getAllTeachersProfitStats);
router.put("/teacher/:teacherId/percentages", protect, authorize("admin"), updateTeacherProfitPercentages);
router.put("/course/:courseId/percentage", protect, authorize("admin"), updateCourseProfitPercentage);
router.put("/profit/:profitId/mark-paid", protect, authorize("admin"), markProfitAsPaid);

export default router;
