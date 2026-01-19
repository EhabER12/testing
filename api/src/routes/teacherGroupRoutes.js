import express from "express";
import {
  createTeacherGroup,
  getAllTeacherGroups,
  getTeacherGroupById,
  updateTeacherGroup,
  addStudent,
  removeStudent,
  updateStudentStatus,
  deleteTeacherGroup,
  getTeacherStatistics,
  getAllTeachersWithStats,
} from "../controllers/teacherGroupController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Special routes (must be before :id routes)
router.get(
  "/teachers/all",
  protect,
  authorize("admin", "moderator"),
  getAllTeachersWithStats
);

router.get(
  "/teacher/:teacherId/stats",
  protect,
  authorize("admin", "moderator", "teacher"),
  getTeacherStatistics
);

// Main CRUD routes
router
  .route("/")
  .get(protect, authorize("admin", "moderator", "teacher"), getAllTeacherGroups)
  .post(protect, authorize("admin"), createTeacherGroup);

router
  .route("/:id")
  .get(protect, authorize("admin", "moderator", "teacher"), getTeacherGroupById)
  .put(protect, authorize("admin"), updateTeacherGroup)
  .delete(protect, authorize("admin"), deleteTeacherGroup);

// Student management routes
router.post("/:id/students", protect, authorize("admin", "teacher"), addStudent);

router.delete(
  "/:id/students/:studentId",
  protect,
  authorize("admin", "teacher"),
  removeStudent
);

router.patch(
  "/:id/students/:studentId",
  protect,
  authorize("admin", "teacher"),
  updateStudentStatus
);

export default router;
