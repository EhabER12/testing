import express, { Router } from "express";
import {
  createOrUpdateSession,
  updateCustomerInfo,
  markAsConverted,
  getAbandonedSessions,
  getSessionById,
  getSessionStats,
  markAsRecovered,
  addAdminNote,
  deleteSession,
  runAbandonmentCheck,
} from "../controllers/cartSessionController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES (for tracking)
// ==========================================

// Create or update cart session
router.post("/", createOrUpdateSession);

// Update customer info during checkout
router.patch("/:sessionId/customer", updateCustomerInfo);

// Mark session as converted after payment
router.patch("/:sessionId/converted", markAsConverted);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get abandoned sessions list
router.get(
  "/admin/list",
  protect,
  authorize("admin", "moderator"),
  getAbandonedSessions
);

// Get session statistics
router.get(
  "/admin/stats",
  protect,
  authorize("admin", "moderator"),
  getSessionStats
);

// Get single session details
router.get(
  "/admin/:id",
  protect,
  authorize("admin", "moderator"),
  getSessionById
);

// Mark session as recovered
router.patch(
  "/admin/:id/recovered",
  protect,
  authorize("admin", "moderator"),
  markAsRecovered
);

// Add admin note
router.patch(
  "/admin/:id/note",
  protect,
  authorize("admin", "moderator"),
  addAdminNote
);

// Delete session
router.delete("/admin/:id", protect, authorize("admin"), deleteSession);

// Run abandonment check (can be called by cron job)
router.post(
  "/admin/check-abandoned",
  protect,
  authorize("admin"),
  runAbandonmentCheck
);

export default router;
