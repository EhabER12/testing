import sectionService from "../services/sectionService.js";
import lessonService from "../services/lessonService.js";

// ============ SECTION CONTROLLERS ============

export const createSection = async (req, res, next) => {
  try {
    const section = await sectionService.createSection(req.body);

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: section,
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const includeUnpublished =
      req.user && (req.user.role === "admin" || req.user.role === "teacher");

    const section = await sectionService.getSectionById(id, includeUnpublished);

    res.status(200).json({
      success: true,
      data: section,
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const includeUnpublished =
      req.user && (req.user.role === "admin" || req.user.role === "teacher");

    const sections = await sectionService.getSectionsByCourse(
      courseId,
      includeUnpublished
    );

    res.status(200).json({
      success: true,
      data: sections,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await sectionService.updateSection(id, req.body);

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: section,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await sectionService.deleteSection(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const reorderSections = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { sectionsOrder } = req.body;

    const result = await sectionService.reorderSections(
      courseId,
      sectionsOrder
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ============ LESSON CONTROLLERS ============

export const createLesson = async (req, res, next) => {
  try {
    const lesson = await lessonService.createLesson(req.body);

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const includeUnpublished =
      req.user && (req.user.role === "admin" || req.user.role === "teacher");

    const lesson = await lessonService.getLessonById(id, includeUnpublished);

    res.status(200).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonsBySection = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const includeUnpublished =
      req.user && (req.user.role === "admin" || req.user.role === "teacher");

    const lessons = await lessonService.getLessonsBySection(
      sectionId,
      includeUnpublished
    );

    res.status(200).json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const includeUnpublished =
      req.user && (req.user.role === "admin" || req.user.role === "teacher");

    const lessons = await lessonService.getLessonsByCourse(
      courseId,
      includeUnpublished
    );

    res.status(200).json({
      success: true,
      data: lessons,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await lessonService.updateLesson(id, req.body);

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lessonService.deleteLesson(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const reorderLessons = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { lessonsOrder } = req.body;

    const result = await lessonService.reorderLessons(sectionId, lessonsOrder);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseStructure = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const includeUnpublished =
      req.user && (req.user.role === "admin" || req.user.role === "teacher");

    const structure = await lessonService.getCourseStructure(
      courseId,
      includeUnpublished
    );

    res.status(200).json({
      success: true,
      data: structure,
    });
  } catch (error) {
    next(error);
  }
};
