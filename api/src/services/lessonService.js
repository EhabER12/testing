import Lesson from "../models/lessonModel.js";
import Section from "../models/sectionModel.js";
import Course from "../models/courseModel.js";
import Quiz from "../models/quizModel.js";

class LessonService {
  // Extract video ID from URL
  extractVideoId(source, url) {
    if (!url) return null;
    if (source === "youtube") {
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
    } else if (source === "vimeo") {
      const patterns = [
        /(?:vimeo\.com\/)([0-9]+)/,
        /(?:player\.vimeo\.com\/video\/)([0-9]+)/,
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
    }
    return null;
  }

  // Create Lesson
  async createLesson(data) {
    const section = await Section.findById(data.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Extract video ID if applicable
    if (data.videoSource && data.videoUrl && !data.videoId) {
      data.videoId = this.extractVideoId(data.videoSource, data.videoUrl);
    }

    // Auto-assign order if not provided
    if (!data.order) {
      const maxOrder = await Lesson.findOne({ sectionId: data.sectionId })
        .sort({ order: -1 })
        .limit(1);
      data.order = maxOrder ? maxOrder.order + 1 : 1;
    }

    const lesson = await Lesson.create(data);

    // Update section stats
    section.lessonsCount += 1;
    if (data.duration) {
      section.totalDuration += data.duration;
    }
    await section.save();

    // Update course stats
    const course = await Course.findById(data.courseId);
    if (course) {
      course.contentStats.lessonsCount += 1;
      if (data.duration) {
        course.contentStats.totalDuration += data.duration;
      }
      await course.save();
    }

    return lesson;
  }

  // Get Lesson by ID
  async getLessonById(lessonId, includeUnpublished = false) {
    const lesson = await Lesson.findById(lessonId)
      .populate("sectionId", "title")
      .populate("courseId", "title slug");

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    if (!includeUnpublished && !lesson.isPublished) {
      throw new Error("Lesson is not published");
    }

    return lesson;
  }

  // Get all lessons for a section
  async getLessonsBySection(sectionId, includeUnpublished = false) {
    const query = { sectionId };
    if (!includeUnpublished) {
      query.isPublished = true;
    }

    const lessons = await Lesson.find(query).sort({ order: 1 });
    return lessons;
  }

  // Get all lessons for a course
  async getLessonsByCourse(courseId, includeUnpublished = false) {
    const query = { courseId };
    if (!includeUnpublished) {
      query.isPublished = true;
    }

    const lessons = await Lesson.find(query)
      .populate("sectionId", "title order")
      .sort({ "sectionId.order": 1, order: 1 });

    return lessons;
  }

  // Update Lesson
  async updateLesson(lessonId, updates) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const oldDuration = lesson.duration || 0;

    // Extract video ID if applicable
    const source = updates.videoSource || lesson.videoSource;
    const url = updates.videoUrl || lesson.videoUrl;
    if (updates.videoUrl && !updates.videoId) {
      updates.videoId = this.extractVideoId(source, url);
    }

    Object.keys(updates).forEach((key) => {
      lesson[key] = updates[key];
    });

    await lesson.save();

    // Update durations if changed
    if (updates.duration !== undefined && updates.duration !== oldDuration) {
      const durationDiff = (updates.duration || 0) - oldDuration;

      const section = await Section.findById(lesson.sectionId);
      if (section) {
        section.totalDuration = Math.max(
          0,
          section.totalDuration + durationDiff
        );
        await section.save();
      }

      const course = await Course.findById(lesson.courseId);
      if (course) {
        course.contentStats.totalDuration = Math.max(0, course.contentStats.totalDuration + durationDiff);
        await course.save();
      }
    }

    return lesson;
  }

  // Delete Lesson
  async deleteLesson(lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Update section stats
    const section = await Section.findById(lesson.sectionId);
    if (section) {
      section.lessonsCount = Math.max(0, section.lessonsCount - 1);
      section.totalDuration = Math.max(
        0,
        section.totalDuration - (lesson.duration || 0)
      );
      await section.save();
    }

    // Update course stats
    const course = await Course.findById(lesson.courseId);
    if (course) {
      course.contentStats.lessonsCount = Math.max(0, course.contentStats.lessonsCount - 1);
      course.contentStats.totalDuration = Math.max(
        0,
        course.contentStats.totalDuration - (lesson.duration || 0)
      );
      await course.save();
    }

    await lesson.deleteOne();
    return { message: "Lesson deleted successfully" };
  }

  // Reorder lessons
  async reorderLessons(sectionId, lessonsOrder) {
    // lessonsOrder is an array of { lessonId, order }
    const promises = lessonsOrder.map(({ lessonId, order }) =>
      Lesson.findByIdAndUpdate(lessonId, { order }, { new: true })
    );

    await Promise.all(promises);
    return { message: "Lessons reordered successfully" };
  }

  // Get complete course structure (sections with lessons and quizzes)
  async getCourseStructure(courseId, includeUnpublished = false) {
    const sectionQuery = { courseId };
    const lessonQuery = { courseId };
    const quizQuery = { courseId, linkedTo: "section" };

    if (!includeUnpublished) {
      sectionQuery.isPublished = true;
      lessonQuery.isPublished = true;
      quizQuery.isPublished = true;
    }

    const sections = await Section.find(sectionQuery).sort({ order: 1 }).lean();
    const lessons = await Lesson.find(lessonQuery).sort({ order: 1 }).lean();
    const quizzes = await Quiz.find(quizQuery).sort({ order: 1 }).lean();

    // Group items by section
    const structure = sections.map((section) => ({
      ...section,
      lessons: lessons.filter(
        (lesson) => lesson.sectionId.toString() === section._id.toString()
      ),
      quizzes: quizzes.filter(
        (quiz) => quiz.sectionId && quiz.sectionId.toString() === section._id.toString()
      ),
    }));

    return structure;
  }

  // Upload video file for lesson
  async uploadVideo(lessonId, videoFile) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Store relative path (from uploads folder)
    const videoPath = videoFile.path.replace(/\\/g, "/");

    // Update lesson with uploaded video
    lesson.videoSource = "upload";
    lesson.videoUrl = "/" + videoPath; // Store as relative URL
    lesson.videoId = videoFile.filename; // Use filename as ID

    await lesson.save();
    return lesson;
  }

  // Delete video file for lesson
  async deleteVideo(lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    if (lesson.videoSource !== "upload" || !lesson.videoUrl) {
      throw new Error("No uploaded video to delete");
    }

    // Clear video data
    lesson.videoSource = "none";
    lesson.videoUrl = null;
    lesson.videoId = null;

    await lesson.save();
    return lesson;
  }

  // Get video file path for streaming
  async getVideoPath(lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    if (lesson.videoSource !== "upload" || !lesson.videoUrl) {
      throw new Error("No uploaded video available");
    }

    // Remove leading slash and return full path
    const videoPath = lesson.videoUrl.startsWith("/")
      ? lesson.videoUrl.substring(1)
      : lesson.videoUrl;

    return videoPath;
  }
}

export default new LessonService();
