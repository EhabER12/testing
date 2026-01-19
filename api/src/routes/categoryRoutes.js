import { Router } from "express";
import { CategoryController } from "../controllers/categoryController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { imagePathMiddleware } from "../middlewares/imagePathMiddleware.js";

const router = Router();
const categoryController = new CategoryController();

// Apply imagePathMiddleware for proper image URLs
router.use(imagePathMiddleware);

// Public routes
router.get("/", (req, res, next) =>
  categoryController.getCategories(req, res, next)
);

// Admin routes
router.use(protect);
router.use(authorize("admin", "moderator"));

router.get("/:id", (req, res, next) =>
  categoryController.getCategoryById(req, res, next)
);

router.post(
  "/",
  upload.fields([{ name: "image", maxCount: 1 }]),
  (req, res, next) => categoryController.createCategory(req, res, next)
);

router.put(
  "/:id",
  upload.fields([{ name: "image", maxCount: 1 }]),
  (req, res, next) => categoryController.updateCategory(req, res, next)
);

router.delete("/:id", (req, res, next) =>
  categoryController.deleteCategory(req, res, next)
);

router.patch("/:id/status", (req, res, next) =>
  categoryController.toggleCategoryStatus(req, res, next)
);

export default router;
