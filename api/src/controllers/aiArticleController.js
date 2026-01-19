import AiArticleSettings from "../models/aiArticleSettingsModel.js";
import AiArticleJob from "../models/aiArticleJobModel.js";
import { AiArticleService } from "../services/aiArticleService.js";
import { AiArticleSchedulerService } from "../services/aiArticleSchedulerService.js";
import { WhatsappNotificationService } from "../services/whatsappNotificationService.js";
import { asyncHandler } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import slugify from "slugify";
import { ImageSearchService } from "../services/imageSearchService.js";

const schedulerService = new AiArticleSchedulerService();
const aiArticleService = new AiArticleService();
const whatsappService = new WhatsappNotificationService();

// @desc    Get AI article settings
// @route   GET /api/ai-articles/settings
// @access  Private/Admin
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await AiArticleSettings.findOne()
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!settings) {
    // Return empty settings structure
    return ApiResponse.success(res, {
      exists: false,
      settings: null,
    });
  }

  return ApiResponse.success(res, {
    exists: true,
    settings,
  });
});

// @desc    Create or update AI article settings
// @route   POST /api/ai-articles/settings
// @access  Private/Admin
export const updateSettings = asyncHandler(async (req, res) => {
  const {
    promptTemplate,
    numberOfParagraphs,
    averageWordsPerParagraph,
    targetKeywords,
    language,
    includeImages,
    includeCoverImage,
    imageSearchKeywords,
    autoPublish,
    totalArticlesNeeded,
    articlesPerDay,
    startDate,
    generationTime,
    whatsappNotificationNumbers,
    notifyOnCompletion,
    isActive,
  } = req.body;

  let settings = await AiArticleSettings.findOne();

  const updateData = {
    promptTemplate,
    numberOfParagraphs,
    averageWordsPerParagraph,
    targetKeywords,
    language,
    includeImages,
    includeCoverImage,
    imageSearchKeywords,
    autoPublish,
    totalArticlesNeeded,
    articlesPerDay,
    startDate,
    generationTime,
    whatsappNotificationNumbers,
    notifyOnCompletion,
    isActive,
    updatedBy: req.user.id,
  };

  // Remove undefined values
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  if (settings) {
    settings = await AiArticleSettings.findByIdAndUpdate(
      settings._id,
      updateData,
      { new: true, runValidators: true }
    );
  } else {
    settings = await AiArticleSettings.create({
      ...updateData,
      createdBy: req.user.id,
    });
  }

  return ApiResponse.success(res, settings, "Settings updated successfully");
});

// @desc    Get progress stats
// @route   GET /api/ai-articles/progress
// @access  Private/Admin
export const getProgress = asyncHandler(async (req, res) => {
  const progress = await schedulerService.getProgress();

  if (!progress) {
    return ApiResponse.success(res, {
      configured: false,
      message: "AI article settings not configured",
    });
  }

  return ApiResponse.success(res, {
    configured: true,
    ...progress,
  });
});

// @desc    Add ready titles
// @route   POST /api/ai-articles/titles
// @access  Private/Admin
export const addTitles = asyncHandler(async (req, res) => {
  const { titles } = req.body;

  if (!titles || !Array.isArray(titles) || titles.length === 0) {
    throw new ApiError(400, "Please provide an array of titles");
  }

  let settings = await AiArticleSettings.findOne();

  if (!settings) {
    settings = await AiArticleSettings.create({
      createdBy: req.user.id,
      readyTitles: titles.map((title) => ({ title: title.trim() })),
    });
  } else {
    // Add new titles
    const newTitles = titles.map((title) => ({ title: title.trim() }));
    settings.readyTitles.push(...newTitles);
    settings.updatedBy = req.user.id;
    await settings.save();
  }

  return ApiResponse.success(
    res,
    {
      totalTitles: settings.readyTitles.length,
      unusedTitles: settings.readyTitles.filter((t) => !t.used).length,
      addedCount: titles.length,
    },
    `Added ${titles.length} titles successfully`
  );
});

// @desc    Remove a title
// @route   DELETE /api/ai-articles/titles/:id
// @access  Private/Admin
export const removeTitle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const settings = await AiArticleSettings.findOne();

  if (!settings) {
    throw new ApiError(404, "Settings not found");
  }

  const titleIndex = settings.readyTitles.findIndex(
    (t) => t._id.toString() === id
  );

  if (titleIndex === -1) {
    throw new ApiError(404, "Title not found");
  }

  const removedTitle = settings.readyTitles[titleIndex];

  if (removedTitle.used) {
    throw new ApiError(400, "Cannot remove a title that has already been used");
  }

  settings.readyTitles.splice(titleIndex, 1);
  settings.updatedBy = req.user.id;
  await settings.save();

  return ApiResponse.success(res, null, "Title removed successfully");
});

// @desc    Get all titles
// @route   GET /api/ai-articles/titles
// @access  Private/Admin
export const getTitles = asyncHandler(async (req, res) => {
  const { status } = req.query; // "used", "unused", or "all"

  const settings = await AiArticleSettings.findOne();

  if (!settings) {
    return ApiResponse.success(res, { titles: [], total: 0 });
  }

  let titles = settings.readyTitles;

  if (status === "used") {
    titles = titles.filter((t) => t.used);
  } else if (status === "unused") {
    titles = titles.filter((t) => !t.used);
  }

  return ApiResponse.success(res, {
    titles,
    total: settings.readyTitles.length,
    used: settings.readyTitles.filter((t) => t.used).length,
    unused: settings.readyTitles.filter((t) => !t.used).length,
  });
});

// @route   POST /api/ai-articles/test-prompt
// @access  Private/Admin
export const testPrompt = asyncHandler(async (req, res) => {
  const { promptTemplate, sampleTitle, settings: testSettings } = req.body;

  // Get current settings or use provided test settings
  let settings = await AiArticleSettings.findOne();

  if (!settings && !testSettings) {
    throw new ApiError(400, "No settings available for testing");
  }

  // Create test config with all settings for full experience
  const testConfig = {
    promptTemplate: promptTemplate || settings?.promptTemplate,
    numberOfParagraphs:
      testSettings?.numberOfParagraphs || settings?.numberOfParagraphs || 5,
    averageWordsPerParagraph:
      testSettings?.averageWordsPerParagraph ||
      settings?.averageWordsPerParagraph ||
      150,
    targetKeywords:
      testSettings?.targetKeywords || settings?.targetKeywords || [],
    language: testSettings?.language || settings?.language || "ar",
    // Image settings
    includeImages: settings?.includeImages ?? true,
    includeCoverImage: settings?.includeCoverImage ?? true,
    imageSearchKeywords: settings?.imageSearchKeywords || [],
    // Publishing
    autoPublish: settings?.autoPublish ?? false,
    // WhatsApp notification
    notifyOnCompletion: settings?.notifyOnCompletion ?? false,
    whatsappNotificationNumbers: settings?.whatsappNotificationNumbers || [],
  };

  const title = sampleTitle || "عنوان تجريبي للمقال";

  const result = await aiArticleService.testPrompt(testConfig, title);

  // Generate slug from title (handles Arabic and other languages)
  let generatedSlug = slugify(result.parsed.title, {
    lower: true,
    strict: true,
    locale: testConfig.language === "ar" ? "ar" : "en",
  });

  // If slug is empty (e.g., all Arabic chars removed), use timestamp + random
  if (!generatedSlug || generatedSlug.length < 3) {
    generatedSlug = `article-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  } else {
    // Always add timestamp suffix to ensure uniqueness
    generatedSlug = `${generatedSlug}-${Date.now().toString(36)}`;
  }

  // Fetch images if enabled
  let images = { coverImage: null, contentImages: [] };
  if (testConfig.includeImages || testConfig.includeCoverImage) {
    try {
      const imageService = new ImageSearchService();

      const imageConfig = {
        ...testConfig,
        imageSearchKeywords:
          testConfig.imageSearchKeywords?.length > 0
            ? testConfig.imageSearchKeywords
            : result.parsed.seo?.keywords || [],
        targetKeywords:
          testConfig.targetKeywords?.length > 0
            ? testConfig.targetKeywords
            : result.parsed.seo?.keywords || [],
      };

      images = await imageService.getImagesForArticle(imageConfig);
    } catch (error) {
      console.warn("Image fetch failed for test:", error.message);
    }
  }

  const articleData = {
    ...result.parsed,
    slug: generatedSlug,
    language: testConfig.language,
    autoPublish: testConfig.autoPublish,
  };

  // Create article with images
  const article = await aiArticleService.createArticle(
    articleData,
    req.user.id,
    images
  );

  // Build URLs for response - use FRONTEND_URL and BASE_URL from env
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const backendUrl = process.env.BASE_URL || "http://localhost:3001";
  const articleUrl =
    article.status === "published"
      ? `${frontendUrl}/articles/${article.slug}`
      : `${frontendUrl}/dashboard/articles/${article.slug}/edit`;
  // Build cover image URL using backend BASE_URL
  const coverImageUrl = article.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : `${backendUrl}${article.coverImage}`
    : null;
  if (
    testConfig.notifyOnCompletion &&
    testConfig.whatsappNotificationNumbers.length > 0
  ) {
    try {
      const statusText =
        article.status === "published"
          ? testConfig.language === "ar"
            ? "منشور"
            : "Published"
          : testConfig.language === "ar"
          ? "مسودة"
          : "Draft";

      const message =
        testConfig.language === "ar"
          ? `✅ تم إنشاء مقال جديد!\n\n📝 العنوان: ${article.title}\n📊 الحالة: ${statusText}\n🔗 الرابط: ${articleUrl}`
          : `✅ New article created!\n\n📝 Title: ${article.title}\n📊 Status: ${statusText}\n🔗 URL: ${articleUrl}`;

      for (const number of testConfig.whatsappNotificationNumbers) {
        try {
          // Send with cover image if available
          if (coverImageUrl) {
            await whatsappService.sendMediaMessage(
              number,
              coverImageUrl,
              message
            );
          } else {
            await whatsappService.sendMessage(number, message);
          }
        } catch (error) {
          console.warn(
            `WhatsApp notification failed to ${number}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.warn("WhatsApp notification error:", error.message);
    }
  }

  return ApiResponse.success(res, {
    ...result,
    article: {
      _id: article._id,
      title: article.title,
      slug: article.slug,
      status: article.status,
      coverImage: article.coverImage,
      url: articleUrl,
    },
  });
});

// @desc    Manually trigger article generation
// @route   POST /api/ai-articles/generate-now
// @access  Private/Admin
export const generateNow = asyncHandler(async (req, res) => {
  const { count = 1 } = req.body;

  if (count < 1 || count > 10) {
    throw new ApiError(400, "Count must be between 1 and 10");
  }

  const results = await schedulerService.generateNow(count);

  const summary = {
    requested: count,
    completed: results.filter((r) => r.status === "completed").length,
    failed: results.filter((r) => r.status === "failed").length,
    articles: results
      .filter((r) => r.articleId)
      .map((r) => ({
        id: r.articleId._id,
        title: r.articleId.title,
        slug: r.articleId.slug,
        status: r.articleId.status,
      })),
  };

  return ApiResponse.success(
    res,
    summary,
    `Generated ${summary.completed} articles`
  );
});

// @desc    Get job history
// @route   GET /api/ai-articles/jobs
// @access  Private/Admin
export const getJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const jobs = await AiArticleJob.find(query)
    .populate("articleId", "title slug status")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await AiArticleJob.countDocuments(query);

  return ApiResponse.success(res, {
    jobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Retry a failed job
// @route   POST /api/ai-articles/jobs/:id/retry
// @access  Private/Admin
export const retryJob = asyncHandler(async (req, res) => {
  const job = await AiArticleJob.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.status !== "failed") {
    throw new ApiError(400, "Only failed jobs can be retried");
  }

  const canRetry = await job.retry();

  if (!canRetry) {
    throw new ApiError(400, "Maximum retry attempts reached");
  }

  return ApiResponse.success(res, job, "Job scheduled for retry");
});

// @desc    Test WhatsApp notification
// @route   POST /api/ai-articles/test-whatsapp
// @access  Private/Admin
export const testWhatsapp = asyncHandler(async (req, res) => {
  const { number } = req.body;

  if (!number) {
    throw new ApiError(400, "Phone number is required");
  }

  const result = await whatsappService.testConnection(number);

  if (result.success) {
    return ApiResponse.success(res, result, "Test message sent successfully");
  } else {
    throw new ApiError(500, `WhatsApp test failed: ${result.error}`);
  }
});

// @desc    Cancel pending jobs
// @route   POST /api/ai-articles/cancel-pending
// @access  Private/Admin
export const cancelPendingJobs = asyncHandler(async (req, res) => {
  const result = await AiArticleJob.updateMany(
    { status: "pending" },
    { status: "cancelled" }
  );

  return ApiResponse.success(
    res,
    { cancelledCount: result.modifiedCount },
    `Cancelled ${result.modifiedCount} pending jobs`
  );
});

// @desc    Reset settings (clear generated count)
// @route   POST /api/ai-articles/reset
// @access  Private/Admin
export const resetProgress = asyncHandler(async (req, res) => {
  const { resetTitles = false } = req.body;

  const settings = await AiArticleSettings.findOne();

  if (!settings) {
    throw new ApiError(404, "Settings not found");
  }

  settings.articlesGenerated = 0;
  settings.lastGeneratedAt = null;

  if (resetTitles) {
    settings.readyTitles.forEach((title) => {
      title.used = false;
      title.usedAt = null;
      title.articleId = null;
    });
  }

  await settings.save();

  // Cancel all pending jobs
  await AiArticleJob.updateMany({ status: "pending" }, { status: "cancelled" });

  return ApiResponse.success(res, null, "Progress reset successfully");
});
