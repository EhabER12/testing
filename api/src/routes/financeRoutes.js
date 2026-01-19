import express from "express";
import {
  getAllTransactions,
  getFinancialSummary,
  getMonthlyBreakdown,
  getCategoryBreakdown,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  adjustBalance,
  exportTransactions,
  getFinanceSettings,
  updateFinanceSettings,
} from "../controllers/financeController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { uploadSingle } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// All finance routes require admin authentication
router.use(protect);
router.use(authorize("admin"));

// Summary and analytics endpoints
router.get("/summary", getFinancialSummary);
router.get("/monthly", getMonthlyBreakdown);
router.get("/categories", getCategoryBreakdown);

// Settings
router.get("/settings", getFinanceSettings);
router.put("/settings", updateFinanceSettings);

// Balance adjustment
router.post("/adjust", adjustBalance);

// Export
router.post("/export", exportTransactions);

// CRUD operations
router.get("/", getAllTransactions);
router.get("/:id", getTransactionById);
router.post("/", uploadSingle("attachment"), createTransaction);
router.put("/:id", uploadSingle("attachment"), updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
