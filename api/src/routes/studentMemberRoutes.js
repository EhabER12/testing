import express from "express";
import {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  renewSubscription,
  getMembersDueSoon,
  sendWhatsAppReminder,
  sendBulkReminders,
  updateStatuses,
  getStatistics,
  getMySubscriptions,
} from "../controllers/studentMemberController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected routes - All require authentication
router.use(protect);

// My subscriptions (Must be before /:id)
router.get("/my", getMySubscriptions);

// Admin/Moderator routes
router.use(authorize("admin", "moderator"));

// Statistics
router.get("/stats", getStatistics);

// Due soon members
router.get("/due-soon", getMembersDueSoon);

// Bulk operations
router.post("/bulk-reminders", sendBulkReminders);
router.post("/update-statuses", authorize("admin"), updateStatuses);

// CRUD operations
router.route("/")
  .get(getMembers)
  .post(createMember);

router.route("/:id")
  .get(getMember)
  .put(updateMember)
  .delete(authorize("admin"), deleteMember);

// Member-specific operations
router.post("/:id/renew", renewSubscription);
router.post("/:id/whatsapp", sendWhatsAppReminder);

export default router;
