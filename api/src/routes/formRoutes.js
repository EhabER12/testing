import express from "express";
import {
  getAllForms,
  getFormById,
  getPublicFormBySlug,
  createForm,
  updateForm,
  deleteForm,
  submitForm,
  submitConsultation,
  markSubmissionAsRead,
  deleteSubmission,
  updateSubmissionNotes,
} from "../controllers/formController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import {
  createFormSchema,
  submitFormSchema,
} from "../validations/formValidation.js";
import { uploadFormAttachments } from "../middlewares/uploadMiddleware.js";
import { imagePathMiddleware } from "../middlewares/imagePathMiddleware.js";

const router = express.Router();

router.use(imagePathMiddleware);

router.get("/public/by-slug/:slug", getPublicFormBySlug);
router.post("/consultation/submit", uploadFormAttachments, submitConsultation);
router.post(
  "/:id/submit",
  uploadFormAttachments,
  validate(submitFormSchema),
  submitForm
);
router.get("/:id", getFormById);

router.get("/", protect, authorize("admin", "moderator"), getAllForms);
router.post(
  "/",
  protect,
  authorize("admin"),
  validate(createFormSchema),
  createForm
);
router.put("/:id", protect, authorize("admin"), updateForm);
router.delete("/:id", protect, authorize("admin"), deleteForm);

router.patch(
  "/:formId/submissions/:submissionId/read",
  protect,
  authorize("admin", "moderator"),
  markSubmissionAsRead
);
router.delete(
  "/:formId/submissions/:submissionId",
  protect,
  authorize("admin"),
  deleteSubmission
);
router.patch(
  "/:formId/submissions/:submissionId/notes",
  protect,
  authorize("admin", "moderator"),
  updateSubmissionNotes
);

export default router;
