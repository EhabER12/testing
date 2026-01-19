import express from "express";
import {
  getDashboardStats,
  getRecentActivity,
  getAnalytics,
  getPageAnalytics,
  getProductAnalytics,
  getTeacherStats,
} from "../controllers/dashboardController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Global Stats (Admin/Moderator)
router.get("/stats", authorize("admin", "moderator"), getDashboardStats);
router.get("/activity", authorize("admin", "moderator"), getRecentActivity);
router.get("/analytics", authorize("admin", "moderator"), getAnalytics);
router.get("/analytics/page", authorize("admin", "moderator"), getPageAnalytics);
router.get("/products/analytics", authorize("admin", "moderator"), getProductAnalytics);

// Teacher Specific Stats
router.get("/teacher-stats", authorize("teacher"), getTeacherStats);

export default router;
