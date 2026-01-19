import { Router } from "express";
import { ProductController } from "../controllers/productController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { imagePathMiddleware } from "../middlewares/imagePathMiddleware.js";

const router = Router();
const productController = new ProductController();

// Apply imagePathMiddleware for proper image URLs
router.use(imagePathMiddleware);

// Public routes
router.get("/", (req, res, next) =>
  productController.getProducts(req, res, next)
);

router.get("/featured", (req, res, next) =>
  productController.getFeaturedProducts(req, res, next)
);

router.get("/slug/:slug", (req, res, next) =>
  productController.getProductBySlug(req, res, next)
);

// Admin routes
router.use(protect);
router.use(authorize("admin", "moderator"));

router.get("/:id", (req, res, next) =>
  productController.getProductById(req, res, next)
);

router.post("/sync-analytics", (req, res, next) =>
  productController.syncAnalytics(req, res, next)
);

router.post(
  "/",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  (req, res, next) => productController.createProduct(req, res, next)
);

router.put(
  "/:id",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  (req, res, next) => productController.updateProduct(req, res, next)
);

router.delete("/:id", (req, res, next) =>
  productController.deleteProduct(req, res, next)
);

router.patch("/:id/status", (req, res, next) =>
  productController.toggleProductStatus(req, res, next)
);

export default router;
