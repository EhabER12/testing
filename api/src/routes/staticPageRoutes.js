import { Router } from "express";
import staticPageController from "../controllers/staticPageController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

// Public routes - accessible without authentication
router.get("/", (req, res, next) =>
  staticPageController.getPages(req, res, next)
);

router.get("/:slug", (req, res, next) =>
  staticPageController.getPageBySlug(req, res, next)
);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// Update a static page
router.put("/:slug", (req, res, next) =>
  staticPageController.updatePage(req, res, next)
);

// Seed default pages (initialization)
router.post("/seed", (req, res, next) =>
  staticPageController.seedPages(req, res, next)
);

export default router;
