import { BaseRepository } from "./baseRepository.js";
import Review from "../models/reviewModel.js";

export class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByProductId(productId, options = {}) {
    return this.findAll({
      ...options,
      filter: { productId },
    });
  }

  async findByServiceId(serviceId, options = {}) {
    return this.findAll({
      ...options,
      filter: { serviceId },
    });
  }

  async findByCourseId(courseId, options = {}) {
    return this.findAll({
      ...options,
      filter: { courseId },
    });
  }

  async findByUserId(userId, options = {}) {
    return this.findAll({
      ...options,
      filter: { userId },
    });
  }

  async findByStatus(status, options = {}) {
    return this.findAll({
      ...options,
      filter: { status },
    });
  }

  async findUserCourseReview(userId, courseId) {
    return this.model.findOne({ userId, courseId });
  }

  async approve(id) {
    return this.update(id, { status: "approved" });
  }

  async reject(id, reason) {
    return this.update(id, {
      status: "rejected",
      rejectionReason: reason,
    });
  }

  async getCourseStats(courseId) {
    const stats = await this.model.aggregate([
      {
        $match: {
          courseId: courseId,
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          ratings: {
            $push: "$rating",
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].ratings.forEach((rating) => {
      distribution[rating]++;
    });

    return {
      totalReviews: stats[0].totalReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      distribution,
    };
  }
}
