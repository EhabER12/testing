import { UserService } from "../services/userService.js";
import { ApiResponse } from "../utils/apiResponse.js";

const userService = new UserService();

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const user = await userService.createUser(userData);

    return ApiResponse.success(res, user, "User created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role, search } = req.query;
    const users = await userService.getAllUsers({ page, limit, role, search });

    return ApiResponse.success(res, users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    return ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    const user = await userService.updateUser(id, userData);

    return ApiResponse.success(res, user, "User updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await userService.updateUserRole(id, role);

    return ApiResponse.success(res, user, "User role updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);

    return ApiResponse.success(res, null, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Approve teacher
// @route   POST /api/users/:id/approve-teacher
// @access  Private/Admin
export const approveTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approverData = {
      approverId: req.user._id,
    };

    const user = await userService.approveTeacher(id, approverData);

    return ApiResponse.success(res, user, "Teacher approved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Reject teacher
// @route   POST /api/users/:id/reject-teacher
// @access  Private/Admin
export const rejectTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, sendEmail = true } = req.body;

    const rejectData = {
      rejectorId: req.user._id,
      reason,
      sendEmail,
    };

    const user = await userService.rejectTeacher(id, rejectData);

    return ApiResponse.success(res, user, "Teacher rejected successfully");
  } catch (error) {
    next(error);
  }
};
