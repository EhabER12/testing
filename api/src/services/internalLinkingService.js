import Article from "../models/articleModel.js";
import Product from "../models/productModel.js";
import Service from "../models/serviceModel.js";

/**
 * Internal Linking Service
 * Analyzes content and suggests/injects internal links to related content
 */
export class InternalLinkingService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || "https://genoun.com";
  }

  /**
   * Find related content based on keywords and content similarity
   * @param {string} content - The article content
   * @param {string} language - 'ar' or 'en'
   * @param {string} excludeId - Article ID to exclude (the current article)
   */
  async findRelatedContent(content, language = "ar", excludeId = null) {
    const keywords = this.extractKeywords(content, language);

    const [articles, products, services] = await Promise.all([
      this.findRelatedArticles(keywords, language, excludeId),
      this.findRelatedProducts(keywords, language),
      this.findRelatedServices(keywords, language),
    ]);

    return {
      articles,
      products,
      services,
      allItems: [...articles, ...products, ...services],
    };
  }

  /**
   * Extract important keywords from content
   */
  extractKeywords(content, language) {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]+>/g, " ");

    // Common Arabic stop words
    const arabicStopWords = [
      "في",
      "من",
      "إلى",
      "على",
      "هذا",
      "هذه",
      "التي",
      "الذي",
      "أن",
      "ان",
      "مع",
      "عن",
      "أو",
      "و",
      "ال",
      "ما",
      "هو",
      "هي",
      "كان",
      "كانت",
      "يكون",
      "تكون",
      "لا",
      "نعم",
      "كل",
      "بعض",
      "أي",
      "قد",
      "لقد",
      "حيث",
      "بين",
      "عند",
      "منذ",
      "حتى",
      "إذا",
      "لكن",
      "بل",
      "ثم",
      "أما",
      "إما",
      "سوف",
      "قبل",
      "بعد",
      "فوق",
      "تحت",
      "أمام",
      "خلف",
      "داخل",
      "خارج",
    ];

    // Common English stop words
    const englishStopWords = [
      "the",
      "a",
      "an",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "shall",
      "can",
      "need",
      "dare",
      "ought",
      "used",
      "to",
      "of",
      "in",
      "for",
      "on",
      "with",
      "at",
      "by",
      "from",
      "as",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "between",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "all",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "just",
      "and",
      "but",
      "if",
      "or",
      "because",
      "until",
      "while",
      "this",
      "that",
      "these",
      "those",
      "what",
      "which",
      "who",
      "whom",
      "i",
      "me",
      "my",
      "we",
      "our",
      "you",
      "your",
      "he",
      "him",
      "his",
      "she",
      "her",
      "it",
      "its",
      "they",
      "them",
      "their",
    ];

    const stopWords = language === "ar" ? arabicStopWords : englishStopWords;

    // Split into words and filter
    const words = plainText
      .toLowerCase()
      .split(/[\s،,؛;:.!?؟\-\(\)\[\]\"\'\/\\]+/)
      .filter((word) => word.length > 2)
      .filter((word) => !stopWords.includes(word))
      .filter((word) => !/^\d+$/.test(word)); // Remove pure numbers

    // Count frequency
    const frequency = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Return top keywords by frequency
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Find related articles based on keywords
   */
  async findRelatedArticles(keywords, language, excludeId = null) {
    const query = {
      status: "published",
      language,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    // Build regex pattern for keywords
    const keywordPattern = keywords.slice(0, 10).join("|");

    const articles = await Article.find({
      ...query,
      $or: [
        { title: { $regex: keywordPattern, $options: "i" } },
        { content: { $regex: keywordPattern, $options: "i" } },
        { "seo.keywords": { $in: keywords } },
      ],
    })
      .select("title slug excerpt seo.keywords")
      .limit(10)
      .lean();

    return articles.map((a) => ({
      type: "article",
      id: a._id,
      title: a.title,
      slug: a.slug,
      url: `${this.baseUrl}/${language}/articles/${a.slug}`,
      anchorTexts: this.generateAnchorTexts(a.title, a.seo?.keywords || []),
    }));
  }

  /**
   * Find related products
   */
  async findRelatedProducts(keywords, language) {
    const keywordPattern = keywords.slice(0, 10).join("|");
    const nameField = language === "ar" ? "name.ar" : "name.en";
    const descField = language === "ar" ? "description.ar" : "description.en";

    const products = await Product.find({
      isActive: true,
      $or: [
        { [nameField]: { $regex: keywordPattern, $options: "i" } },
        { [descField]: { $regex: keywordPattern, $options: "i" } },
      ],
    })
      .select("name slug description")
      .limit(5)
      .lean();

    return products.map((p) => ({
      type: "product",
      id: p._id,
      title: language === "ar" ? p.name?.ar : p.name?.en,
      slug: p.slug,
      url: `${this.baseUrl}/${language}/products/${p.slug}`,
      anchorTexts: [
        language === "ar" ? p.name?.ar : p.name?.en,
        p.slug.replace(/-/g, " "),
      ].filter(Boolean),
    }));
  }

  /**
   * Find related services
   */
  async findRelatedServices(keywords, language) {
    const keywordPattern = keywords.slice(0, 10).join("|");
    const titleField = language === "ar" ? "title.ar" : "title.en";
    const descField = language === "ar" ? "description.ar" : "description.en";

    const services = await Service.find({
      isActive: true,
      $or: [
        { [titleField]: { $regex: keywordPattern, $options: "i" } },
        { [descField]: { $regex: keywordPattern, $options: "i" } },
      ],
    })
      .select("title slug description")
      .limit(5)
      .lean();

    return services.map((s) => ({
      type: "service",
      id: s._id,
      title: language === "ar" ? s.title?.ar : s.title?.en,
      slug: s.slug,
      url: `${this.baseUrl}/${language}/services/${s.slug}`,
      anchorTexts: [
        language === "ar" ? s.title?.ar : s.title?.en,
        s.slug.replace(/-/g, " "),
      ].filter(Boolean),
    }));
  }

  /**
   * Generate possible anchor texts for a content item
   */
  generateAnchorTexts(title, keywords = []) {
    const anchors = [title];
    if (keywords.length > 0) {
      anchors.push(...keywords.slice(0, 3));
    }
    return anchors.filter(Boolean);
  }

  /**
   * Inject internal links into HTML content
   * @param {string} content - HTML content
   * @param {Array} relatedItems - Items to link to
   * @param {number} maxLinks - Max links to add
   */
  injectInternalLinks(content, relatedItems, maxLinks = 5) {
    if (!relatedItems || relatedItems.length === 0) {
      return content;
    }

    let modifiedContent = content;
    let linksAdded = 0;

    for (const item of relatedItems) {
      if (linksAdded >= maxLinks) break;

      for (const anchorText of item.anchorTexts) {
        if (linksAdded >= maxLinks) break;
        if (!anchorText || anchorText.length < 3) continue;

        // Create a safe regex pattern
        const escapedAnchor = anchorText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Only match text NOT already inside a link
        // Look for the text that's not within <a> tags
        const regex = new RegExp(
          `(?<!<a[^>]*>)(?<!["\\/])\\b(${escapedAnchor})\\b(?![^<]*<\\/a>)`,
          "i"
        );

        if (regex.test(modifiedContent)) {
          const link = `<a href="${item.url}" title="${item.title}" class="internal-link">${anchorText}</a>`;
          modifiedContent = modifiedContent.replace(regex, link);
          linksAdded++;
          break; // Move to next item after one link per item
        }
      }
    }

    return modifiedContent;
  }

  /**
   * Find orphan pages (pages with no internal links pointing to them)
   */
  async findOrphanPages() {
    const articles = await Article.find({ status: "published" })
      .select("title slug content")
      .lean();

    const orphans = [];

    for (const article of articles) {
      // Check if any other article links to this one
      const linkPattern = `/articles/${article.slug}`;
      const hasInboundLinks = await Article.exists({
        _id: { $ne: article._id },
        status: "published",
        content: { $regex: linkPattern, $options: "i" },
      });

      if (!hasInboundLinks) {
        orphans.push({
          id: article._id,
          title: article.title,
          slug: article.slug,
          type: "article",
        });
      }
    }

    return orphans;
  }

  /**
   * Generate an internal linking report
   */
  async generateLinkingReport() {
    const articles = await Article.find({ status: "published" })
      .select("title slug content")
      .lean();

    const report = {
      totalArticles: articles.length,
      orphanPages: [],
      linkDistribution: {},
      averageOutboundLinks: 0,
    };

    let totalOutbound = 0;

    for (const article of articles) {
      // Count outbound internal links
      const internalLinkMatches = article.content?.match(
        /href=["'][^"']*\/(articles|products|services)\/[^"']+["']/gi
      );
      const outboundCount = internalLinkMatches?.length || 0;

      report.linkDistribution[article.slug] = outboundCount;
      totalOutbound += outboundCount;

      // Check for inbound links
      const linkPattern = `/articles/${article.slug}`;
      const hasInbound = await Article.exists({
        _id: { $ne: article._id },
        status: "published",
        content: { $regex: linkPattern, $options: "i" },
      });

      if (!hasInbound) {
        report.orphanPages.push({
          title: article.title,
          slug: article.slug,
        });
      }
    }

    report.averageOutboundLinks =
      articles.length > 0 ? (totalOutbound / articles.length).toFixed(1) : 0;

    return report;
  }
}

export default new InternalLinkingService();
