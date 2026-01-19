import { ReviewService } from "../services/reviewService.js";
import { ApiResponse } from "../utils/apiResponse.js";

const reviewService = new ReviewService();

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public/Admin
export const getAllReviews = async (req, res, next) => {
  try {
    const { page, limit, status, productId, serviceId } = req.query;
    const reviews = await reviewService.getAllReviews({
      page,
      limit,
      status,
      productId,
      serviceId,
    });

    return ApiResponse.success(res, reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getUserReviews = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const email = req.user.email; // Assuming user is authenticated

    const reviews = await reviewService.getAllReviews({
      page,
      limit,
      email, // Filter by email
    });

    return ApiResponse.success(res, reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Public
export const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);

    return ApiResponse.success(res, review);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Public
export const createReview = async (req, res, next) => {
  try {
    const reviewData = req.body;
    const images = req.files;

    const review = await reviewService.createReview(reviewData, images);

    return ApiResponse.success(
      res,
      review,
      "Review submitted successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private/Admin
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewData = req.body;
    const images = req.files;

    const review = await reviewService.updateReview(id, reviewData, images);

    return ApiResponse.success(res, review, "Review updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a review
// @route   POST /api/reviews/:id/approve
// @access  Private/Admin
export const approveReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.approveReview(id);

    return ApiResponse.success(res, review, "Review approved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a review
// @route   POST /api/reviews/:id/reject
// @access  Private/Admin
export const rejectReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const review = await reviewService.rejectReview(id, reason);

    return ApiResponse.success(res, review, "Review rejected successfully");
  } catch (error) {
    next(error);
  }
};
