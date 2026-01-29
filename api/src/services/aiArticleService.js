import { GoogleGenAI } from "@google/genai";
import Article from "../models/articleModel.js";
import AiArticleSettings from "../models/aiArticleSettingsModel.js";
import { SettingsRepository } from "../repositories/settingsRepository.js";
import { SettingsService } from "./settingsService.js";
import slugify from "slugify";
import internalLinkingService from "./internalLinkingService.js";

export class AiArticleService {
  constructor() {
    this.ai = null;
    this.settingsRepository = new SettingsRepository();
    this.settingsService = new SettingsService();
    this.initialized = false;
    // Fallback models in order of preference
    this.models = [
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash-8b",
    ];
  }

  /**
   * Initialize the Gemini AI client
   */
  async initialize() {
    if (this.initialized) return;

    // Try to get API key from database first, fallback to environment variable
    let apiKey = process.env.GEMINI_API_KEY;
    
    try {
      const apiKeys = await this.settingsService.getDecryptedApiKeys();
      if (apiKeys.geminiApiKey) {
        apiKey = apiKeys.geminiApiKey;
        console.log("✅ Using Gemini API key from database settings");
      } else {
        console.log("ℹ️ Using Gemini API key from environment variables");
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch API keys from database, using environment variable:", error.message);
    }

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured in database settings or environment variables"
      );
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.initialized = true;
    console.log("✅ AI Article Service initialized with Gemini");
  }

  /**
   * Build the prompt from template with variable substitution
   */
  async buildPrompt(settings, title) {
    const websiteSettings = await this.settingsRepository.getSettings();

    const variables = {
      title: title,
      keywords: settings.targetKeywords.join(", "),
      paragraphs: settings.numberOfParagraphs.toString(),
      wordsPerParagraph: settings.averageWordsPerParagraph.toString(),
      language: settings.language === "ar" ? "Arabic" : "English",
      siteName: websiteSettings.siteName || "Genoun",
      siteDescription: websiteSettings.siteDescription || "",
    };

    let prompt = settings.promptTemplate;

    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      prompt = prompt.replace(regex, value);
    }

    // Append system-enforced JSON output format (not user-editable)
    const jsonFormatInstruction = `

IMPORTANT: You MUST output the article in the following JSON format (this is required):
{
  "title": "Article title",
  "excerpt": "2-3 sentence summary",
  "content": "Full article with HTML formatting (use <p>, <h2>, <h3>, <strong>, <em> tags)",
  "seoTitle": "Meta title under 60 characters",
  "seoDescription": "Meta description under 160 characters",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}

Return ONLY the JSON object, no additional text or markdown code blocks.`;

    return prompt + jsonFormatInstruction;
  }

  /**
   * Parse the AI response into structured article data
   */
  parseAiResponse(responseText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || "",
          excerpt: parsed.excerpt || "",
          content: parsed.content || "",
          seo: {
            title: parsed.seoTitle || parsed.title || "",
            description: parsed.seoDescription || parsed.excerpt || "",
            keywords: parsed.seoKeywords || [],
          },
        };
      }

      // Fallback: try to parse as plain text
      return this.parseAsPlainText(responseText);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return this.parseAsPlainText(responseText);
    }
  }

  /**
   * Fallback parser for non-JSON responses
   */
  parseAsPlainText(text) {
    // Extract title (first line or heading)
    const titleMatch = text.match(/^#\s*(.+)$/m) || text.match(/^(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled Article";

    // Extract content (everything after title)
    let content = text;
    if (titleMatch) {
      content = text.replace(titleMatch[0], "").trim();
    }

    // Convert markdown to HTML if needed
    content = this.markdownToHtml(content);

    // Generate excerpt from first paragraph
    const plainText = content.replace(/<[^>]+>/g, "");
    const excerpt =
      plainText.length > 200 ? plainText.substring(0, 197) + "..." : plainText;

    return {
      title,
      excerpt,
      content,
      seo: {
        title: title.substring(0, 60),
        description: excerpt.substring(0, 160),
        keywords: [],
      },
    };
  }

  /**
   * Basic markdown to HTML conversion
   */
  markdownToHtml(markdown) {
    return (
      markdown
        // Headers
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        // Bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Paragraphs (lines with content)
        .replace(/^(?!<[hH])(.+)$/gm, "<p>$1</p>")
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, "")
        .replace(/<p>\s*<\/p>/g, "")
    );
  }

  /**
   * Inject internal links to related content (products, services, articles)
   * @param {string} content - HTML content
   * @param {string} language - 'ar' or 'en'
   */
  async injectInternalLinks(content, language = "ar") {
    // Find related content based on the article
    const related = await internalLinkingService.findRelatedContent(
      content,
      language
    );

    if (related.allItems.length === 0) {
      console.log("No related content found for internal linking");
      return content;
    }

    console.log(
      `Found ${related.allItems.length} related items for linking:`,
      related.allItems.map((i) => `${i.type}: ${i.title}`).slice(0, 5)
    );

    // Inject links - prioritize products/services, then articles
    const prioritizedItems = [
      ...related.products,
      ...related.services,
      ...related.articles,
    ];

    return internalLinkingService.injectInternalLinks(
      content,
      prioritizedItems,
      5 // Max 5 internal links per article
    );
  }

  /**
   * Sleep for a given number of milliseconds
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate content with fallback models and exponential backoff
   */
  async generateContentWithFallback(prompt, retryCount = 0) {
    await this.initialize();

    const maxRetries = 3;
    let lastError = null;

    for (const model of this.models) {
      try {
        console.log(`Trying model: ${model}`);
        const response = await this.ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        console.log(`✅ Success with model: ${model}`);
        return { text: response.text, model };
      } catch (error) {
        console.warn(
          `Model ${model} failed:`,
          error.message?.substring(0, 100)
        );
        lastError = error;

        // Check if it's a transient/retryable error (rate limit, overloaded, unavailable)
        const isRetryable =
          error.message?.includes("429") ||
          error.message?.includes("503") ||
          error.message?.includes("RESOURCE_EXHAUSTED") ||
          error.message?.includes("UNAVAILABLE") ||
          error.message?.includes("overloaded");

        if (isRetryable) {
          // Add small delay before trying next model to avoid hammering the API
          await this.sleep(1000);
          // Try next model
          continue;
        }

        // For non-retryable errors, throw immediately
        throw this.formatError(error);
      }
    }

    // All models failed - check if we should retry the whole cycle
    const isRetryableError =
      lastError?.message?.includes("503") ||
      lastError?.message?.includes("UNAVAILABLE") ||
      lastError?.message?.includes("overloaded");

    if (isRetryableError && retryCount < maxRetries) {
      // Exponential backoff: 5s, 15s, 45s
      const delay = Math.pow(3, retryCount) * 5000;
      console.log(
        `⏳ All models overloaded. Retrying in ${delay / 1000}s... (attempt ${
          retryCount + 1
        }/${maxRetries})`
      );
      await this.sleep(delay);
      return this.generateContentWithFallback(prompt, retryCount + 1);
    }

    // All retries exhausted
    throw this.formatError(lastError);
  }

  /**
   * Format error for user-friendly display
   */
  formatError(error) {
    const message = error.message || String(error);

    // Rate limit error
    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("quota")
    ) {
      // Extract retry time if available
      const retryMatch = message.match(/retry in ([\d.]+)s/i);
      const retryTime = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;

      return new Error(
        `⚠️ تم تجاوز حد الاستخدام. جميع النماذج مشغولة حالياً.\n` +
          `Rate limit exceeded. All models are currently busy.\n` +
          `الرجاء المحاولة مرة أخرى بعد ${retryTime} ثانية.\n` +
          `Please try again in ${retryTime} seconds.`
      );
    }

    // Service unavailable / overloaded error
    if (
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("overloaded")
    ) {
      return new Error(
        `⚠️ خادم Gemini غير متاح حالياً (503). تمت محاولة إعادة المحاولة.\n` +
          `Gemini server is currently unavailable (503). Retries exhausted.\n` +
          `سيتم إعادة المحاولة تلقائياً في الدفعة التالية.\n` +
          `Job will be retried automatically in the next batch.`
      );
    }

    // API key error
    if (message.includes("API_KEY") || message.includes("authentication")) {
      return new Error(
        `⚠️ خطأ في مفتاح API. الرجاء التحقق من GEMINI_API_KEY.\n` +
          `API key error. Please check your GEMINI_API_KEY.`
      );
    }

    // Generic error
    return new Error(`فشل في توليد المحتوى: ${message.substring(0, 200)}`);
  }

  /**
   * Generate a URL-safe slug from title
   * For Arabic, preserves Arabic characters (URL-encoded automatically by browsers)
   * For English, uses standard slugify
   */
  generateSlug(title, language) {
    if (language === "ar") {
      let slug = title
        .replace(
          /[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s-]/g,
          ""
        )
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (slug.length > 0) {
        slug = `${slug}-${Date.now().toString(36)}`;
      } else {
        // Fallback if no valid characters
        slug = `article-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`;
      }

      return slug;
    }

    let slug = slugify(title, {
      lower: true,
      strict: true,
    });

    if (!slug || slug.length < 3) {
      slug = `article-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
    } else {
      // Add timestamp for uniqueness
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    return slug;
  }

  /**
   * Generate an article using Gemini AI
   */
  async generateArticle(settings, title) {
    const prompt = await this.buildPrompt(settings, title);

    const { text, model } = await this.generateContentWithFallback(prompt);

    const articleData = this.parseAiResponse(text);
    articleData.generatedWithModel = model;

    // Generate slug from title - preserve Arabic characters for Arabic articles
    articleData.slug = this.generateSlug(articleData.title, settings.language);

    // Add language
    articleData.language = settings.language;

    // Inject internal links to related content
    try {
      articleData.content = await this.injectInternalLinks(
        articleData.content,
        settings.language
      );
      console.log("✅ Internal links injected into article");
    } catch (error) {
      console.warn("Failed to inject internal links:", error.message);
      // Continue without links - non-critical
    }

    return articleData;
  }

  /**
   * Create an article in the database
   */
  async createArticle(articleData, authorId, images = {}) {
    const article = await Article.create({
      title: articleData.title,
      slug: articleData.slug,
      content: articleData.content,
      excerpt: articleData.excerpt,
      language: articleData.language,
      status: articleData.autoPublish ? "published" : "draft",
      publishedAt: articleData.autoPublish ? new Date() : null,
      author: authorId,
      tags: articleData.seo?.keywords || [],
      seo: articleData.seo,
      coverImage: images.coverImage || null,
      heroImage: images.heroImage || null,
    });

    return article;
  }

  /**
   * Test prompt with a sample title (for preview)
   */
  async testPrompt(settings, sampleTitle = "Sample Article Title") {
    const prompt = await this.buildPrompt(settings, sampleTitle);

    const { text, model } = await this.generateContentWithFallback(prompt);

    return {
      prompt: prompt,
      rawResponse: text,
      parsed: this.parseAiResponse(text),
      model: model,
    };
  }

  /**
   * Validate settings before generation
   */
  validateSettings(settings) {
    const errors = [];

    if (!settings.promptTemplate) {
      errors.push("Prompt template is required");
    }

    if (settings.readyTitles.filter((t) => !t.used).length === 0) {
      errors.push("No unused titles available");
    }

    if (!settings.targetKeywords || settings.targetKeywords.length === 0) {
      // Warning but not error
      console.warn("No target keywords configured");
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return true;
  }
}
