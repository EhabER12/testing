import express from "express";
import {
  createQuiz,
  getQuizById,
  getQuizzesByCourse,
  getQuizzesBySection,
  getMyQuizzes,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getUserAttempts,
  getUserBestAttempt,
  checkCertificateEligibility,
  getQuizStatistics,
  getAllQuizAttempts,
} from "../controllers/quizController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public/Student routes
router.get("/my/all", protect, getMyQuizzes);
router.get("/course/:courseId", protect, getQuizzesByCourse);
router.get("/section/:sectionId", protect, getQuizzesBySection);
router.get("/:id", protect, getQuizById);
router.post("/:quizId/attempt", protect, submitQuizAttempt);
router.get("/:quizId/attempts/me", protect, getUserAttempts);
router.get("/:quizId/attempts/me/best", protect, getUserBestAttempt);
router.get(
  "/certificate-eligibility/:courseId",
  protect,
  checkCertificateEligibility
);

// Admin/Teacher routes
router.post(
  "/",
  protect,
  authorize("admin", "teacher"),
  createQuiz
);
router.put(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  updateQuiz
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  deleteQuiz
);
router.get(
  "/:id/statistics",
  protect,
  authorize("admin", "teacher"),
  getQuizStatistics
);
router.get(
  "/:quizId/attempts/all",
  protect,
  authorize("admin", "teacher"),
  getAllQuizAttempts
);

export default router;
