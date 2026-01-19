import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getSettings,
  updateSettings,
  getProgress,
  addTitles,
  removeTitle,
  getTitles,
  testPrompt,
  generateNow,
  getJobs,
  retryJob,
  testWhatsapp,
  cancelPendingJobs,
  resetProgress,
} from "../controllers/aiArticleController.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize("admin"));

// Settings
router.route("/settings").get(getSettings).post(updateSettings);

// Progress & Stats
router.get("/progress", getProgress);

// Titles management
router.route("/titles").get(getTitles).post(addTitles);
router.delete("/titles/:id", removeTitle);

// Generation
router.post("/test-prompt", testPrompt);
router.post("/generate-now", generateNow);

// Jobs management
router.get("/jobs", getJobs);
router.post("/jobs/:id/retry", retryJob);
router.post("/cancel-pending", cancelPendingJobs);

// WhatsApp testing
router.post("/test-whatsapp", testWhatsapp);

// Reset
router.post("/reset", resetProgress);

export default router;
