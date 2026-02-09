import { ReviewRepository } from "../repositories/reviewRepository.js";
import Course from "../models/courseModel.js";
import { ApiError } from "../utils/apiError.js";
import path from "path";
import mongoose from "mongoose";

export class ReviewService {
  constructor() {
    this.reviewRepository = new ReviewRepository();
  }

  async getAllReviews(queryParams) {
    const { page, limit, status, productId, serviceId, courseId } = queryParams;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (productId) {
      filter.productId = productId;
    }

    if (serviceId) {
      filter.serviceId = serviceId;
    }

    if (courseId) {
      filter.courseId = courseId;
    }

    if (queryParams.email) {
      filter.email = queryParams.email;
    }

    if (queryParams.userId) {
      filter.userId = queryParams.userId;
    }

    const options = {
      page,
      limit,
      filter,
      populate: "productId serviceId courseId userId",
    };

    return this.reviewRepository.findAll(options);
  }

  async getReviewById(id) {
    const review = await this.reviewRepository.findById(id, {
      populate: "productId",
    });

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    return review;
  }

  async createReview(reviewData, images) {
    // Handle images if provided
    let imagePaths = [];
    if (images && images.length > 0) {
      imagePaths = images.map((image) => {
        const filename = path.basename(image.path);
        return `uploads/${filename}`;
      });
    }

    // If it's a course review, check if user already reviewed this course
    if (reviewData.courseId && reviewData.userId) {
      const existingReview = await this.reviewRepository.findUserCourseReview(
        reviewData.userId,
        reviewData.courseId
      );

      if (existingReview) {
        throw new ApiError(400, "You have already reviewed this course");
      }

      // Check if user is enrolled in the course
      const course = await Course.findById(reviewData.courseId);
      if (!course) {
        throw new ApiError(404, "Course not found");
      }

      // Check if user has access to the course (enrolled or owns it)
      const hasAccess = course.enrolledStudents?.some(
        (student) => student.toString() === reviewData.userId.toString()
      );

      if (!hasAccess) {
        throw new ApiError(403, "You must be enrolled in the course to review it");
      }
    }

    // Create review
    const review = await this.reviewRepository.create({
      ...reviewData,
      images: imagePaths,
      status: "pending",
    });

    return review;
  }

  async updateReview(id, reviewData, images) {
    // Check if review exists
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Handle images if provided
    let imagePaths = review.images || [];
    if (images && images.length > 0) {
      const newImagePaths = images.map((image) => {
        const filename = path.basename(image.path);
        return `uploads/${filename}`;
      });
      imagePaths = [...imagePaths, ...newImagePaths];
    }

    // Update review
    const updatedReview = await this.reviewRepository.update(id, {
      ...reviewData,
      images: imagePaths,
    });

    return updatedReview;
  }

  async approveReview(id) {
    // Check if review exists
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Approve review
    return this.reviewRepository.approve(id);
  }

  async rejectReview(id, reason) {
    // Check if review exists
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Reject review
    return this.reviewRepository.reject(id, reason);
  }

  async getCourseReviews(courseId, options = {}) {
    const { page = 1, limit = 10, status = "approved" } = options;

    // Get reviews
    const reviewsData = await this.reviewRepository.findByCourseId(courseId, {
      page,
      limit,
      filter: { status },
      populate: "userId",
      sort: { createdAt: -1 },
    });

    // Get stats
    const stats = await this.reviewRepository.getCourseStats(courseId);

    return {
      reviews: reviewsData.results,
      pagination: reviewsData.pagination,
      stats,
    };
  }

  async getUserReview(userId, courseId) {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return null;
    }
    return this.reviewRepository.findUserCourseReview(userId, courseId);
  }
}
