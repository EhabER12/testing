import Article from "../models/articleModel.js";
import SeoStats from "../models/seoStatsModel.js";
import googleSearchConsoleService from "./googleSearchConsoleService.js";

/**
 * Content Health Service
 * Monitors content decay, cannibalization, and overall content health
 */
export class ContentHealthService {
  constructor() {
    this.decayThreshold = 5; // Position drop to flag as decay
    this.comparisonDays = 30; // Compare current vs 30 days ago
  }

  /**
   * Detect content decay - articles losing rankings
   */
  async detectContentDecay() {
    const decayingArticles = [];

    // Get all published articles with SEO data
    const articles = await Article.find({
      status: "published",
      "seoData.lastCheck": { $exists: true },
    })
      .select("title slug seoData")
      .lean();

    for (const article of articles) {
      // Get historical stats
      const thirtyDaysAgo = new Date(
        Date.now() - this.comparisonDays * 24 * 60 * 60 * 1000
      );

      const historicalStats = await SeoStats.findOne({
        articleId: article._id,
        date: { $lte: thirtyDaysAgo },
      })
        .sort({ date: -1 })
        .lean();

      if (!historicalStats) continue;

      const currentPosition = article.seoData?.avgPos7d || 0;
      const previousPosition = historicalStats.position || 0;

      // Only flag if was previously ranking well and dropped
      if (
        previousPosition > 0 &&
        previousPosition <= 20 &&
        currentPosition > previousPosition + this.decayThreshold
      ) {
        decayingArticles.push({
          articleId: article._id,
          title: article.title,
          slug: article.slug,
          previousPosition: previousPosition.toFixed(1),
          currentPosition: currentPosition.toFixed(1),
          decayAmount: (currentPosition - previousPosition).toFixed(1),
          severity: this.getDecaySeverity(currentPosition - previousPosition),
          recommendation: this.getDecayRecommendation(
            currentPosition - previousPosition
          ),
        });
      }
    }

    // Sort by decay amount (worst first)
    decayingArticles.sort(
      (a, b) => parseFloat(b.decayAmount) - parseFloat(a.decayAmount)
    );

    return decayingArticles;
  }

  /**
   * Detect keyword cannibalization
   * Multiple pages competing for the same keyword
   */
  async detectCannibalization() {
    const cannibalizationIssues = [];

    // Get recent SEO stats with queries
    const recentStats = await SeoStats.find({
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      "queries.0": { $exists: true },
    })
      .populate("articleId", "title slug")
      .lean();

    // Build keyword -> pages map
    const keywordPages = {};

    for (const stat of recentStats) {
      if (!stat.articleId) continue;

      for (const query of stat.queries || []) {
        const keyword = query.query?.toLowerCase();
        if (!keyword || query.impressions < 10) continue;

        if (!keywordPages[keyword]) {
          keywordPages[keyword] = [];
        }

        keywordPages[keyword].push({
          articleId: stat.articleId._id,
          title: stat.articleId.title,
          slug: stat.articleId.slug,
          position: query.position,
          impressions: query.impressions,
          clicks: query.clicks,
        });
      }
    }

    // Find keywords with multiple pages
    for (const [keyword, pages] of Object.entries(keywordPages)) {
      if (pages.length > 1) {
        // Sort by position (best first)
        pages.sort((a, b) => a.position - b.position);

        // Only flag if positions are close (both trying to rank)
        const bestPosition = pages[0].position;
        const competingPages = pages.filter(
          (p) => p.position <= bestPosition + 15
        );

        if (competingPages.length > 1) {
          cannibalizationIssues.push({
            keyword,
            pages: competingPages.map((p) => ({
              title: p.title,
              slug: p.slug,
              position: p.position.toFixed(1),
              impressions: p.impressions,
            })),
            severity: this.getCannibalizationSeverity(competingPages),
            recommendation: this.getCannibalizationRecommendation(
              keyword,
              competingPages
            ),
          });
        }
      }
    }

    // Sort by number of competing pages
    cannibalizationIssues.sort((a, b) => b.pages.length - a.pages.length);

    return cannibalizationIssues;
  }

  /**
   * Generate comprehensive health report
   */
  async generateHealthReport() {
    const [decayIssues, cannibalizationIssues] = await Promise.all([
      this.detectContentDecay(),
      this.detectCannibalization(),
    ]);

    const totalArticles = await Article.countDocuments({ status: "published" });

    return {
      generatedAt: new Date(),
      summary: {
        totalArticles,
        decayingArticles: decayIssues.length,
        cannibalizationIssues: cannibalizationIssues.length,
        healthScore: this.calculateHealthScore(
          totalArticles,
          decayIssues.length,
          cannibalizationIssues.length
        ),
      },
      decayAlerts: decayIssues.slice(0, 10), // Top 10
      cannibalizationAlerts: cannibalizationIssues.slice(0, 10),
      recommendations: this.generateTopRecommendations(
        decayIssues,
        cannibalizationIssues
      ),
    };
  }

  /**
   * Get severity level for decay
   */
  getDecaySeverity(decayAmount) {
    if (decayAmount >= 15) return "critical";
    if (decayAmount >= 10) return "high";
    if (decayAmount >= 5) return "medium";
    return "low";
  }

  /**
   * Get recommendation for decay
   */
  getDecayRecommendation(decayAmount) {
    if (decayAmount >= 15) {
      return "المحتوى يحتاج إعادة كتابة عاجلة - Content needs urgent refresh";
    }
    if (decayAmount >= 10) {
      return "تحديث المحتوى بإضافة معلومات جديدة - Update with fresh information";
    }
    return "مراجعة الكلمات المفتاحية والعناوين - Review keywords and headings";
  }

  /**
   * Get severity for cannibalization
   */
  getCannibalizationSeverity(pages) {
    // If both pages are in top 10, it's critical
    const topTenPages = pages.filter((p) => p.position <= 10);
    if (topTenPages.length >= 2) return "critical";
    if (pages.length >= 3) return "high";
    return "medium";
  }

  /**
   * Get recommendation for cannibalization
   */
  getCannibalizationRecommendation(keyword, pages) {
    const bestPage = pages[0];
    return (
      `دمج المحتوى في "${bestPage.title}" أو إضافة canonical - ` +
      `Consolidate content to "${bestPage.title}" or add canonical`
    );
  }

  /**
   * Calculate overall health score (0-100)
   */
  calculateHealthScore(total, decaying, cannibalized) {
    if (total === 0) return 100;

    const decayPenalty = (decaying / total) * 40;
    const cannibalizationPenalty = (cannibalized / total) * 30;

    return Math.max(0, Math.round(100 - decayPenalty - cannibalizationPenalty));
  }

  /**
   * Generate top recommendations
   */
  generateTopRecommendations(decayIssues, cannibalizationIssues) {
    const recommendations = [];

    if (decayIssues.length > 0) {
      recommendations.push({
        priority: "high",
        type: "content_refresh",
        title: "تحديث المحتوى المتراجع",
        description: `${decayIssues.length} مقالات تفقد ترتيبها، أولوية التحديث للمقالات الأكثر تراجعاً`,
        articles: decayIssues.slice(0, 3).map((d) => d.slug),
      });
    }

    if (cannibalizationIssues.length > 0) {
      recommendations.push({
        priority: "medium",
        type: "fix_cannibalization",
        title: "حل مشاكل التنافس الداخلي",
        description: `${cannibalizationIssues.length} كلمات مفتاحية تتنافس عليها صفحات متعددة`,
        keywords: cannibalizationIssues.slice(0, 3).map((c) => c.keyword),
      });
    }

    return recommendations;
  }

  /**
   * Flag articles that need refresh
   */
  async getArticlesNeedingRefresh(limit = 10) {
    const decayIssues = await this.detectContentDecay();

    return decayIssues.slice(0, limit).map((issue) => ({
      articleId: issue.articleId,
      title: issue.title,
      slug: issue.slug,
      reason: `Position dropped from ${issue.previousPosition} to ${issue.currentPosition}`,
      urgency: issue.severity,
    }));
  }
}

export default new ContentHealthService();
