import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ImageSearchService {
  constructor() {
    this.uploadsDir = path.resolve(__dirname, "../../uploads");
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    this.pexelsApiKey = process.env.PEXELS_API_KEY;
  }

  /**
   * Ensure uploads directory exists
   */
  ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Search for images based on keywords
   * Tries Unsplash first, then Pexels as fallback
   */
  async searchImages(keywords, count = 1, orientation = "landscape") {
    // Try Unsplash first
    if (this.unsplashAccessKey) {
      try {
        return await this.searchUnsplash(keywords, count, orientation);
      } catch (error) {
        console.warn("Unsplash search failed, trying Pexels:", error.message);
      }
    }

    // Try Pexels as fallback
    if (this.pexelsApiKey) {
      try {
        return await this.searchPexels(keywords, count, orientation);
      } catch (error) {
        console.warn("Pexels search also failed:", error.message);
      }
    }

    console.warn("No image search API configured or all searches failed");
    return [];
  }

  /**
   * Search Unsplash for images
   */
  async searchUnsplash(keywords, count, orientation) {
    const query = Array.isArray(keywords) ? keywords.join(" ") : keywords;

    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        per_page: count,
        orientation,
      },
      headers: {
        Authorization: `Client-ID ${this.unsplashAccessKey}`,
      },
    });

    return response.data.results.map((photo) => ({
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      alt: photo.alt_description || query,
      credit: {
        name: photo.user.name,
        link: photo.user.links.html,
        source: "Unsplash",
      },
    }));
  }

  /**
   * Search Pexels for images
   */
  async searchPexels(keywords, count, orientation) {
    const query = Array.isArray(keywords) ? keywords.join(" ") : keywords;

    const response = await axios.get("https://api.pexels.com/v1/search", {
      params: {
        query,
        per_page: count,
        orientation,
      },
      headers: {
        Authorization: this.pexelsApiKey,
      },
    });

    return response.data.photos.map((photo) => ({
      url: photo.src.large,
      thumbnail: photo.src.medium,
      alt: photo.alt || query,
      credit: {
        name: photo.photographer,
        link: photo.photographer_url,
        source: "Pexels",
      },
    }));
  }

  /**
   * Download an image and save it to the uploads folder
   */
  async downloadAndSaveImage(imageUrl, prefix = "ai-article") {
    this.ensureUploadsDirectory();

    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      // Determine file extension from content-type
      const contentType = response.headers["content-type"];
      let extension = "jpg";
      if (contentType) {
        if (contentType.includes("png")) extension = "png";
        else if (contentType.includes("webp")) extension = "webp";
        else if (contentType.includes("gif")) extension = "gif";
      }

      // Generate unique filename
      const filename = `${prefix}-${uuidv4()}.${extension}`;
      const filePath = path.join(this.uploadsDir, filename);

      // Write file
      fs.writeFileSync(filePath, response.data);

      // Return public URL path
      return `/uploads/${filename}`;
    } catch (error) {
      console.error("Failed to download image:", error.message);
      throw new Error(`Image download failed: ${error.message}`);
    }
  }

  /**
   * Search and download images for an article
   */
  async getImagesForArticle(settings) {
    const result = {
      coverImage: null,
      contentImages: [],
    };

    // Determine search keywords
    const searchKeywords =
      settings.imageSearchKeywords?.length > 0
        ? settings.imageSearchKeywords
        : settings.targetKeywords;

    if (!searchKeywords || searchKeywords.length === 0) {
      console.warn("No keywords for image search");
      return result;
    }

    try {
      // Get cover image if needed
      if (settings.includeCoverImage) {
        const coverImages = await this.searchImages(
          searchKeywords,
          1,
          "landscape"
        );
        if (coverImages.length > 0) {
          result.coverImage = await this.downloadAndSaveImage(
            coverImages[0].url,
            "cover"
          );
        }
      }

      // Get content images if needed
      if (settings.includeImages) {
        const contentImageCount = Math.min(
          3,
          Math.floor(settings.numberOfParagraphs / 2)
        );
        if (contentImageCount > 0) {
          const contentImages = await this.searchImages(
            searchKeywords,
            contentImageCount,
            "landscape"
          );

          for (const img of contentImages) {
            try {
              const savedPath = await this.downloadAndSaveImage(
                img.url,
                "content"
              );
              result.contentImages.push(savedPath);
            } catch (error) {
              console.warn("Failed to download content image:", error.message);
            }
          }
        }
      }
    } catch (error) {
      console.error("Image search/download error:", error);
    }

    return result;
  }
}
