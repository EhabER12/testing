import { EmployeeService } from "../services/employeeService.js";
import { ApiResponse } from "../utils/apiResponse.js";

const employeeService = new EmployeeService();

// ==================== SELF-SERVICE ENDPOINTS ====================

// @desc    Get own profile (for moderators/admins)
// @route   GET /api/employees/me
// @access  Private/Moderator/Admin
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await employeeService.getEmployeeProfile(userId);

    return ApiResponse.success(res, profile);
  } catch (error) {
    next(error);
  }
};

// @desc    Get own tasks
// @route   GET /api/employees/me/tasks
// @access  Private/Moderator/Admin
export const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const tasks = await employeeService.getEmployeeTasks(userId, {
      status,
      limit: 100, // Get all tasks for Kanban view
    });

    return ApiResponse.success(res, tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Update own task status
// @route   PUT /api/employees/me/tasks/:taskId
// @access  Private/Moderator/Admin
export const updateMyTaskStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;
    const { status } = req.body;

    // Only allow status updates (not other fields)
    const task = await employeeService.updateOwnTaskStatus(
      userId,
      taskId,
      status
    );

    return ApiResponse.success(res, task, "Task status updated");
  } catch (error) {
    next(error);
  }
};

// ==================== EMPLOYEE ENDPOINTS ====================

// @desc    Get all employees (moderators)
// @route   GET /api/employees
// @access  Private/Admin
export const getAllEmployees = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const employees = await employeeService.getAllEmployees({
      page,
      limit,
      search,
      status,
    });

    return ApiResponse.success(res, employees);
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee by ID with full details
// @route   GET /api/employees/:id
// @access  Private/Admin
export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);

    return ApiResponse.success(res, employee);
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee info
// @route   PUT /api/employees/:id
// @access  Private/Admin
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await employeeService.updateEmployee(id, updateData);

    return ApiResponse.success(res, employee, "Employee updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Add admin note to employee
// @route   POST /api/employees/:id/notes
// @access  Private/Admin
export const addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user._id;

    const employee = await employeeService.addNote(id, note, adminId);

    return ApiResponse.success(res, employee, "Note added successfully", 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete admin note
// @route   DELETE /api/employees/:id/notes/:noteId
// @access  Private/Admin
export const deleteNote = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;

    const employee = await employeeService.deleteNote(id, noteId);

    return ApiResponse.success(res, employee, "Note deleted successfully");
  } catch (error) {
    next(error);
  }
};

// ==================== TASK ENDPOINTS ====================

// @desc    Get employee tasks
// @route   GET /api/employees/:id/tasks
// @access  Private/Admin
export const getEmployeeTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, status, weekOnly } = req.query;

    const tasks = await employeeService.getEmployeeTasks(id, {
      page,
      limit,
      status,
      weekOnly: weekOnly === "true",
    });

    return ApiResponse.success(res, tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Create task for employee
// @route   POST /api/employees/:id/tasks
// @access  Private/Admin
export const createTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const taskData = req.body;
    const assignedBy = req.user._id;

    const task = await employeeService.createTask(id, taskData, assignedBy);

    return ApiResponse.success(res, task, "Task created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/employees/:id/tasks/:taskId
// @access  Private/Admin
export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;

    const task = await employeeService.updateTask(taskId, updateData);

    return ApiResponse.success(res, task, "Task updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/employees/:id/tasks/:taskId
// @access  Private/Admin
export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    await employeeService.deleteTask(taskId);

    return ApiResponse.success(res, null, "Task deleted successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get task statistics
// @route   GET /api/employees/:id/tasks/stats
// @access  Private/Admin
export const getTaskStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await employeeService.getTaskStats(id);

    return ApiResponse.success(res, stats);
  } catch (error) {
    next(error);
  }
};

// ==================== RECORD ENDPOINTS ====================

// @desc    Get employee records
// @route   GET /api/employees/:id/records
// @access  Private/Admin
export const getEmployeeRecords = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const records = await employeeService.getEmployeeRecords(
      id,
      parseInt(limit) || 12
    );

    return ApiResponse.success(res, records);
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific month record
// @route   GET /api/employees/:id/records/:year/:month
// @access  Private/Admin
export const getMonthRecord = async (req, res, next) => {
  try {
    const { id, year, month } = req.params;

    const record = await employeeService.getMonthRecord(
      id,
      parseInt(year),
      parseInt(month)
    );

    return ApiResponse.success(res, record);
  } catch (error) {
    next(error);
  }
};

// @desc    Update/review record
// @route   PUT /api/employees/:id/records/:recordId
// @access  Private/Admin
export const updateRecord = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const updateData = req.body;
    const reviewerId = req.user._id;

    const record = await employeeService.updateRecord(
      recordId,
      updateData,
      reviewerId
    );

    return ApiResponse.success(res, record, "Record updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Generate monthly records for all employees
// @route   POST /api/employees/records/generate
// @access  Private/Admin
export const generateMonthlyRecords = async (req, res, next) => {
  try {
    const records = await employeeService.generateMonthlyRecords();

    return ApiResponse.success(
      res,
      records,
      `Generated ${records.length} monthly records`,
      201
    );
  } catch (error) {
    next(error);
  }
};
