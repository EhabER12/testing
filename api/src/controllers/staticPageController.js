import StaticPage from "../models/staticPageModel.js";
import { ApiError } from "../utils/apiError.js";
import sanitizeHtml from "sanitize-html";

// Sanitization config - allow common HTML tags for rich content
const sanitizeConfig = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "ul",
    "ol",
    "li",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "a",
    "blockquote",
    "pre",
    "code",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "div",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    div: ["class"],
    span: ["class"],
    "*": ["style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Strip dangerous attributes
  disallowedTagsMode: "discard",
};

// Sanitize bilingual content
const sanitizeContent = (content) => {
  if (!content) return content;
  return {
    ar: content.ar ? sanitizeHtml(content.ar, sanitizeConfig) : "",
    en: content.en ? sanitizeHtml(content.en, sanitizeConfig) : "",
  };
};

export class StaticPageController {
  // Get all static pages (public)
  async getPages(req, res, next) {
    try {
      const { showInFooter, showInHeader, isPublished } = req.query;
      const query = {};

      // Filter by visibility
      if (showInFooter !== undefined) {
        query.showInFooter = showInFooter === "true";
      }
      if (showInHeader !== undefined) {
        query.showInHeader = showInHeader === "true";
      }
      // Public API only shows published by default
      if (isPublished !== undefined) {
        query.isPublished = isPublished === "true";
      }

      const pages = await StaticPage.find(query).sort({ order: 1 }).lean();

      res.status(200).json({
        success: true,
        pages: pages.map((p) => ({
          ...p,
          id: p._id,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single page by slug (public)
  async getPageBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      const page = await StaticPage.findOne({ slug }).lean();

      if (!page) {
        throw new ApiError(404, "Page not found");
      }

      res.status(200).json({
        success: true,
        page: {
          ...page,
          id: page._id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update page (admin only)
  async updatePage(req, res, next) {
    try {
      const { slug } = req.params;
      const updateData = req.body;

      // Parse JSON fields if they come as strings
      const jsonFields = ["title", "content", "seoMeta"];
      for (const field of jsonFields) {
        if (typeof updateData[field] === "string") {
          try {
            updateData[field] = JSON.parse(updateData[field]);
          } catch (e) {
            // Keep as-is if not valid JSON
          }
        }
      }

      // SECURITY: Sanitize HTML content before saving
      if (updateData.content) {
        updateData.content = sanitizeContent(updateData.content);
      }

      // Set updatedBy if user is available
      if (req.user?._id) {
        updateData.updatedBy = req.user._id;
      }

      const page = await StaticPage.findOneAndUpdate(
        { slug },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!page) {
        throw new ApiError(404, "Page not found");
      }

      res.status(200).json({
        success: true,
        message: "Page updated successfully",
        page: {
          ...page.toObject(),
          id: page._id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Seed default pages (admin only)
  async seedPages(req, res, next) {
    try {
      const pages = await StaticPage.seedDefaultPages();

      res.status(200).json({
        success: true,
        message: "Default pages seeded successfully",
        pages: pages.map((p) => ({
          ...p.toObject(),
          id: p._id,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StaticPageController();
