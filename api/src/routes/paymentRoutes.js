import express from "express";
import {
  getAllPayments,
  getPaymentById,
  getUserPaymentHistory,
  createManualPayment,
  createCustomerManualPayment,
  getRevenueStatistics,
  updatePaymentStatus,
  updateAdminNotes,
  cancelPayment,
  createPaypalPayment,
  capturePaypalOrder,
  createCashierPayment,
  cashierCallback,
  paypalWebhook,
} from "../controllers/paymentController.js";
import {
  protect,
  authorize,
  optionalAuth,
} from "../middlewares/authMiddleware.js";
import { uploadSingle } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin", "moderator"), getAllPayments);
router.get("/history", protect, getUserPaymentHistory);
router.get(
  "/statistics/revenue",
  protect,
  authorize("admin", "moderator"),
  getRevenueStatistics
);
router.get("/:id", protect, authorize("admin", "moderator"), getPaymentById);
router.put("/:id/status", protect, authorize("admin"), updatePaymentStatus);
router.put("/:id/notes", protect, authorize("admin"), updateAdminNotes);
router.post("/:id/cancel", protect, cancelPayment);

router.post(
  "/manual",
  protect,
  uploadSingle("paymentProof"),
  createManualPayment
);

router.post(
  "/customer-manual",
  optionalAuth,
  uploadSingle("paymentProof"),
  createCustomerManualPayment
);

// ==================== PayPal ====================
router.post("/paypal/create", optionalAuth, createPaypalPayment);
router.post("/paypal/capture/:orderId", optionalAuth, capturePaypalOrder);
router.post("/paypal/webhook", paypalWebhook); // Public

// ==================== Cashier ====================
router.post("/cashier/create", optionalAuth, createCashierPayment);
router.post("/cashier/callback", cashierCallback); // Public - called by Cashier

export default router;
