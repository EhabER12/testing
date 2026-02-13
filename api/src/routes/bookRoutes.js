import { Router } from "express";
import { BookController } from "../controllers/bookController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { uploadBookAssets } from "../middlewares/uploadMiddleware.js";

const router = Router();
const bookController = new BookController();

// Public routes
router.get("/", (req, res, next) => bookController.getBooks(req, res, next));
router.get("/download/:token", (req, res, next) =>
  bookController.downloadBook(req, res, next)
);

// Protected role routes
router.get(
  "/manage/mine",
  protect,
  authorize("admin", "moderator", "teacher"),
  (req, res, next) => bookController.getMyBooks(req, res, next)
);

router.post(
  "/",
  protect,
  authorize("admin", "moderator", "teacher"),
  uploadBookAssets.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  (req, res, next) => bookController.createBook(req, res, next)
);

router.get("/manage/pending", protect, authorize("admin"), (req, res, next) =>
  bookController.getPendingBooks(req, res, next)
);

router.patch("/:id/review", protect, authorize("admin"), (req, res, next) =>
  bookController.reviewBook(req, res, next)
);

// Keep slug route at the end to avoid conflicts with /manage/* routes.
router.get("/:slug", (req, res, next) =>
  bookController.getBookBySlug(req, res, next)
);

export default router;
