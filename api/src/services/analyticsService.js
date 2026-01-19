import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import Article from "../models/articleModel.js";
import Product from "../models/productModel.js";
import Service from "../models/serviceModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Google Service Account credentials JSON
const SERVICE_ACCOUNT_KEY_PATH = path.join(
  __dirname,
  "../config/genoun-web-2aa0214ac388.json"
);

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

export class AnalyticsService {
  constructor() {
    this.analyticsData = null;
    this.auth = null;
  }

  /**
   * Initialize authentication with Google APIs
   */
  async initialize() {
    if (this.analyticsData) return true;

    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_KEY_PATH,
        scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
      });

      // Validate Property ID
      if (PROPERTY_ID && PROPERTY_ID.startsWith("G-")) {
        console.warn(
          `Warning: GA4_PROPERTY_ID (${PROPERTY_ID}) looks like a Measurement ID. You need the numeric Property ID from Admin settings. Data fetching may fail.`
        );
      }

      this.auth = await auth.getClient();
      this.analyticsData = google.analyticsdata({
        version: "v1beta",
        auth: this.auth,
      });

      return true;
    } catch (error) {
      console.error(
        "❌ Failed to initialize Analytics service:",
        error.message
      );
      return false;
    }
  }

  /**
   * Helper to check if property ID is valid
   */
  hasValidConfiguration() {
    if (!PROPERTY_ID) return false;
    // Property ID should be numeric. If it starts with 'G-', it's a measurement ID.
    if (PROPERTY_ID.startsWith("G-")) {
      return false;
    }
    return true;
  }

  /**
   * Get overview metrics (Users, Sessions, Pageviews)
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   */
  async getOverviewMetrics(startDate = "30daysAgo", endDate = "today") {
    if (!this.analyticsData) await this.initialize();

    // Return zeros if configuration is invalid
    if (!this.hasValidConfiguration()) {
      return {
        users: 0,
        sessions: 0,
        pageViews: 0,
        avgSessionDuration: 0,
      };
    }

    try {
      // Use explicit dates as fallback if relative dates don't work
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const effectiveStartDate =
        startDate === "30daysAgo"
          ? thirtyDaysAgo.toISOString().split("T")[0]
          : startDate;
      const effectiveEndDate =
        endDate === "today" ? today.toISOString().split("T")[0] : endDate;

      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [
            { startDate: effectiveStartDate, endDate: effectiveEndDate },
          ],
          metrics: [
            { name: "totalUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "averageSessionDuration" },
          ],
        },
      });

      // Try to access rows differently in case of different response structure
      const rows = response.data?.rows || response.data?.data?.rows || [];
      const row = rows[0];

      if (!row) {
        console.log("⚠️ No rows returned from GA4.");
        return {
          users: 0,
          sessions: 0,
          pageViews: 0,
          avgSessionDuration: 0,
        };
      }

      return {
        users: parseInt(row.metricValues[0].value) || 0,
        sessions: parseInt(row.metricValues[1].value) || 0,
        pageViews: parseInt(row.metricValues[2].value) || 0,
        avgSessionDuration: parseFloat(row.metricValues[3].value) || 0,
      };
    } catch (error) {
      console.error("Error fetching overview metrics:", error.message);
      // Return safe default instead of null or throwing
      return {
        users: 0,
        sessions: 0,
        pageViews: 0,
        avgSessionDuration: 0,
      };
    }
  }

  /**
   * Get metrics for a specific article/page path
   * @param {string} pagePath - e.g., "/blog/my-article"
   * @param {string} startDate
   * @param {string} endDate
   */
  async getPageMetrics(pagePath, startDate = "30daysAgo", endDate = "today") {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) {
      return { pageViews: 0, users: 0, avgDuration: 0 };
    }

    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "totalUsers" },
            { name: "averageSessionDuration" },
          ],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: {
                matchType: "EXACT",
                value: pagePath,
              },
            },
          },
        },
      });

      const row = response.data.rows?.[0];
      if (!row) return { pageViews: 0, users: 0, avgDuration: 0 };

      return {
        pageViews: parseInt(row.metricValues[0].value) || 0,
        users: parseInt(row.metricValues[1].value) || 0,
        avgDuration: parseFloat(row.metricValues[2].value) || 0,
      };
    } catch (error) {
      console.error(`Error fetching metrics for ${pagePath}:`, error.message);
      return { pageViews: 0, users: 0, avgDuration: 0 };
    }
  }

  /**
   * Get top performing pages (excludes /dashboard/* paths)
   * @param {number} limit
   * @param {string} startDate
   * @param {string} endDate
   * @param {boolean} excludeDashboard - whether to exclude admin dashboard paths
   */
  async getTopPages(
    limit = 10,
    startDate = "30daysAgo",
    endDate = "today",
    excludeDashboard = true
  ) {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return [];

    try {
      // Query by path only to aggregate all views per path
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [
            {
              desc: true,
              metric: { metricName: "screenPageViews" },
            },
          ],
          limit: excludeDashboard ? 100 : limit, // Get more to filter dashboard
        },
      });

      let pages = (response.data.rows || []).map((row) => ({
        path: row.dimensionValues[0].value,
        title: "", // We'll set a proper title below
        views: parseInt(row.metricValues[0].value) || 0,
      }));

      // Filter out dashboard paths if requested
      if (excludeDashboard) {
        pages = pages.filter((page) => !page.path.startsWith("/dashboard"));
      }

      // Generate meaningful titles from paths
      pages = pages.map((page) => {
        let title = "";

        if (page.path === "/") {
          title = "الصفحة الرئيسية"; // Homepage
        } else if (page.path === "/checkout") {
          title = "الدفع"; // Checkout
        } else if (page.path.startsWith("/articles/")) {
          const slug = page.path.replace("/articles/", "").replace(/-/g, " ");
          title = slug.charAt(0).toUpperCase() + slug.slice(1);
        } else if (page.path.startsWith("/products/")) {
          const slug = page.path.replace("/products/", "").replace(/-/g, " ");
          title = slug.charAt(0).toUpperCase() + slug.slice(1);
        } else if (page.path.startsWith("/services/")) {
          const slug = page.path.replace("/services/", "").replace(/-/g, " ");
          title = slug.charAt(0).toUpperCase() + slug.slice(1);
        } else {
          title = page.path.replace(/\//g, " ").trim();
        }

        return { ...page, title };
      });


      return pages.slice(0, limit);
    } catch (error) {
      console.error("Error fetching top pages:", error.message);
      return [];
    }
  }

  /**
   * Get Real-time Active Users (last 30 minutes)
   */
  async getRealtimeActiveUsers() {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return 0;

    try {
      const response = await this.analyticsData.properties.runRealtimeReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          metrics: [{ name: "activeUsers" }],
        },
      });

      const rows = response.data.rows || [];
      return rows.length > 0 ? parseInt(rows[0].metricValues[0].value) : 0;
    } catch (error) {
      console.error("Error fetching realtime users:", error.message);
      return 0;
    }
  }

  /**
   * Get Top Countries by Users
   */
  async getTopCountries(limit = 5, startDate = "30daysAgo", endDate = "today") {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return [];

    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
          orderBys: [
            {
              desc: true,
              metric: { metricName: "activeUsers" },
            },
          ],
          limit,
        },
      });

      return (response.data.rows || []).map((row) => ({
        country: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value) || 0,
      }));
    } catch (error) {
      console.error("Error fetching top countries:", error.message);
      return [];
    }
  }

  /**
   * Get traffic sources (source/medium breakdown)
   */
  async getTrafficSources(
    limit = 10,
    startDate = "30daysAgo",
    endDate = "today"
  ) {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return [];

    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
          metrics: [{ name: "sessions" }, { name: "totalUsers" }],
          orderBys: [{ desc: true, metric: { metricName: "sessions" } }],
          limit,
        },
      });

      return (response.data.rows || []).map((row) => ({
        source: row.dimensionValues[0].value,
        medium: row.dimensionValues[1].value,
        sessions: parseInt(row.metricValues[0].value) || 0,
        users: parseInt(row.metricValues[1].value) || 0,
      }));
    } catch (error) {
      console.error("Error fetching traffic sources:", error.message);
      return [];
    }
  }

  /**
   * Get device breakdown (mobile/desktop/tablet)
   */
  async getDeviceBreakdown(startDate = "30daysAgo", endDate = "today") {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return [];

    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "sessions" }, { name: "totalUsers" }],
          orderBys: [{ desc: true, metric: { metricName: "sessions" } }],
        },
      });

      return (response.data.rows || []).map((row) => ({
        device: row.dimensionValues[0].value,
        sessions: parseInt(row.metricValues[0].value) || 0,
        users: parseInt(row.metricValues[1].value) || 0,
      }));
    } catch (error) {
      console.error("Error fetching device breakdown:", error.message);
      return [];
    }
  }

  /**
   * Get browser breakdown
   */
  async getBrowserBreakdown(
    limit = 5,
    startDate = "30daysAgo",
    endDate = "today"
  ) {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return [];

    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "browser" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ desc: true, metric: { metricName: "sessions" } }],
          limit,
        },
      });

      return (response.data.rows || []).map((row) => ({
        browser: row.dimensionValues[0].value,
        sessions: parseInt(row.metricValues[0].value) || 0,
      }));
    } catch (error) {
      console.error("Error fetching browser breakdown:", error.message);
      return [];
    }
  }

  /**
   * Get detailed metrics for a specific page
   */
  async getPageDetails(pagePath, startDate = "30daysAgo", endDate = "today") {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return null;

    try {
      // Get page metrics with country breakdown
      const [basicMetrics, countryBreakdown, deviceBreakdown] =
        await Promise.all([
          this.analyticsData.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
              dateRanges: [{ startDate, endDate }],
              dimensions: [{ name: "pagePath" }],
              metrics: [
                { name: "screenPageViews" },
                { name: "totalUsers" },
                { name: "averageSessionDuration" },
                { name: "bounceRate" },
              ],
              dimensionFilter: {
                filter: {
                  fieldName: "pagePath",
                  stringFilter: { matchType: "EXACT", value: pagePath },
                },
              },
            },
          }),
          this.analyticsData.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
              dateRanges: [{ startDate, endDate }],
              dimensions: [{ name: "pagePath" }, { name: "country" }],
              metrics: [{ name: "screenPageViews" }],
              dimensionFilter: {
                filter: {
                  fieldName: "pagePath",
                  stringFilter: { matchType: "EXACT", value: pagePath },
                },
              },
              orderBys: [
                { desc: true, metric: { metricName: "screenPageViews" } },
              ],
              limit: 5,
            },
          }),
          this.analyticsData.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
              dateRanges: [{ startDate, endDate }],
              dimensions: [{ name: "pagePath" }, { name: "deviceCategory" }],
              metrics: [{ name: "screenPageViews" }],
              dimensionFilter: {
                filter: {
                  fieldName: "pagePath",
                  stringFilter: { matchType: "EXACT", value: pagePath },
                },
              },
            },
          }),
        ]);

      const basicRow = basicMetrics.data.rows?.[0];

      return {
        path: pagePath,
        views: basicRow ? parseInt(basicRow.metricValues[0].value) || 0 : 0,
        users: basicRow ? parseInt(basicRow.metricValues[1].value) || 0 : 0,
        avgDuration: basicRow
          ? parseFloat(basicRow.metricValues[2].value) || 0
          : 0,
        bounceRate: basicRow
          ? parseFloat(basicRow.metricValues[3].value) || 0
          : 0,
        countries: (countryBreakdown.data.rows || []).map((row) => ({
          country: row.dimensionValues[1].value,
          views: parseInt(row.metricValues[0].value) || 0,
        })),
        devices: (deviceBreakdown.data.rows || []).map((row) => ({
          device: row.dimensionValues[1].value,
          views: parseInt(row.metricValues[0].value) || 0,
        })),
      };
    } catch (error) {
      console.error(
        `Error fetching page details for ${pagePath}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Sync metrics for all articles
   */
  async syncAllArticleStats() {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return { synced: 0, errors: 0 };

    const articles = await Article.find({ status: "published" });
    let synced = 0;
    let errors = 0;

    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          limit: 10000,
        },
      });

      const pageViewsMap = new Map();
      (response.data.rows || []).forEach((row) => {
        const path = row.dimensionValues[0].value;
        const views = parseInt(row.metricValues[0].value) || 0;
        pageViewsMap.set(path, views);
      });

      for (const article of articles) {
        const possiblePaths = [
          `/blog/${article.slug}`,
          `/articles/${article.slug}`,
          `/${article.slug}`,
          `/en/blog/${article.slug}`,
          `/ar/blog/${article.slug}`,
        ];

        let totalViews = 0;
        possiblePaths.forEach((p) => {
          if (pageViewsMap.has(p)) totalViews += pageViewsMap.get(p);
        });

        if (totalViews > 0 || article.seoData?.views30d !== undefined) {
          if (!article.seoData) article.seoData = {};
          article.seoData.views30d = totalViews;
          article.seoData.lastCheck = new Date();
          await article.save({ validateBeforeSave: false });
          synced++;
        }
      }
    } catch (error) {
      console.error("Error syncing analytics:", error.message);
      errors = articles.length;
    }

    return { synced, errors, total: articles.length };
  }

  /**
   * Sync metrics for products
   */
  async syncProductStats() {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return { synced: 0, errors: 0 };

    const products = await Product.find({ isActive: true });
    let synced = 0;
    let errors = 0;

    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          limit: 10000,
        },
      });

      const pageViewsMap = new Map();
      (response.data.rows || []).forEach((row) => {
        const path = row.dimensionValues[0].value;
        const views = parseInt(row.metricValues[0].value) || 0;
        pageViewsMap.set(path, views);
      });

      for (const product of products) {
        const possiblePaths = [
          `/products/${product.slug}`,
          `/en/products/${product.slug}`,
          `/ar/products/${product.slug}`,
        ];

        let totalViews = 0;
        possiblePaths.forEach((p) => {
          if (pageViewsMap.has(p)) totalViews += pageViewsMap.get(p);
        });

        if (totalViews > 0 || product.seoData?.views30d !== undefined) {
          if (!product.seoData) product.seoData = {};
          product.seoData.views30d = totalViews;
          await product.save({ validateBeforeSave: false });
          synced++;
        }
      }
    } catch (error) {
      console.error("Error syncing product analytics:", error.message);
      errors = products.length;
    }
    return { synced, errors, total: products.length };
  }

  /**
   * Sync metrics for services
   */
  async syncServiceStats() {
    if (!this.analyticsData) await this.initialize();
    if (!this.hasValidConfiguration()) return { synced: 0, errors: 0 };

    const services = await Service.find({ isActive: true });
    let synced = 0;
    let errors = 0;

    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          limit: 10000,
        },
      });

      const pageViewsMap = new Map();
      (response.data.rows || []).forEach((row) => {
        const path = row.dimensionValues[0].value;
        const views = parseInt(row.metricValues[0].value) || 0;
        pageViewsMap.set(path, views);
      });

      for (const service of services) {
        const possiblePaths = [
          `/services/${service.slug}`,
          `/en/services/${service.slug}`,
          `/ar/services/${service.slug}`,
        ];

        let totalViews = 0;
        possiblePaths.forEach((p) => {
          if (pageViewsMap.has(p)) totalViews += pageViewsMap.get(p);
        });

        if (totalViews > 0 || service.seoData?.views30d !== undefined) {
          if (!service.seoData) service.seoData = {};
          service.seoData.views30d = totalViews;
          await service.save({ validateBeforeSave: false });
          synced++;
        }
      }
    } catch (error) {
      console.error("Error syncing service analytics:", error.message);
      errors = services.length;
    }
    return { synced, errors, total: services.length };
  }
}

export default new AnalyticsService();
