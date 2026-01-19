import express from "express";
import {
  createSection,
  getSectionById,
  getSectionsByCourse,
  updateSection,
  deleteSection,
  reorderSections,
  createLesson,
  getLessonById,
  getLessonsBySection,
  getLessonsByCourse,
  updateLesson,
  deleteLesson,
  reorderLessons,
  getCourseStructure,
} from "../controllers/sectionLessonController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ============ SECTION ROUTES ============

// Public/Student routes
router.get("/sections/:id", protect, getSectionById);
router.get("/sections/course/:courseId", protect, getSectionsByCourse);

// Admin/Teacher routes
router.post(
  "/sections",
  protect,
  authorize("admin", "teacher"),
  createSection
);
router.put(
  "/sections/:id",
  protect,
  authorize("admin", "teacher"),
  updateSection
);
router.delete(
  "/sections/:id",
  protect,
  authorize("admin", "teacher"),
  deleteSection
);
router.post(
  "/sections/course/:courseId/reorder",
  protect,
  authorize("admin", "teacher"),
  reorderSections
);

// ============ LESSON ROUTES ============

// Public/Student routes
router.get("/lessons/:id", protect, getLessonById);
router.get("/lessons/section/:sectionId", protect, getLessonsBySection);
router.get("/lessons/course/:courseId", protect, getLessonsByCourse);
router.get(
  "/course-structure/:courseId",
  protect,
  getCourseStructure
);

// Admin/Teacher routes
router.post(
  "/lessons",
  protect,
  authorize("admin", "teacher"),
  createLesson
);
router.put(
  "/lessons/:id",
  protect,
  authorize("admin", "teacher"),
  updateLesson
);
router.delete(
  "/lessons/:id",
  protect,
  authorize("admin", "teacher"),
  deleteLesson
);
router.post(
  "/lessons/section/:sectionId/reorder",
  protect,
  authorize("admin", "teacher"),
  reorderLessons
);

export default router;
