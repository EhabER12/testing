import express from "express";
import {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  addNote,
  deleteNote,
  getEmployeeTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  getEmployeeRecords,
  getMonthRecord,
  updateRecord,
  generateMonthlyRecords,
  getMyProfile,
  getMyTasks,
  updateMyTaskStatus,
} from "../controllers/employeeController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============================================
// SELF-SERVICE ROUTES (for moderator/admin)
// ============================================
router.get("/me", authorize("moderator", "admin"), getMyProfile);
router.get("/me/tasks", authorize("moderator", "admin"), getMyTasks);
router.put(
  "/me/tasks/:taskId",
  authorize("moderator", "admin"),
  updateMyTaskStatus
);

// ============================================
// ADMIN-ONLY ROUTES
// ============================================

// Employee management
router.get("/", authorize("admin"), getAllEmployees);
router.get("/:id", authorize("admin"), getEmployeeById);
router.put("/:id", authorize("admin"), updateEmployee);

// Admin notes
router.post("/:id/notes", authorize("admin"), addNote);
router.delete("/:id/notes/:noteId", authorize("admin"), deleteNote);

// Task routes (admin managing employee tasks)
router.get("/:id/tasks", authorize("admin"), getEmployeeTasks);
router.get("/:id/tasks/stats", authorize("admin"), getTaskStats);
router.post("/:id/tasks", authorize("admin"), createTask);
router.put("/:id/tasks/:taskId", authorize("admin"), updateTask);
router.delete("/:id/tasks/:taskId", authorize("admin"), deleteTask);

// Record routes
router.get("/:id/records", authorize("admin"), getEmployeeRecords);
router.get("/:id/records/:year/:month", authorize("admin"), getMonthRecord);
router.put("/:id/records/:recordId", authorize("admin"), updateRecord);
router.post("/records/generate", authorize("admin"), generateMonthlyRecords);

export default router;
