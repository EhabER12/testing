import teacherGroupService from "../services/teacherGroupService.js";
import { ApiResponse } from "../utils/apiResponse.js";

// @desc    Create teacher group
// @route   POST /api/teacher-groups
// @access  Private/Admin
export const createTeacherGroup = async (req, res, next) => {
  try {
    const teacherGroup = await teacherGroupService.createTeacherGroup(
      req.body,
      req.user._id
    );
    return ApiResponse.success(
      res,
      teacherGroup,
      "Teacher group created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all teacher groups
// @route   GET /api/teacher-groups
// @access  Private/Admin/Moderator
export const getAllTeacherGroups = async (req, res, next) => {
  try {
    const { teacherId, groupType, isActive } = req.query;
    const filters = {};

    // If user is a teacher, force filter by their own ID
    if (req.user.role === "teacher") {
      filters.teacherId = req.user._id;
    } else if (teacherId) {
      filters.teacherId = teacherId;
    }

    if (groupType) filters.groupType = groupType;
    if (isActive !== undefined) filters.isActive = isActive === "true";

    const teacherGroups = await teacherGroupService.getAllTeacherGroups(filters);
    return ApiResponse.success(res, teacherGroups, "Teacher groups retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher group by ID
// @route   GET /api/teacher-groups/:id
// @access  Private/Admin/Moderator/Teacher
export const getTeacherGroupById = async (req, res, next) => {
  try {
    const teacherGroup = await teacherGroupService.getTeacherGroupById(req.params.id);
    
    // If user is a teacher, only allow access to their own groups
    if (req.user.role === "teacher" && teacherGroup.teacherId._id.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, "Unauthorized access", 403);
    }

    return ApiResponse.success(res, teacherGroup, "Teacher group retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Update teacher group
// @route   PUT /api/teacher-groups/:id
// @access  Private/Admin
export const updateTeacherGroup = async (req, res, next) => {
  try {
    const teacherGroup = await teacherGroupService.updateTeacherGroup(
      req.params.id,
      req.body,
      req.user._id
    );
    return ApiResponse.success(res, teacherGroup, "Teacher group updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Add student to teacher group
// @route   POST /api/teacher-groups/:id/students
// @access  Private/Admin/Teacher
export const addStudent = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    
    // Check ownership if user is a teacher
    if (req.user.role === "teacher") {
      const teacherGroup = await teacherGroupService.getTeacherGroupById(req.params.id);
      if (teacherGroup.teacherId._id.toString() !== req.user._id.toString()) {
        return ApiResponse.error(res, "Unauthorized access", 403);
      }
    }

    const teacherGroup = await teacherGroupService.addStudent(
      req.params.id,
      studentId,
      req.user._id
    );
    return ApiResponse.success(res, teacherGroup, "Student added successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Remove student from teacher group
// @route   DELETE /api/teacher-groups/:id/students/:studentId
// @access  Private/Admin/Teacher
export const removeStudent = async (req, res, next) => {
  try {
    // Check ownership if user is a teacher
    if (req.user.role === "teacher") {
      const teacherGroup = await teacherGroupService.getTeacherGroupById(req.params.id);
      if (teacherGroup.teacherId._id.toString() !== req.user._id.toString()) {
        return ApiResponse.error(res, "Unauthorized access", 403);
      }
    }

    const teacherGroup = await teacherGroupService.removeStudent(
      req.params.id,
      req.params.studentId,
      req.user._id
    );
    return ApiResponse.success(res, teacherGroup, "Student removed successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Update student status in group
// @route   PATCH /api/teacher-groups/:id/students/:studentId
// @access  Private/Admin/Teacher
export const updateStudentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Check ownership if user is a teacher
    if (req.user.role === "teacher") {
      const teacherGroup = await teacherGroupService.getTeacherGroupById(req.params.id);
      if (teacherGroup.teacherId._id.toString() !== req.user._id.toString()) {
        return ApiResponse.error(res, "Unauthorized access", 403);
      }
    }

    const teacherGroup = await teacherGroupService.updateStudentStatus(
      req.params.id,
      req.params.studentId,
      status,
      req.user._id
    );
    return ApiResponse.success(res, teacherGroup, "Student status updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Delete teacher group
// @route   DELETE /api/teacher-groups/:id
// @access  Private/Admin
export const deleteTeacherGroup = async (req, res, next) => {
  try {
    const result = await teacherGroupService.deleteTeacherGroup(req.params.id);
    return ApiResponse.success(res, result, "Teacher group deleted successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher statistics
// @route   GET /api/teacher-groups/teacher/:teacherId/stats
// @access  Private/Admin/Moderator/Teacher
export const getTeacherStatistics = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    
    // If user is a teacher, only allow access to their own stats
    if (req.user.role === "teacher" && teacherId !== req.user._id.toString()) {
      return ApiResponse.error(res, "Unauthorized access", 403);
    }

    const stats = await teacherGroupService.getTeacherStatistics(teacherId);
    return ApiResponse.success(res, stats, "Teacher statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get all teachers with statistics
// @route   GET /api/teacher-groups/teachers/all
// @access  Private/Admin/Moderator
export const getAllTeachersWithStats = async (req, res, next) => {
  try {
    const teachers = await teacherGroupService.getAllTeachersWithStats();
    return ApiResponse.success(res, teachers, "Teachers retrieved successfully");
  } catch (error) {
    next(error);
  }
};
