import { Router } from "express";
import { ServiceController } from "../controllers/serviceController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { imagePathMiddleware } from "../middlewares/imagePathMiddleware.js";

const router = Router();
const serviceController = new ServiceController();

// Apply imagePathMiddleware for proper image URLs
router.use(imagePathMiddleware);

// Public routes
router.get("/", (req, res, next) =>
  serviceController.getServices(req, res, next)
);

router.get("/featured", (req, res, next) =>
  serviceController.getFeaturedServices(req, res, next)
);

router.get("/categories", (req, res, next) =>
  serviceController.getCategories(req, res, next)
);

router.get("/slug/:slug", (req, res, next) =>
  serviceController.getServiceBySlug(req, res, next)
);

// Admin routes
router.use(protect);
router.use(authorize("admin", "moderator"));

router.get("/:id", (req, res, next) =>
  serviceController.getServiceById(req, res, next)
);

router.post("/sync-analytics", (req, res, next) =>
  serviceController.syncAnalytics(req, res, next)
);

router.post(
  "/",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  (req, res, next) => serviceController.createService(req, res, next)
);

router.put(
  "/:id",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  (req, res, next) => serviceController.updateService(req, res, next)
);

router.delete("/:id", (req, res, next) =>
  serviceController.deleteService(req, res, next)
);

router.patch("/:id/status", (req, res, next) =>
  serviceController.toggleServiceStatus(req, res, next)
);

router.post("/reorder", (req, res, next) =>
  serviceController.reorderServices(req, res, next)
);

router.post("/:id/gallery/remove", (req, res, next) =>
  serviceController.removeGalleryImage(req, res, next)
);

export default router;
