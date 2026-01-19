import cron from "node-cron";
import AiArticleSettings from "../models/aiArticleSettingsModel.js";
import AiArticleJob from "../models/aiArticleJobModel.js";
import { AiArticleService } from "./aiArticleService.js";
import { ImageSearchService } from "./imageSearchService.js";
import { WhatsappNotificationService } from "./whatsappNotificationService.js";
import User from "../models/userModel.js";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";

export class AiArticleSchedulerService {
  constructor() {
    this.aiArticleService = new AiArticleService();
    this.imageSearchService = new ImageSearchService();
    this.whatsappNotificationService = new WhatsappNotificationService();
    this.scheduledTask = null;
    this.isProcessing = false;
  }

  /**
   * Initialize the scheduler on server startup
   */
  async initialize() {
    logger.info("Initializing AI Article Scheduler...");

    try {
      // Initialize AI service
      await this.aiArticleService.initialize();

      // Schedule the main job runner (runs every minute to check for pending jobs)
      this.scheduledTask = cron.schedule("* * * * *", async () => {
        await this.processPendingJobs();
      });

      // Schedule daily job creation (runs at midnight)
      cron.schedule("0 0 * * *", async () => {
        await this.createDailyJobs();
      });

      // Also create jobs for today if settings exist
      await this.createDailyJobs();

      logger.success("AI Article Scheduler initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize AI Article Scheduler", { error });
    }
  }

  /**
   * Create daily jobs based on settings
   */
  async createDailyJobs() {
    try {
      const settings = await AiArticleSettings.findOne({ isActive: true });

      if (!settings) {
        logger.info("No active AI article settings found");
        return;
      }

      // Check if we've reached the target
      if (settings.articlesGenerated >= settings.totalArticlesNeeded) {
        logger.info("Target articles reached, deactivating scheduler");
        settings.isActive = false;
        await settings.save();
        return;
      }

      // Check for unused titles
      const unusedTitles = settings.readyTitles.filter((t) => !t.used);
      if (unusedTitles.length === 0) {
        logger.info("No unused titles available for scheduling");
        return;
      }

      // Calculate how many articles to create today
      const remaining =
        settings.totalArticlesNeeded - settings.articlesGenerated;
      const articlesToday = Math.min(
        settings.articlesPerDay,
        remaining,
        unusedTitles.length
      );

      if (articlesToday <= 0) {
        return;
      }

      // Parse generation time
      const [hours, minutes] = settings.generationTime.split(":").map(Number);

      // Create batch ID for today
      const today = new Date();
      const batchId = `batch-${
        today.toISOString().split("T")[0]
      }-${uuidv4().substring(0, 8)}`;

      // Check if jobs for today already exist (count ALL statuses to prevent over-scheduling)
      const existingJobs = await AiArticleJob.countDocuments({
        settings: settings._id,
        scheduledFor: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      });

      if (existingJobs >= articlesToday) {
        logger.info("Jobs for today already exist", { existing: existingJobs, required: articlesToday });
        return;
      }

      const toCreate = articlesToday - existingJobs;

      logger.info("Creating article jobs for today", { count: toCreate });

      // Calculate time window for scheduling
      let startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);

      // If scheduled time is in the past, start from now
      if (startTime < new Date()) {
        startTime = new Date();
      }

      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      const availableMinutes = (endOfDay - startTime) / 1000 / 60;

      // Calculate average interval with some randomness
      // If requests > available time (unlikely), default to 5 mins
      const baseInterval = Math.max(5, Math.floor(availableMinutes / toCreate));

      // Create jobs
      let currentScheduledTime = new Date(startTime);

      for (let i = 0; i < toCreate; i++) {
        const title = unusedTitles[i];
        if (!title) break;

        // For the first job, schedule it near the start time
        // For subsequent jobs, add the interval + random variation
        if (i > 0) {
          const variation = Math.floor(Math.random() * 30) - 15; // +/- 15 mins variation
          const intervalWithVariation = Math.max(5, baseInterval + variation); // Ensure at least 5 mins
          currentScheduledTime = new Date(
            currentScheduledTime.getTime() + intervalWithVariation * 60000
          );
        }

        // Ensure we don't go past end of day (though strict enforcement might skip a job, better to just squeeze it in)
        if (currentScheduledTime > endOfDay) {
          currentScheduledTime = new Date(endOfDay.getTime() - 5 * 60000); // 5 mins before midnight
        }

        await AiArticleJob.create({
          settings: settings._id,
          titleUsed: title.title,
          titleId: title._id,
          scheduledFor: currentScheduledTime,
          batchId,
          batchIndex: i,
        });

        logger.debug("Scheduled article", { title: title.title, time: currentScheduledTime.toLocaleTimeString() });
      }

      logger.success("Created jobs for batch", { count: toCreate, batchId });
    } catch (error) {
      logger.error("Error creating daily jobs", { error });
    }
  }

  /**
   * Process pending jobs
   */
  async processPendingJobs() {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;

    try {
      const pendingJobs = await AiArticleJob.getPendingJobs(5);

      for (const job of pendingJobs) {
        await this.processJob(job);
      }

      // Check if any batches were completed
      await this.checkBatchCompletion();
    } catch (error) {
      logger.error("Error processing pending jobs", { error });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job
   */
  async processJob(job) {
    logger.info("Processing job", { title: job.titleUsed });

    try {
      await job.markInProgress();

      // Get settings
      const settings = await AiArticleSettings.findById(job.settings);
      if (!settings) {
        throw new Error("Settings not found");
      }

      // Get author (use settings creator)
      const author = await User.findById(settings.createdBy);
      if (!author) {
        throw new Error("Author not found");
      }

      // Generate article content
      const articleData = await this.aiArticleService.generateArticle(
        settings,
        job.titleUsed
      );

      // Get images if configured - use generated article's SEO keywords as fallback
      let images = {};
      if (settings.includeImages || settings.includeCoverImage) {
        // Build image config with article keywords as fallback
        const imageConfig = {
          ...settings.toObject(),
          // Use article's SEO keywords if settings don't have imageSearchKeywords
          imageSearchKeywords:
            settings.imageSearchKeywords?.length > 0
              ? settings.imageSearchKeywords
              : articleData.seo?.keywords || [],
          // Also fallback targetKeywords to article keywords
          targetKeywords:
            settings.targetKeywords?.length > 0
              ? settings.targetKeywords
              : articleData.seo?.keywords || [],
        };
        images = await this.imageSearchService.getImagesForArticle(imageConfig);
      }

      // Set auto-publish status
      articleData.autoPublish = settings.autoPublish;

      // Create article in database
      const article = await this.aiArticleService.createArticle(
        articleData,
        author._id,
        images
      );

      // Mark title as used
      await settings.markTitleUsed(job.titleId, article._id);

      // Update settings stats
      settings.articlesGenerated += 1;
      settings.lastGeneratedAt = new Date();
      await settings.save();

      // Mark job as completed
      await job.markCompleted(article._id, {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        imageUrls: [images.coverImage, ...images.contentImages].filter(Boolean),
      });

      logger.success("Job completed", { title: article.title, id: article._id });
    } catch (error) {
      logger.error("Job failed", { title: job.titleUsed, error });
      await job.markFailed(error);

      // Retry if possible
      if (await job.retry()) {
        logger.info("Job scheduled for retry", { attempt: job.retryCount });
      }
    }
  }

  /**
   * Check if any batches were completed and send notifications
   */
  async checkBatchCompletion() {
    try {
      // Find batches with all jobs completed
      const completedBatches = await AiArticleJob.aggregate([
        {
          $group: {
            _id: "$batchId",
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            pending: {
              $sum: {
                $cond: [{ $in: ["$status", ["pending", "in_progress"]] }, 1, 0],
              },
            },
            notified: { $max: "$notificationSent" },
            settingsId: { $first: "$settings" },
          },
        },
        {
          $match: {
            pending: 0,
            notified: { $ne: true },
          },
        },
      ]);

      for (const batch of completedBatches) {
        if (!batch._id) continue;

        // Get settings for notification numbers
        const settings = await AiArticleSettings.findById(batch.settingsId);
        if (
          !settings ||
          !settings.notifyOnCompletion ||
          settings.whatsappNotificationNumbers.length === 0
        ) {
          // Mark batch as notified anyway
          await AiArticleJob.updateMany(
            { batchId: batch._id },
            { notificationSent: true, notificationSentAt: new Date() }
          );
          continue;
        }

        // Get article details for notification
        const jobs = await AiArticleJob.find({
          batchId: batch._id,
          status: "completed",
        }).populate("articleId", "title slug");

        const articles = jobs
          .filter((j) => j.articleId)
          .map((j) => ({
            title: j.articleId.title,
            slug: j.articleId.slug,
          }));

        // Send notification
        const notificationResult =
          await this.whatsappNotificationService.sendArticleCompletionNotification(
            settings.whatsappNotificationNumbers,
            {
              generated: batch.completed,
              failed: batch.failed,
              total: settings.articlesPerDay,
              articles,
            }
          );

        // Mark batch jobs as notified
        await AiArticleJob.updateMany(
          { batchId: batch._id },
          {
            notificationSent: true,
            notificationSentAt: new Date(),
            notificationError: notificationResult.success
              ? null
              : JSON.stringify(notificationResult.results),
          }
        );

        logger.info("Batch notification sent", { batchId: batch._id, success: notificationResult.success });
      }
    } catch (error) {
      logger.error("Error checking batch completion", { error });
    }
  }

  /**
   * Manually trigger article generation (for testing)
   */
  async generateNow(count = 1) {
    const settings = await AiArticleSettings.findOne();
    if (!settings) {
      throw new Error("No AI article settings configured");
    }

    const unusedTitles = settings.readyTitles.filter((t) => !t.used);
    if (unusedTitles.length === 0) {
      throw new Error("No unused titles available");
    }

    const toGenerate = Math.min(count, unusedTitles.length);
    const batchId = `manual-${uuidv4().substring(0, 8)}`;
    const results = [];

    for (let i = 0; i < toGenerate; i++) {
      const title = unusedTitles[i];

      const job = await AiArticleJob.create({
        settings: settings._id,
        titleUsed: title.title,
        titleId: title._id,
        scheduledFor: new Date(),
        batchId,
        batchIndex: i,
      });

      await this.processJob(job);

      const updatedJob = await AiArticleJob.findById(job._id).populate(
        "articleId"
      );
      results.push(updatedJob);
    }

    return results;
  }

  /**
   * Get scheduler status and progress
   */
  async getProgress() {
    const settings = await AiArticleSettings.findOne();
    if (!settings) {
      return null;
    }

    const pendingJobs = await AiArticleJob.countDocuments({
      settings: settings._id,
      status: "pending",
    });

    const completedToday = await AiArticleJob.countDocuments({
      settings: settings._id,
      status: "completed",
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    const failedToday = await AiArticleJob.countDocuments({
      settings: settings._id,
      status: "failed",
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    return {
      isActive: settings.isActive,
      totalNeeded: settings.totalArticlesNeeded,
      generated: settings.articlesGenerated,
      remaining: settings.remainingArticles,
      progressPercentage: settings.progressPercentage,
      estimatedDaysRemaining: settings.estimatedDaysRemaining,
      articlesPerDay: settings.articlesPerDay,
      unusedTitles: settings.unusedTitlesCount,
      pendingJobs,
      completedToday,
      failedToday,
      lastGeneratedAt: settings.lastGeneratedAt,
    };
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      logger.info("AI Article Scheduler stopped");
    }
  }
}
