import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import Article from "../models/articleModel.js";
import SeoStats from "../models/seoStatsModel.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Google Service Account credentials JSON
const SERVICE_ACCOUNT_KEY_PATH = path.join(
  __dirname,
  "../config/genoun-web-2aa0214ac388.json"
);

// Your verified site URL in Google Search Console
const SITE_URL = process.env.GSC_SITE_URL || "https://genoun.com/";

export class GoogleSearchConsoleService {
  constructor() {
    this.auth = null;
    this.webmasters = null;
  }

  /**
   * Initialize authentication with Google APIs
   */
  async initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_KEY_PATH,
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });

      this.auth = await auth.getClient();
      this.webmasters = google.webmasters({ version: "v3", auth: this.auth });

      logger.success("Google Search Console service initialized");
      return true;
    } catch (error) {
      logger.error("Failed to initialize GSC service", { error: error.message });
      return false;
    }
  }

  /**
   * Test the connection to GSC
   */
  async testConnection() {
    try {
      await this.initialize();
      const response = await this.webmasters.sites.list();
      const sites = response.data.siteEntry || [];
      logger.info("Connected sites", { sites: sites.map((s) => s.siteUrl) });
      return { success: true, sites };
    } catch (error) {
      logger.error("GSC connection test failed", { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch overall site performance metrics
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   */
  async getSiteStats(startDate, endDate) {
    if (!this.webmasters) await this.initialize();

    try {
      const response = await this.webmasters.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: [],
          rowLimit: 1,
        },
      });

      const row = response.data.rows?.[0] || {};
      return {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      };
    } catch (error) {
      logger.error("Error fetching site stats", { error: error.message });
      throw error;
    }
  }

  /**
   * Fetch performance metrics for a specific page URL
   * @param {string} pageUrl - Full URL of the page
   * @param {string} startDate
   * @param {string} endDate
   */
  async getPageStats(pageUrl, startDate, endDate) {
    if (!this.webmasters) await this.initialize();

    try {
      const response = await this.webmasters.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ["page"],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: "page",
                  expression: pageUrl,
                },
              ],
            },
          ],
          rowLimit: 1,
        },
      });

      const row = response.data.rows?.[0] || {};
      return {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      };
    } catch (error) {
      logger.error("Error fetching page stats", { pageUrl, error: error.message });
      throw error;
    }
  }

  /**
   * Get top queries driving traffic to a specific page
   * @param {string} pageUrl
   * @param {string} startDate
   * @param {string} endDate
   * @param {number} limit
   */
  async getPageQueries(pageUrl, startDate, endDate, limit = 25) {
    if (!this.webmasters) await this.initialize();

    try {
      const response = await this.webmasters.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ["query"],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: "page",
                  expression: pageUrl,
                },
              ],
            },
          ],
          rowLimit: limit,
        },
      });

      return (response.data.rows || []).map((row) => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (error) {
      logger.error("Error fetching page queries", { pageUrl, error: error.message });
      throw error;
    }
  }

  /**
   * Find "Striking Distance" keywords (Rank 4-20, high impressions)
   * These are great optimization opportunities
   */
  async getStrikingDistanceKeywords(startDate, endDate, limit = 50) {
    if (!this.webmasters) await this.initialize();

    try {
      const response = await this.webmasters.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ["query", "page"],
          rowLimit: 5000,
        },
      });

      // Filter for keywords ranking positions 4-20 with high impressions
      const opportunities = (response.data.rows || [])
        .filter((row) => row.position >= 4 && row.position <= 20)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, limit)
        .map((row) => ({
          keyword: row.keys[0],
          page: row.keys[1],
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
        }));

      return opportunities;
    } catch (error) {
      logger.error("Error fetching striking distance keywords", { error: error.message });
      throw error;
    }
  }

  /**
   * Sync GSC data for all published articles
   */
  async syncAllArticleStats() {
    if (!this.webmasters) await this.initialize();

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const articles = await Article.find({ status: "published" });
    let synced = 0;
    let errors = 0;

    for (const article of articles) {
      const pageUrl = `${SITE_URL.replace(/\/$/, "")}/blog/${article.slug}`;

      try {
        // Get page stats
        const stats = await this.getPageStats(pageUrl, startDate, endDate);
        const queries = await this.getPageQueries(pageUrl, startDate, endDate);

        // Upsert to SeoStats
        await SeoStats.findOneAndUpdate(
          { articleId: article._id, date: new Date(endDate) },
          {
            articleId: article._id,
            date: new Date(endDate),
            clicks: stats.clicks,
            impressions: stats.impressions,
            ctr: stats.ctr,
            position: stats.position,
            queries,
          },
          { upsert: true, new: true }
        );

        // Update article's quick-access seoData
        article.seoData = {
          lastCheck: new Date(),
          clicks7d: stats.clicks,
          impressions7d: stats.impressions,
          avgPos7d: stats.position,
        };
        await article.save();

        synced++;
      } catch (error) {
        logger.error("Failed to sync article", { slug: article.slug, error: error.message });
        errors++;
      }
    }

    logger.success("GSC Sync Complete", { synced, errors, total: articles.length });
    return { synced, errors, total: articles.length };
  }
}

export default new GoogleSearchConsoleService();
