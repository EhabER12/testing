import googleSearchConsoleService from "../services/googleSearchConsoleService.js";
import geoOptimizationService from "../services/geoOptimizationService.js";
import contentHealthService from "../services/contentHealthService.js";
import internalLinkingService from "../services/internalLinkingService.js";
import schemaMarkupService from "../services/schemaMarkupService.js";
import SeoStats from "../models/seoStatsModel.js";
import GeoSuggestion from "../models/geoSuggestionModel.js";
import Article from "../models/articleModel.js";

/**
 * @desc    Test GSC connection
 * @route   GET /api/seo/test-connection
 * @access  Private/Admin
 */
export const testGscConnection = async (req, res, next) => {
  try {
    const result = await googleSearchConsoleService.testConnection();
    res.status(200).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sync all article stats from GSC
 * @route   POST /api/seo/sync
 * @access  Private/Admin
 */
export const syncGscData = async (req, res, next) => {
  try {
    const result = await googleSearchConsoleService.syncAllArticleStats();
    res.status(200).json({
      success: true,
      data: result,
      message: `Synced ${result.synced} articles`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get site-wide SEO stats
 * @route   GET /api/seo/site-stats
 * @access  Private/Admin
 */
export const getSiteStats = async (req, res, next) => {
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const stats = await googleSearchConsoleService.getSiteStats(
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        period: { startDate, endDate },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get "striking distance" keyword opportunities
 * @route   GET /api/seo/opportunities/keywords
 * @access  Private/Admin
 */
export const getKeywordOpportunities = async (req, res, next) => {
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const opportunities =
      await googleSearchConsoleService.getStrikingDistanceKeywords(
        startDate,
        endDate,
        50
      );

    res.status(200).json({
      success: true,
      count: opportunities.length,
      data: opportunities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top performing articles with SEO data
 * @route   GET /api/seo/articles
 * @access  Private/Admin
 */
export const getArticlesWithSeoData = async (req, res, next) => {
  try {
    const articles = await Article.find({
      status: "published",
      "seoData.lastCheck": { $exists: true },
    })
      .select("title slug seoData aiSearchOptimized createdAt")
      .sort({ "seoData.impressions7d": -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Run GEO audit on a specific article
 * @route   POST /api/seo/audit/:articleId
 * @access  Private/Admin
 */
export const auditArticle = async (req, res, next) => {
  try {
    const result = await geoOptimizationService.auditArticle(
      req.params.articleId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `Generated ${result.suggestionsGenerated} suggestions`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending GEO suggestions
 * @route   GET /api/seo/suggestions
 * @access  Private/Admin
 */
export const getPendingSuggestions = async (req, res, next) => {
  try {
    const suggestions = await geoOptimizationService.getPendingSuggestions(50);

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Apply a suggestion
 * @route   POST /api/seo/suggestions/:id/apply
 * @access  Private/Admin
 */
export const applySuggestion = async (req, res, next) => {
  try {
    const result = await geoOptimizationService.applySuggestion(req.params.id);

    res.status(200).json({
      success: result.success,
      data: result.suggestion,
      message: result.success
        ? "Suggestion applied successfully"
        : "Failed to apply suggestion",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a suggestion
 * @route   POST /api/seo/suggestions/:id/reject
 * @access  Private/Admin
 */
export const rejectSuggestion = async (req, res, next) => {
  try {
    const suggestion = await GeoSuggestion.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        adminFeedback: req.body.reason || "",
      },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
    }

    res.status(200).json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get content health report (decay + cannibalization)
 * @route   GET /api/seo/health
 * @access  Private/Admin
 */
export const getContentHealthReport = async (req, res, next) => {
  try {
    const report = await contentHealthService.generateHealthReport();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get articles needing refresh (content decay)
 * @route   GET /api/seo/health/decay
 * @access  Private/Admin
 */
export const getDecayingContent = async (req, res, next) => {
  try {
    const articles = await contentHealthService.getArticlesNeedingRefresh(20);

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get orphan pages (no internal links)
 * @route   GET /api/seo/links/orphans
 * @access  Private/Admin
 */
export const getOrphanPages = async (req, res, next) => {
  try {
    const orphans = await internalLinkingService.findOrphanPages();

    res.status(200).json({
      success: true,
      count: orphans.length,
      data: orphans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get internal linking report
 * @route   GET /api/seo/links/report
 * @access  Private/Admin
 */
export const getInternalLinkingReport = async (req, res, next) => {
  try {
    const report = await internalLinkingService.generateLinkingReport();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get schema markup for an article
 * @route   GET /api/seo/schema/article/:id
 * @access  Public
 */
export const getArticleSchema = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate("author", "name")
      .lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const locale = req.query.locale || article.language || "ar";
    const schema = schemaMarkupService.generateArticleSchema(article, locale);

    res.status(200).json({
      success: true,
      data: {
        schema,
        scriptTag: schemaMarkupService.toScriptTag(schema),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Optimize article for featured snippet
 * @route   POST /api/seo/optimize/snippet/:articleId
 * @access  Private/Admin
 */
export const optimizeForSnippet = async (req, res, next) => {
  try {
    const { targetQuery } = req.body;

    if (!targetQuery) {
      return res.status(400).json({
        success: false,
        message: "targetQuery is required",
      });
    }

    const article = await Article.findById(req.params.articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const result = await geoOptimizationService.optimizeForFeaturedSnippet(
      article,
      targetQuery
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate At-a-Glance summary for AI citation
 * @route   POST /api/seo/optimize/summary/:articleId
 * @access  Private/Admin
 */
export const generateAISummary = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const summary = await geoOptimizationService.generateAtAGlanceSummary(
      article
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
