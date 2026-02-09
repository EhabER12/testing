import express from "express";
import {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  approveReview,
  rejectReview,
  getUserReviews,
  getCourseReviews,
  getUserCourseReview,
} from "../controllers/reviewController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { uploadMultiple } from "../middlewares/uploadMiddleware.js";
import { imagePathMiddleware } from "../middlewares/imagePathMiddleware.js";

const router = express.Router();

// Apply image path middleware
router.use(imagePathMiddleware);

// Public routes
router.get("/", getAllReviews);
router.get("/course/:courseId", getCourseReviews);
router.get("/:id", getReviewById);

// Protected routes
router.get("/my-reviews", protect, getUserReviews);
router.get("/course/:courseId/my-review", protect, getUserCourseReview);

router.post(
  "/",
  protect,
  uploadMultiple("images", 5),
  createReview
);

// Admin routes
router.put(
  "/:id",
  protect,
  authorize("admin", "moderator"),
  uploadMultiple("images", 5),
  updateReview
);

router.patch(
  "/:id/approve",
  protect,
  authorize("admin", "moderator"),
  approveReview
);

router.patch(
  "/:id/reject",
  protect,
  authorize("admin", "moderator"),
  rejectReview
);

export default router;
