import express from "express";
import {
  validateCoupon,
  getAllCoupons,
  getCouponReport,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { optionalAuth, protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/validate", optionalAuth, validateCoupon);

router.get("/", protect, authorize("admin", "moderator"), getAllCoupons);
router.get("/report", protect, authorize("admin", "moderator"), getCouponReport);
router.get("/:id", protect, authorize("admin", "moderator"), getCouponById);
router.post("/", protect, authorize("admin", "moderator"), createCoupon);
router.put("/:id", protect, authorize("admin", "moderator"), updateCoupon);
router.delete("/:id", protect, authorize("admin", "moderator"), deleteCoupon);

export default router;
