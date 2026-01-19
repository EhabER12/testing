import { ReviewRepository } from "../repositories/reviewRepository.js";
// import { TripRepository } from "../repositories/tripRepository.js";
import { ApiError } from "../utils/apiError.js";
import path from "path";

export class ReviewService {
  constructor() {
    this.reviewRepository = new ReviewRepository();
    // this.tripRepository = new TripRepository();
  }

  async getAllReviews(queryParams) {
    const { page, limit, status, productId, serviceId } = queryParams;

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

    if (queryParams.email) {
      filter.email = queryParams.email;
    }

    const options = {
      page,
      limit,
      filter,
      populate: "productId serviceId",
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
    // Check if product exists
    // const product = await this.productRepository.findById(reviewData.productId);

    // if (!product) {
    //   throw new ApiError(404, "Product not found");
    // }
    // Handle images if provided
    let imagePaths = [];
    if (images && images.length > 0) {
      imagePaths = images.map((image) => {
        const filename = path.basename(image.path);
        return `uploads/${filename}`;
      });
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
}
