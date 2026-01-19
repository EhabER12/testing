import { CourseService } from "../services/courseService.js";
import { ApiError } from "../utils/apiError.js";

const courseService = new CourseService();

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req, res, next) => {
  try {
    const filters = {
      categoryId: req.query.categoryId,
      instructorId: req.query.instructorId,
      accessType: req.query.accessType,
      isPublished: req.query.isPublished,
      isFeatured: req.query.isFeatured,
      search: req.query.search,
    };

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: req.query.sort || "-createdAt",
    };

    const result = await courseService.getAllCourses(filters, options);

    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course by ID or slug
// @route   GET /api/courses/:id OR /api/courses/slug/:slug
// @access  Public
export const getCourse = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { id, slug } = req.params;
    
    let course;
    if (slug) {
      course = await courseService.getCourseBySlug(slug, userId);
    } else {
      course = await courseService.getCourseById(id, userId);
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Teacher, Admin)
export const createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user._id);

    res.status(201).json({
      success: true,
      data: course,
      message: "Course created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Owner, Admin)
export const updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(
      req.params.id,
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: course,
      message: "Course updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Owner, Admin)
export const deleteCourse = async (req, res, next) => {
  try {
    const result = await courseService.deleteCourse(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request publish
// @route   POST /api/courses/:id/publish-request
// @access  Private (Teacher)
export const requestPublish = async (req, res, next) => {
  try {
    const course = await courseService.requestPublish(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: course,
      message: "Publish request submitted",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve publish
// @route   POST /api/courses/:id/publish
// @access  Private (Admin)
export const approvePublish = async (req, res, next) => {
  try {
    const course = await courseService.approvePublish(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: course,
      message: "Course published successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject publish
// @route   POST /api/courses/:id/reject
// @access  Private (Admin)
export const rejectPublish = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const course = await courseService.rejectPublish(
      req.params.id,
      reason,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: course,
      message: "Course publication rejected",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private
export const enrollCourse = async (req, res, next) => {
  try {
    const progress = await courseService.enrollStudent(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: progress,
      message: "Enrolled successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my courses (as teacher)
// @route   GET /api/courses/my/teaching
// @access  Private (Teacher)
export const getMyCourses = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      status: req.query.status,
    };

    const result = await courseService.getMyCourses(req.user._id, options);

    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enrolled courses (as student)
// @route   GET /api/courses/my/enrolled
// @access  Private
export const getEnrolledCourses = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await courseService.getEnrolledCourses(req.user._id, options);

    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
