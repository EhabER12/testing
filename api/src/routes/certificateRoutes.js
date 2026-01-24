import express from "express";
import {
  issueCertificate,
  bulkIssueCertificates,
  getCertificateById,
  verifyCertificate,
  getCertificatesByEmail,
  downloadCertificatePublic,
  getUserCertificates,
  getCourseCertificates,
  revokeCertificate,
  reissueCertificate,
  downloadCertificate,
  generateCertificatePDF,
  createTemplate,
  getTemplateById,
  getAllTemplates,
  updateTemplate,
  deleteTemplate,
  getMyCertificatesEligibility,
  claimCertificate,
} from "../controllers/certificateController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ============ CERTIFICATE ROUTES ============

// Public routes
router.get("/verify/:certificateNumber", verifyCertificate);
router.post("/by-email", getCertificatesByEmail);
router.get("/download/:certificateNumber", downloadCertificatePublic);

// Student routes
router.get("/my-certificates", protect, getUserCertificates);
router.get("/my-eligibility", protect, getMyCertificatesEligibility);
router.post("/claim", protect, claimCertificate);

// ============ CERTIFICATE TEMPLATE ROUTES ============

// Admin routes
router.post(
  "/templates",
  protect,
  authorize("admin"),
  createTemplate
);
router.get(
  "/templates",
  protect,
  authorize("admin", "moderator"),
  getAllTemplates
);
router.get(
  "/templates/:id",
  protect,
  authorize("admin", "moderator"),
  getTemplateById
);
router.put(
  "/templates/:id",
  protect,
  authorize("admin"),
  updateTemplate
);
router.delete(
  "/templates/:id",
  protect,
  authorize("admin"),
  deleteTemplate
);

// Certificate detail routes (placed after templates to avoid conflict)
router.get("/:id", protect, getCertificateById);
router.get("/:id/download", protect, downloadCertificate);

// Admin/Moderator routes
router.post(
  "/issue",
  protect,
  authorize("admin", "moderator"),
  issueCertificate
);
router.post(
  "/bulk-issue",
  protect,
  authorize("admin", "moderator"),
  bulkIssueCertificates
);
router.get(
  "/course/:courseId",
  protect,
  authorize("admin", "moderator", "teacher"),
  getCourseCertificates
);
router.get(
  "/user/:userId",
  protect,
  authorize("admin", "moderator"),
  getUserCertificates
);
router.post(
  "/:id/revoke",
  protect,
  authorize("admin"),
  revokeCertificate
);
router.post(
  "/:id/reissue",
  protect,
  authorize("admin", "moderator"),
  reissueCertificate
);
router.post(
  "/:id/generate-pdf",
  protect,
  authorize("admin", "moderator"),
  generateCertificatePDF
);

export default router;
