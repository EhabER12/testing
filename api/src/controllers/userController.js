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

// @desc    Update user password
// @route   PUT /api/users/:id/password
// @access  Private/Admin
export const updateUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return ApiResponse.error(res, "Password must be at least 6 characters", 400);
    }

    const user = await userService.updatePassword(id, password);

    return ApiResponse.success(res, user, "User password updated successfully");
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

// @desc    Assign student to teacher
// @route   POST /api/users/:id/assign-student
// @access  Private/Admin/Teacher
export const assignStudent = async (req, res, next) => {
  try {
    const { id: teacherId } = req.params;
    const { studentId } = req.body;

    // If user is a teacher, they can only assign students to themselves
    if (req.user.role === "teacher" && teacherId !== req.user._id.toString()) {
      return ApiResponse.error(res, "You can only assign students to yourself", 403);
    }

    const result = await userService.assignStudentToTeacher(studentId, teacherId);

    return ApiResponse.success(res, result, "Student assigned successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Remove student from teacher
// @route   POST /api/users/:id/remove-student
// @access  Private/Admin/Teacher
export const removeStudent = async (req, res, next) => {
  try {
    const { id: teacherId } = req.params;
    const { studentId } = req.body;

    // If user is a teacher, they can only remove their own students
    if (req.user.role === "teacher" && teacherId !== req.user._id.toString()) {
      return ApiResponse.error(res, "You can only remove your own students", 403);
    }

    await userService.removeStudentFromTeacher(studentId);

    return ApiResponse.success(res, null, "Student removed successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher students
// @route   GET /api/users/:id/students
// @access  Private/Admin, Teacher
export const getTeacherStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, search } = req.query;

    const students = await userService.getTeacherStudents(id, { page, limit, search });

    return ApiResponse.success(res, students);
  } catch (error) {
    next(error);
  }
};
