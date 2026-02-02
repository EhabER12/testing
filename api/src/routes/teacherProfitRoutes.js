import express from "express";
import {
  getMyProfitStats,
  getAllTeachersProfitStats,
  updateTeacherProfitPercentages,
  updateCourseProfitPercentage,
  getProfitTransactions,
  markProfitAsPaid,
} from "../controllers/teacherProfitController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { uploadSingle } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Teacher routes
router.get("/my-stats", protect, authorize("teacher"), getMyProfitStats);

// Admin routes
router.get("/all-teachers", protect, authorize("admin"), getAllTeachersProfitStats);
router.get("/transactions", protect, authorize("admin"), getProfitTransactions);
router.put("/teacher/:teacherId/percentages", protect, authorize("admin"), updateTeacherProfitPercentages);
router.put("/course/:courseId/percentage", protect, authorize("admin"), updateCourseProfitPercentage);
router.put(
  "/profit/:profitId/mark-paid",
  protect,
  authorize("admin"),
  uploadSingle("payoutProof"),
  markProfitAsPaid
);

export default router;
