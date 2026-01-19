import { GoogleGenAI } from "@google/genai";
import Article from "../models/articleModel.js";
import GeoSuggestion from "../models/geoSuggestionModel.js";
import googleSearchConsoleService from "./googleSearchConsoleService.js";

export class GeoOptimizationService {
  constructor() {
    this.ai = null;
    this.initialized = false;
    // Fallback models in order of preference
    this.models = [
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash-lite",
    ];
  }

  async initialize() {
    if (this.initialized) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.initialized = true;
  }

  /**
   * Generate content with fallback models
   */
  async generateWithFallback(prompt) {
    await this.initialize();

    for (const model of this.models) {
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        return response.text;
      } catch (error) {
        console.warn(
          `Model ${model} failed:`,
          error.message?.substring(0, 100)
        );
        if (
          !error.message?.includes("429") &&
          !error.message?.includes("RESOURCE_EXHAUSTED")
        ) {
          throw error;
        }
      }
    }
    throw new Error("All AI models are currently busy");
  }

  /**
   * Analyze an article for missing keywords based on GSC data
   * @param {Object} article - The article document
   * @param {Array} queries - Top search queries from GSC
   */
  async analyzeKeywordGaps(article, queries) {
    // Filter high-impression keywords that might be missing from content
    const highImpressionQueries = queries
      .filter((q) => q.impressions > 50)
      .slice(0, 10);

    if (highImpressionQueries.length === 0) {
      return [];
    }

    const prompt = `You are a Senior SEO Content Editor with 10+ years of experience. Analyze the following article content and identify which of the target keywords are MISSING or UNDERUSED.

## Article Title:
${article.title}

## Article Content (first 6000 chars):
${article.content.substring(0, 6000)}

## Target Keywords (with their Google impressions):
${highImpressionQueries
  .map(
    (q) =>
      `- "${q.query}" (${
        q.impressions
      } impressions, avg pos: ${q.position.toFixed(1)})`
  )
  .join("\n")}

## Task:
1. For each keyword, check if it appears naturally in the content.
2. If a high-impression keyword is MISSING or appears less than 2 times, flag it.
3. Suggest a short, natural paragraph or sentence that could include the keyword.

## Output Format (JSON):
[
  {
    "keyword": "the missing keyword",
    "currentOccurrences": 0,
    "priority": "high|medium|low",
    "reasoning": "Why this keyword matters and where it could fit",
    "suggestedText": "A natural sentence or short paragraph including the keyword"
  }
]

Return ONLY the JSON array. If all keywords are already well-covered, return an empty array [].`;

    try {
      const responseText = await this.generateWithFallback(prompt);

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error("Error analyzing keyword gaps:", error.message);
      return [];
    }
  }

  /**
   * Generate a "Direct Answer" paragraph for GEO optimization
   * This helps content get cited by AI engines like Perplexity and Google SGE
   */
  async generateDirectAnswer(article, targetQuery) {
    const prompt = `You are an expert SEO writer specializing in AI Search Optimization (GEO).

## Task:
Create a concise "Direct Answer" paragraph (50-70 words) that could be cited by AI engines like Google AI Overviews, Perplexity, or ChatGPT when users search for: "${targetQuery}"

## Context from Article:
Title: ${article.title}
Content (excerpt): ${article.content.substring(0, 2000)}

## Requirements:
1. Start with a clear, authoritative statement directly answering the query
2. Include 1-2 supporting facts or statistics if available
3. Use natural, conversational language
4. Avoid filler words and be as information-dense as possible
5. This should be insertable at the beginning of the article

## Output:
Return ONLY the paragraph text, nothing else.`;

    try {
      const responseText = await this.generateWithFallback(prompt);
      return responseText.trim();
    } catch (error) {
      console.error("Error generating direct answer:", error.message);
      return null;
    }
  }

  /**
   * Run a full SEO/GEO audit on an article
   */
  async auditArticle(articleId) {
    const article = await Article.findById(articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    const suggestions = [];
    const pageUrl = `https://genoun.com/blog/${article.slug}`;

    // Get date range for last 28 days
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    try {
      // 1. Get GSC data
      const queries = await googleSearchConsoleService.getPageQueries(
        pageUrl,
        startDate,
        endDate,
        25
      );

      // 2. Analyze keyword gaps
      const keywordGaps = await this.analyzeKeywordGaps(article, queries);

      for (const gap of keywordGaps) {
        suggestions.push({
          articleId: article._id,
          type: "missing_keyword",
          priority: gap.priority,
          reasoning: gap.reasoning,
          data: {
            targetKeyword: gap.keyword,
            suggestedContent: gap.suggestedText,
            currentOccurrences: gap.currentOccurrences,
          },
          status: "pending",
        });
      }

      // 3. Check if article has a Direct Answer (first 100 words should be information-dense)
      const firstParagraph = article.content.split("\n")[0] || "";
      if (firstParagraph.length < 150 || !firstParagraph.includes("?")) {
        const topQuery = queries[0]?.query;
        if (topQuery) {
          const directAnswer = await this.generateDirectAnswer(
            article,
            topQuery
          );
          if (directAnswer) {
            suggestions.push({
              articleId: article._id,
              type: "direct_answer",
              priority: "high",
              reasoning: `Top search query "${topQuery}" needs a clear, citable answer in the intro`,
              data: {
                targetKeyword: topQuery,
                originalContent: firstParagraph.substring(0, 200),
                suggestedContent: directAnswer,
              },
              status: "pending",
            });
          }
        }
      }

      // 4. Save all suggestions to DB
      if (suggestions.length > 0) {
        await GeoSuggestion.insertMany(suggestions);
      }

      return {
        articleId: article._id,
        title: article.title,
        suggestionsGenerated: suggestions.length,
        suggestions,
      };
    } catch (error) {
      console.error(`Error auditing article ${articleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Apply a suggestion to an article
   */
  async applySuggestion(suggestionId) {
    const suggestion = await GeoSuggestion.findById(suggestionId).populate(
      "articleId"
    );
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    const article = suggestion.articleId;
    let updated = false;

    switch (suggestion.type) {
      case "missing_keyword":
      case "direct_answer":
        // Prepend the suggested content to the article
        const newContent = suggestion.data.suggestedContent;
        if (newContent) {
          article.content = `${newContent}\n\n${article.content}`;
          updated = true;
        }
        break;

      // Add more cases as needed (internal_link, structured_data, etc.)
    }

    if (updated) {
      await article.save();
      suggestion.status = "applied";
      await suggestion.save();
    }

    return { success: updated, article, suggestion };
  }

  /**
   * Get pending suggestions for admin review
   */
  async getPendingSuggestions(limit = 50) {
    return GeoSuggestion.find({ status: "pending" })
      .populate("articleId", "title slug")
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit);
  }

  /**
   * Optimize content for Featured Snippet capture
   * @param {Object} article - Article document
   * @param {string} targetQuery - The search query to optimize for
   */
  async optimizeForFeaturedSnippet(article, targetQuery) {
    const prompt = `You are an expert SEO specialist focused on Featured Snippets.

## Target Query: "${targetQuery}"

## Current Article Content (first 6000 chars):
${article.content.substring(0, 6000)}

## Task:
Create optimized content to capture a Featured Snippet for this query.

## Requirements:
1. For "what is" queries: Write a 40-60 word definition paragraph
2. For "how to" queries: Create numbered steps (5-8 steps)
3. For "list" queries: Create a bullet point list (5-10 items)
4. For comparison queries: Create a comparison table

## Output JSON:
{
  "snippetType": "paragraph|list|steps|table",
  "optimizedContent": "The content formatted for featured snippet",
  "placement": "beginning|after_intro|replace_section",
  "htmlFormatted": "The content with proper HTML tags"
}

Return ONLY the JSON object.`;

    const response = await this.generateWithFallback(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Failed to parse featured snippet response:", error);
    }

    return null;
  }

  /**
   * Generate an "At a Glance" summary for AI citation
   * This helps AI systems like ChatGPT/Perplexity cite your content
   */
  async generateAtAGlanceSummary(article) {
    const prompt = `You are creating a summary box for AI citation optimization.

## Article Title: ${article.title}

## Article Content (first 5000 chars):
${article.content.substring(0, 5000)}

## Task:
Create an "At a Glance" summary box that AI systems will cite.

## Requirements:
1. Start with "الملخص السريع:" or "At a Glance:"
2. 3-5 key bullet points
3. Each point should be factual and citable
4. Include any numbers, dates, or statistics
5. End with a key takeaway

## Output JSON:
{
  "titleAr": "الملخص السريع",
  "titleEn": "At a Glance",
  "keyPoints": ["point1", "point2", "point3"],
  "keyTakeaway": "One sentence summary",
  "htmlBox": "<div class='at-a-glance'>...</div>"
}

Return ONLY the JSON object in ${
      article.language === "ar" ? "Arabic" : "English"
    }.`;

    const response = await this.generateWithFallback(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Failed to parse at-a-glance response:", error);
    }

    return null;
  }

  /**
   * Structure content for AI citation
   * Adds semantic HTML and citation-friendly formatting
   */
  structureForAICitation(content) {
    let structured = content;

    // Wrap key facts in citation-friendly spans
    // Pattern: numbers with units (e.g., "50%", "100 users", "2024")
    structured = structured.replace(
      /(\d+(?:\.\d+)?(?:\s*[%٪]|\s+\w+)?)/g,
      '<span class="citable-fact" data-type="statistic">$1</span>'
    );

    // Add semantic sections
    // Wrap lists in semantic containers
    structured = structured.replace(
      /(<ul>[\s\S]*?<\/ul>)/g,
      '<section class="key-points" aria-label="Key Points">$1</section>'
    );

    // Add article schema hints
    structured = structured.replace(/<h2>/g, '<h2 itemprop="articleSection">');

    return structured;
  }

  /**
   * Generate People Also Ask style Q&A
   */
  async generatePAAAnswers(article, queries) {
    const paaQueries = queries
      .filter(
        (q) =>
          q.query.includes("?") ||
          q.query.includes("كيف") ||
          q.query.includes("ما")
      )
      .slice(0, 5);

    if (paaQueries.length === 0) return [];

    const prompt = `You are answering People Also Ask questions for SEO.

## Article Content (first 3000 chars):
${article.content.substring(0, 3000)}

## Questions to answer:
${paaQueries.map((q) => `- ${q.query}`).join("\n")}

## Requirements:
1. Answer each question in 40-60 words
2. Start each answer directly (don't repeat the question)
3. Include relevant facts from the article
4. Make answers citation-worthy

## Output JSON:
{
  "answers": [
    {
      "question": "the question",
      "answer": "the direct answer",
      "htmlFormatted": "<p>The answer with HTML</p>"
    }
  ]
}

Return ONLY the JSON object in ${
      article.language === "ar" ? "Arabic" : "English"
    }.`;

    const response = await this.generateWithFallback(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]).answers || [];
      }
    } catch (error) {
      console.error("Failed to parse PAA response:", error);
    }

    return [];
  }
}

export default new GeoOptimizationService();
