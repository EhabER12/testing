import express from "express";
import {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  approveReview,
  rejectReview,
  getUserReviews,
} from "../controllers/reviewController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { uploadMultiple } from "../middlewares/uploadMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createReviewSchema,
  updateReviewSchema,
  rejectReviewSchema,
} from "../validations/reviewValidation.js";
import { imagePathMiddleware } from "../middlewares/imagePathMiddleware.js";

const router = express.Router();

router.use(imagePathMiddleware);

router.get("/", getAllReviews);
router.get("/my-reviews", protect, getUserReviews);
router.get("/:id", getReviewById);

router.post(
  "/",
  uploadMultiple("images", 5),
  validate(createReviewSchema),
  createReview
);

router.put(
  "/:id",
  protect,
  authorize("admin", "moderator"),
  uploadMultiple("images", 5),
  validate(updateReviewSchema),
  updateReview
);

router.post(
  "/:id/approve",
  protect,
  authorize("admin", "moderator"),
  approveReview
);

router.post(
  "/:id/reject",
  protect,
  authorize("admin", "moderator"),
  validate(rejectReviewSchema),
  rejectReview
);

export default router;
