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
  importMembers,
  exportMembers,
} from "../controllers/studentMemberController.js";
import multer from "multer";

const upload = multer();
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

// Export to CSV
router.get("/export", exportMembers);

// Due soon members
router.get("/due-soon", getMembersDueSoon);

// Bulk operations
router.post("/bulk-reminders", sendBulkReminders);
router.post("/update-statuses", authorize("admin"), updateStatuses);
router.post("/import", authorize("admin"), upload.single("file"), importMembers);

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
