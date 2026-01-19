import { FinanceService } from "../services/financeService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

const financeService = new FinanceService();

/**
 * @desc    Get all transactions
 * @route   GET /api/finance
 * @access  Private/Admin
 */
export const getAllTransactions = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      type,
      category,
      source,
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const transactions = await financeService.getAllTransactions({
      page,
      limit,
      type,
      category,
      source,
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
    });

    return ApiResponse.success(res, transactions);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get financial summary (balance, totals)
 * @route   GET /api/finance/summary
 * @access  Private/Admin
 */
export const getFinancialSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;

    const summary = await financeService.getFinancialSummary({
      startDate,
      endDate,
      category,
    });

    return ApiResponse.success(res, summary);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly breakdown for charts
 * @route   GET /api/finance/monthly
 * @access  Private/Admin
 */
export const getMonthlyBreakdown = async (req, res, next) => {
  try {
    const { year } = req.query;
    const breakdown = await financeService.getMonthlyBreakdown(
      year ? parseInt(year) : undefined
    );

    return ApiResponse.success(res, breakdown);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category breakdown
 * @route   GET /api/finance/categories
 * @access  Private/Admin
 */
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { type } = req.query;
    const breakdown = await financeService.getCategoryBreakdown(type);

    return ApiResponse.success(res, breakdown);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transaction by ID
 * @route   GET /api/finance/:id
 * @access  Private/Admin
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await financeService.getTransactionById(id);

    return ApiResponse.success(res, transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new transaction
 * @route   POST /api/finance
 * @access  Private/Admin
 */
export const createTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      currency,
      category,
      description,
      transactionDate,
      tags,
      referenceId,
      referenceModel,
      referenceDisplayId,
    } = req.body;

    // Validation
    if (!type || !["income", "expense", "adjustment"].includes(type)) {
      return next(
        new ApiError(
          400,
          "Valid transaction type is required (income, expense, or adjustment)"
        )
      );
    }

    if (!amount || amount <= 0) {
      return next(new ApiError(400, "Valid positive amount is required"));
    }

    const userId = req.user._id;

    // Handle attachment if uploaded
    const attachmentUrl = req.file ? `uploads/${req.file.filename}` : null;

    const transaction = await financeService.createTransaction(
      {
        type,
        amount,
        currency,
        category,
        description,
        transactionDate,
        tags,
        referenceId,
        referenceModel,
        referenceDisplayId,
        attachmentUrl,
      },
      userId
    );

    return ApiResponse.success(
      res,
      transaction,
      "Transaction created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update transaction
 * @route   PUT /api/finance/:id
 * @access  Private/Admin
 */
export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      amount,
      currency,
      category,
      description,
      transactionDate,
      tags,
      isReconciled,
    } = req.body;

    const userId = req.user._id;

    // Handle attachment if uploaded
    const attachmentUrl = req.file ? `uploads/${req.file.filename}` : undefined;

    const transaction = await financeService.updateTransaction(
      id,
      {
        amount,
        currency,
        category,
        description,
        transactionDate,
        tags,
        isReconciled,
        attachmentUrl,
      },
      userId
    );

    return ApiResponse.success(
      res,
      transaction,
      "Transaction updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete transaction (soft delete)
 * @route   DELETE /api/finance/:id
 * @access  Private/Admin
 */
export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    await financeService.deleteTransaction(id, userId);

    return ApiResponse.success(res, null, "Transaction deleted successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Adjust balance manually
 * @route   POST /api/finance/adjust
 * @access  Private/Admin
 */
export const adjustBalance = async (req, res, next) => {
  try {
    const { amount, currency, description } = req.body;

    if (amount === undefined || amount === 0) {
      return next(new ApiError(400, "Amount is required and cannot be zero"));
    }

    const userId = req.user._id;

    const transaction = await financeService.adjustBalance(
      { amount, currency, description },
      userId
    );

    return ApiResponse.success(
      res,
      transaction,
      "Balance adjusted successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export transactions
 * @route   POST /api/finance/export
 * @access  Private/Admin
 */
export const exportTransactions = async (req, res, next) => {
  try {
    const { startDate, endDate, type, category, format = "csv" } = req.body;

    const exportData = await financeService.exportTransactions({
      startDate,
      endDate,
      type,
      category,
    });

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=finance_export_${Date.now()}.csv`
      );
      return res.send(exportData.csv);
    }

    return ApiResponse.success(res, exportData);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get finance settings (base currency, exchange rates)
 * @route   GET /api/finance/settings
 * @access  Private/Admin
 */
export const getFinanceSettings = async (req, res, next) => {
  try {
    const settings = await financeService.getFinanceSettings();
    return ApiResponse.success(res, settings);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update finance settings
 * @route   PUT /api/finance/settings
 * @access  Private/Admin
 */
export const updateFinanceSettings = async (req, res, next) => {
  try {
    const { baseCurrency, exchangeRates } = req.body;
    const userId = req.user._id;

    const settings = await financeService.updateFinanceSettings(
      { baseCurrency, exchangeRates },
      userId
    );

    return ApiResponse.success(res, settings, "Finance settings updated");
  } catch (error) {
    next(error);
  }
};
