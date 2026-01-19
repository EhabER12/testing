import Article from "../models/articleModel.js";
import AnalyticsService from "../services/analyticsService.js";
import { asyncHandler } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import slugify from "slugify";

// @desc    Get all articles
// @route   GET /api/articles
// @access  Public
export const getAllArticles = asyncHandler(async (req, res) => {
  const {
    status,
    tag,
    search,
    page = 1,
    limit = 10,
    language,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Filter by status (default to published for public, allow all for admin if requested)
  if (status) {
    query.status = status;
  } else if (!req.user || req.user.role !== "admin") {
    query.status = "published";
  }

  // Filter by language
  if (language && (language === "en" || language === "ar")) {
    query.language = language;
  }

  // Filter by tag
  if (tag) {
    query.tags = tag;
  }

  // Search by title or content
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  // Build sort object from parameters
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortField = ["createdAt", "publishedAt", "views", "title"].includes(
    sortBy
  )
    ? sortBy
    : "createdAt";
  const sortObj = { [sortField]: sortDirection };

  const articles = await Article.find(query)
    .populate("author", "name email")
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Article.countDocuments(query);

  return ApiResponse.success(res, {
    results: articles,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single article by slug
// @route   GET /api/articles/:slug
// @access  Public
export const getArticleBySlug = asyncHandler(async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug }).populate(
    "author",
    "name email"
  );

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  // Increment views only if not admin and not explicitly disabled
  const shouldIncrement =
    req.query.incrementView !== "false" &&
    (!req.user || req.user.role !== "admin");

  if (shouldIncrement) {
    article.views += 1;
    await article.save({ validateBeforeSave: false });
  }

  return ApiResponse.success(res, article);
});

// @desc    Create new article
// @route   POST /api/articles
// @access  Private/Admin
export const createArticle = asyncHandler(async (req, res) => {
  // Add user to body
  req.body.author = req.user.id;

  // Handle cover image upload
  if (req.file) {
    req.body.coverImage = `/uploads/${req.file.filename}`;
  }

  // Handle tags
  if (req.body["tags[]"]) {
    req.body.tags = Array.isArray(req.body["tags[]"])
      ? req.body["tags[]"]
      : [req.body["tags[]"]];
  } else if (req.body.tags && typeof req.body.tags === "string") {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch (e) {
      req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
    }
  }

  // Handle SEO
  if (req.body.seo && typeof req.body.seo === "string") {
    try {
      req.body.seo = JSON.parse(req.body.seo);
    } catch (e) {
      req.body.seo = {};
    }
  } else {
    // Construct SEO object from flat keys
    const seo = req.body.seo || {};
    if (req.body["seo[title]"]) seo.title = req.body["seo[title]"];
    if (req.body["seo[description]"])
      seo.description = req.body["seo[description]"];
    if (req.body["seo[keywords][]"]) {
      seo.keywords = Array.isArray(req.body["seo[keywords][]"])
        ? req.body["seo[keywords][]"]
        : [req.body["seo[keywords][]"]];
    }
    if (Object.keys(seo).length > 0) {
      req.body.seo = seo;
    }
  }

  // Handle Slug
  const createSlug = (text) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF\u0750-\u077F\-]/g, "")
      .replace(/-+/g, "-");
  };

  if (req.body.slug) {
    req.body.slug = createSlug(req.body.slug);
  } else if (req.body.title) {
    req.body.slug = createSlug(req.body.title);
  }

  // Set publishedAt if status is published
  if (req.body.status === "published" && !req.body.publishedAt) {
    req.body.publishedAt = Date.now();
  }

  const article = await Article.create(req.body);

  return ApiResponse.success(res, article, "Article created successfully");
});

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private/Admin
export const updateArticle = asyncHandler(async (req, res) => {
  let article = await Article.findById(req.params.id);

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  // Handle cover image upload
  if (req.file) {
    req.body.coverImage = `/uploads/${req.file.filename}`;
  }

  // Handle tags
  if (req.body["tags[]"]) {
    req.body.tags = Array.isArray(req.body["tags[]"])
      ? req.body["tags[]"]
      : [req.body["tags[]"]];
  } else if (req.body.tags && typeof req.body.tags === "string") {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch (e) {
      req.body.tags = req.body.tags.split(",").map((tag) => tag.trim());
    }
  }

  // Handle SEO
  if (req.body.seo && typeof req.body.seo === "string") {
    try {
      req.body.seo = JSON.parse(req.body.seo);
    } catch (e) {
      req.body.seo = {};
    }
  } else {
    // Construct SEO object from flat keys
    const seo = req.body.seo || {};
    if (req.body["seo[title]"]) seo.title = req.body["seo[title]"];
    if (req.body["seo[description]"])
      seo.description = req.body["seo[description]"];
    if (req.body["seo[keywords][]"]) {
      seo.keywords = Array.isArray(req.body["seo[keywords][]"])
        ? req.body["seo[keywords][]"]
        : [req.body["seo[keywords][]"]];
    }
    if (Object.keys(seo).length > 0) {
      req.body.seo = seo;
    }
  }

  // Handle Slug
  const createSlug = (text) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF\u0750-\u077F\-]/g, "")
      .replace(/-+/g, "-");
  };

  if (req.body.slug) {
    req.body.slug = createSlug(req.body.slug);
  } else if (req.body.title && req.body.title !== article.title) {
    req.body.slug = createSlug(req.body.title);
  }

  // Set publishedAt if status changed to published
  if (
    req.body.status === "published" &&
    article.status !== "published" &&
    !article.publishedAt
  ) {
    req.body.publishedAt = Date.now();
  }

  article = await Article.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return ApiResponse.success(res, article, "Article updated successfully");
});

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private/Admin
export const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  await article.deleteOne();

  return ApiResponse.success(res, null, "Article deleted successfully");
});
// @desc    Sync article analytics from GA4
// @route   POST /api/articles/sync-analytics
// @access  Private/Admin
export const syncAnalytics = asyncHandler(async (req, res) => {
  const result = await AnalyticsService.syncAllArticleStats();
  return ApiResponse.success(res, result, "Analytics sync completed");
});
