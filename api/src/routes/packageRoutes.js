import express from "express";
import {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  getPackageStats,
  getPackageStudents,
} from "../controllers/packageController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllPackages);
router.get("/:id", getPackageById);

// Admin/Moderator routes
router.post("/", protect, authorize("admin", "moderator"), createPackage);
router.put("/:id", protect, authorize("admin", "moderator"), updatePackage);
router.delete("/:id", protect, authorize("admin", "moderator"), deletePackage);
router.get("/:id/stats", protect, authorize("admin", "moderator"), getPackageStats);
router.get("/:id/students", protect, authorize("admin", "moderator"), getPackageStudents);

export default router;
