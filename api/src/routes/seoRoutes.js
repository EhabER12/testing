import express from "express";
import {
  testGscConnection,
  syncGscData,
  getSiteStats,
  getKeywordOpportunities,
  getArticlesWithSeoData,
  auditArticle,
  getPendingSuggestions,
  applySuggestion,
  rejectSuggestion,
  getContentHealthReport,
  getDecayingContent,
  getOrphanPages,
  getInternalLinkingReport,
  getArticleSchema,
  optimizeForSnippet,
  generateAISummary,
} from "../controllers/seoController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (for frontend schema fetching)
router.get("/schema/article/:id", getArticleSchema);

// Protected routes - require admin authentication
router.use(protect);
router.use(authorize("admin"));

// GSC Connection
router.get("/test-connection", testGscConnection);
router.post("/sync", syncGscData);

// Stats & Insights
router.get("/site-stats", getSiteStats);
router.get("/opportunities/keywords", getKeywordOpportunities);
router.get("/articles", getArticlesWithSeoData);

// Article Audit
router.post("/audit/:articleId", auditArticle);

// Suggestion Management
router.get("/suggestions", getPendingSuggestions);
router.post("/suggestions/:id/apply", applySuggestion);
router.post("/suggestions/:id/reject", rejectSuggestion);

// Content Health (Decay & Cannibalization)
router.get("/health", getContentHealthReport);
router.get("/health/decay", getDecayingContent);

// Internal Linking
router.get("/links/orphans", getOrphanPages);
router.get("/links/report", getInternalLinkingReport);

// Advanced Optimization
router.post("/optimize/snippet/:articleId", optimizeForSnippet);
router.post("/optimize/summary/:articleId", generateAISummary);

export default router;
