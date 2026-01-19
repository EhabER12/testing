import Section from "../models/sectionModel.js";
import Lesson from "../models/lessonModel.js";
import Course from "../models/courseModel.js";
import Quiz from "../models/quizModel.js";

class SectionService {
  // Create Section
  async createSection(data) {
    const course = await Course.findById(data.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Auto-assign order if not provided
    if (!data.order) {
      const maxOrder = await Section.findOne({ courseId: data.courseId })
        .sort({ order: -1 })
        .limit(1);
      data.order = maxOrder ? maxOrder.order + 1 : 1;
    }

    const section = await Section.create(data);

    // Update course sections count
    course.contentStats.sectionsCount += 1;
    await course.save();

    return section;
  }

  // Get Section by ID
  async getSectionById(sectionId, includeUnpublished = false) {
    const section = await Section.findById(sectionId).populate(
      "courseId",
      "title slug"
    );

    if (!section) {
      throw new Error("Section not found");
    }

    if (!includeUnpublished && !section.isPublished) {
      throw new Error("Section is not published");
    }

    // Get lessons and quizzes
    const lessonsQuery = { sectionId };
    const quizQuery = { sectionId, linkedTo: "section" };
    if (!includeUnpublished) {
      lessonsQuery.isPublished = true;
      quizQuery.isPublished = true;
    }

    const lessons = await Lesson.find(lessonsQuery).sort({ order: 1 });
    const quizzes = await Quiz.find(quizQuery).sort({ order: 1 });
    
    return {
      ...section.toObject(),
      lessons,
      quizzes,
    };
  }

  // Get all sections for a course
  async getSectionsByCourse(courseId, includeUnpublished = false) {
    const query = { courseId };
    if (!includeUnpublished) {
      query.isPublished = true;
    }

    const sections = await Section.find(query).sort({ order: 1 });
    
    // Get lessons and quizzes for each section
    const sectionsWithItems = await Promise.all(
      sections.map(async (section) => {
        const lessonsQuery = { sectionId: section._id };
        const quizQuery = { sectionId: section._id, linkedTo: "section" };
        if (!includeUnpublished) {
          lessonsQuery.isPublished = true;
          quizQuery.isPublished = true;
        }
        const lessons = await Lesson.find(lessonsQuery).sort({ order: 1 });
        const quizzes = await Quiz.find(quizQuery).sort({ order: 1 });
        return {
          ...section.toObject(),
          lessons: lessons.map(lesson => lesson.toObject()),
          quizzes: quizzes.map(quiz => quiz.toObject()),
        };
      })
    );
    
    return sectionsWithItems;
  }

  // Update Section
  async updateSection(sectionId, updates) {
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    Object.keys(updates).forEach((key) => {
      section[key] = updates[key];
    });

    await section.save();
    return section;
  }

  // Delete Section
  async deleteSection(sectionId) {
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Check if there are lessons
    const lessonsCount = await Lesson.countDocuments({ sectionId });
    if (lessonsCount > 0) {
      throw new Error(
        "Cannot delete section with lessons. Delete lessons first."
      );
    }

    // Update course sections count
    const course = await Course.findById(section.courseId);
    if (course) {
      course.contentStats.sectionsCount = Math.max(0, course.contentStats.sectionsCount - 1);
      await course.save();
    }

    await section.deleteOne();
    return { message: "Section deleted successfully" };
  }

  // Reorder sections
  async reorderSections(courseId, sectionsOrder) {
    // sectionsOrder is an array of { sectionId, order }
    const promises = sectionsOrder.map(({ sectionId, order }) =>
      Section.findByIdAndUpdate(sectionId, { order }, { new: true })
    );

    await Promise.all(promises);
    return { message: "Sections reordered successfully" };
  }
}

export default new SectionService();
