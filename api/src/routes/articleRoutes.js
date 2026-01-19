import express from "express";
import {
  getAllArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  syncAnalytics,
} from "../controllers/articleController.js";
import {
  protect,
  authorize,
  optionalAuth,
} from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

import { imagePathMiddleware } from "../middlewares/imagePathMiddleware.js";

const router = express.Router();

router.use(imagePathMiddleware);

router
  .route("/")
  .get(optionalAuth, getAllArticles)
  .post(
    protect,
    authorize("admin", "moderator"),
    upload.single("coverImage"),
    createArticle
  );

router
  .route("/sync-analytics")
  .post(protect, authorize("admin", "moderator"), syncAnalytics);

router.route("/:slug").get(optionalAuth, getArticleBySlug);

router
  .route("/:id")
  .put(
    protect,
    authorize("admin", "moderator"),
    upload.single("coverImage"),
    updateArticle
  )
  .delete(protect, authorize("admin", "moderator"), deleteArticle);

export default router;
