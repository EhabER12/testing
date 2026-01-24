import { PDFDocument, rgb } from "pdf-lib";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fontkit = require("fontkit");
const arabicReshaper = require("arabic-reshaper");
const { getDirection } = require("string-direction");
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGenerationService {
  /**
   * Reshape and reverse Arabic text for PDF
   */
  reshapeArabic(text) {
    if (!text) return "";

    // Check if text contains Arabic characters
    const isArabic = /[\u0600-\u06FF]/.test(text);
    if (!isArabic) return text;

    try {
      // Reshape Arabic characters (handle joining)
      const reshaped = arabicReshaper.reshape(text);

      // Reverse for RTL display in PDF
      return reshaped.split("").reverse().join("");
    } catch (error) {
      console.error("Arabic reshaping error:", error);
      return text;
    }
  }

  /**
   * Font mapping: Maps font family names to .ttf filenames
   */
  getFontFilename(fontFamily) {
    const fontMap = {
      "Cairo": "Cairo-Regular.ttf",
      "Amiri": "Amiri-Regular.ttf",
      "Tajawal": "Tajawal-Regular.ttf",
      "Almarai": "Almarai-Regular.ttf",
      "Noto Kufi Arabic": "NotoKufiArabic-Regular.ttf",
      // Signature Fonts
      "Great Vibes": "GreatVibes-Regular.ttf",
      "Dancing Script": "DancingScript-Regular.ttf",
      "Pacifico": "Pacifico-Regular.ttf",
    };

    return fontMap[fontFamily] || "Cairo-Regular.ttf";
  }

  /**
   * Load and embed a font
   */
  async loadFont(pdfDoc, fontFamily) {
    const filename = this.getFontFilename(fontFamily);
    const fontPath = path.join(__dirname, "..", "assets", "fonts", filename);

    try {
      const fontBytes = await fs.readFile(fontPath);
      return await pdfDoc.embedFont(fontBytes);
    } catch (error) {
      // Fallback to Cairo if font not found
      console.warn(`Font ${fontFamily} (${filename}) not found, falling back to Cairo`);
      try {
        const fallbackPath = path.join(__dirname, "..", "assets", "fonts", "Cairo-Regular.ttf");
        const fallbackBytes = await fs.readFile(fallbackPath);
        return await pdfDoc.embedFont(fallbackBytes);
      } catch (fallbackError) {
        console.warn("Cairo font not found, using default font");
        // If no Cairo font exists, create a simple fallback
        try {
          // Try to embed a standard font (Helvetica is usually available in PDF viewers)
          return await pdfDoc.embedFont(pdfDoc.StandardFonts.Helvetica);
        } catch (finalError) {
          // Last resort - create a basic font embedding
          return await pdfDoc.embedFont(pdfDoc.StandardFonts.Helvetica);
        }
      }
    }
  }

  /**
   * Generate certificate PDF
   * @param {Object} certificateData
   * @param {Object} template
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateCertificatePDF(certificateData, template) {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Register fontkit
      pdfDoc.registerFontkit(fontkit);

      // Set page size based on template
      // Support orientation: swap width/height for portrait
      let pageWidth = template.width || 1200;
      let pageHeight = template.height || 900;

      // If orientation is portrait and width > height, swap them
      if (template.orientation === 'portrait' && pageWidth > pageHeight) {
        [pageWidth, pageHeight] = [pageHeight, pageWidth];
      }
      // If orientation is landscape and height > width, swap them
      else if (template.orientation === 'landscape' && pageHeight > pageWidth) {
        [pageWidth, pageHeight] = [pageHeight, pageWidth];
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const { width, height } = page.getSize();

      // Load default font (Cairo) for fallback
      const defaultFont = await this.loadFont(pdfDoc, "Cairo");

      // Font cache to avoid loading same font multiple times
      const fontCache = {
        "Cairo": defaultFont
      };

      // Try to load background image if provided
      if (template.backgroundImage) {
        try {
          const imageBytes = await this.loadImage(template.backgroundImage);
          let image;

          // Check image type and embed accordingly
          if (template.backgroundImage.toLowerCase().endsWith(".png")) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            image = await pdfDoc.embedJpg(imageBytes);
          }

          page.drawImage(image, {
            x: 0,
            y: 0,
            width,
            height,
          });
        } catch (imgError) {
          console.error("Error loading background image:", imgError.message);
          // Draw a simple border if image fails
          page.drawRectangle({
            x: 50,
            y: 50,
            width: width - 100,
            height: height - 100,
            borderColor: rgb(0.5, 0.7, 0.3),
            borderWidth: 5,
          });
        }
      }

      // Helper function to draw text
      const drawText = async (text, placeholderConfig, defaultY) => {
        if (!placeholderConfig || !text) return;

        // Reshape if Arabic
        const processedText = this.reshapeArabic(text);

        const config = {
          x: placeholderConfig.x || width / 2,
          y: placeholderConfig.y || defaultY,
          fontSize: placeholderConfig.fontSize || 24,
          color: this.hexToRgb(placeholderConfig.color || "#000000"),
          align: placeholderConfig.align || "center",
          fontFamily: placeholderConfig.fontFamily || "Cairo",
          fontWeight: placeholderConfig.fontWeight || "normal",
        };

        // Load font if not in cache
        if (!fontCache[config.fontFamily]) {
          fontCache[config.fontFamily] = await this.loadFont(pdfDoc, config.fontFamily);
        }

        const font = fontCache[config.fontFamily];
        const textWidth = font.widthOfTextAtSize(processedText, config.fontSize);

        let xPosition = config.x;
        if (config.align === "center") {
          xPosition = config.x - textWidth / 2;
        } else if (config.align === "right") {
          xPosition = config.x - textWidth;
        }

        page.drawText(processedText, {
          x: xPosition,
          y: height - config.y, // Flip Y coordinate for PDF
          size: config.fontSize,
          font: font,
          color: config.color,
        });
      };

      // Get text values
      const locale = "ar"; // Default to Arabic for Quran platform
      const studentName =
        typeof certificateData.studentName === "string"
          ? certificateData.studentName
          : certificateData.studentName?.[locale] ||
          certificateData.studentName?.en ||
          "Student";

      const courseName =
        typeof certificateData.courseName === "string"
          ? certificateData.courseName
          : certificateData.courseName?.[locale] ||
          certificateData.courseName?.en ||
          "Course";

      const issuedDate = new Date(certificateData.issuedAt).toLocaleDateString(
        locale === "ar" ? "ar-EG" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );

      // Draw certificate elements
      const placeholders = template.placeholders || {};

      // Student Name
      if (placeholders.studentName) {
        await drawText(studentName, placeholders.studentName, height - 300);
      }

      // Course Name
      if (placeholders.courseName) {
        await drawText(courseName, placeholders.courseName, height - 450);
      }

      // Issue Date
      if (placeholders.issuedDate) {
        await drawText(issuedDate, placeholders.issuedDate, height - 600);
      }

      // Certificate Number
      if (placeholders.certificateNumber) {
        await drawText(
          certificateData.certificateNumber,
          placeholders.certificateNumber,
          height - 750
        );
      }

      // Custom Text Elements
      if (placeholders.customText && Array.isArray(placeholders.customText)) {
        for (const custom of placeholders.customText) {
          if (custom.text) {
            await drawText(custom.text, custom, height / 2);
          }
        }
      }

      // Additional Images
      if (placeholders.images && Array.isArray(placeholders.images)) {
        for (const imgConfig of placeholders.images) {
          try {
            const imgBytes = await this.loadImage(imgConfig.url);
            let img;
            if (imgConfig.url.toLowerCase().endsWith(".png")) {
              img = await pdfDoc.embedPng(imgBytes);
            } else {
              img = await pdfDoc.embedJpg(imgBytes);
            }

            page.drawImage(img, {
              x: imgConfig.x,
              y: height - imgConfig.y - imgConfig.height,
              width: imgConfig.width,
              height: imgConfig.height,
            });
          } catch (err) {
            console.error("Error drawing additional image:", err.message);
          }
        }
      }

      // Default layout if no placeholders configured
      if (
        !placeholders.studentName &&
        !placeholders.courseName &&
        !placeholders.issuedDate &&
        !placeholders.certificateNumber
      ) {
        const font = defaultFont;

        // Title
        const title = "CERTIFICATE OF COMPLETION";
        page.drawText(title, {
          x: width / 2 - font.widthOfTextAtSize(title, 36) / 2,
          y: height - 150,
          size: 36,
          font: font,
          color: rgb(0.2, 0.4, 0.2),
        });

        // شهادة إتمام
        const certTitleAr = this.reshapeArabic("شهادة إتمام");
        page.drawText(certTitleAr, {
          x: width / 2 - font.widthOfTextAtSize(certTitleAr, 32) / 2,
          y: height - 200,
          size: 32,
          font: font,
          color: rgb(0.2, 0.4, 0.2),
        });

        // Student name
        const sNameProcessed = this.reshapeArabic(studentName);
        page.drawText(sNameProcessed, {
          x: width / 2 - font.widthOfTextAtSize(sNameProcessed, 32) / 2,
          y: height - 350,
          size: 32,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Course name
        const cNameProcessed = this.reshapeArabic(courseName);
        page.drawText(cNameProcessed, {
          x: width / 2 - font.widthOfTextAtSize(cNameProcessed, 24) / 2,
          y: height - 450,
          size: 24,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Issue date
        const dateText = `Issued on: ${issuedDate}`;
        const dateTextProcessed = this.reshapeArabic(dateText);
        page.drawText(dateTextProcessed, {
          x: width / 2 - font.widthOfTextAtSize(dateTextProcessed, 18) / 2,
          y: height - 600,
          size: 18,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });

        // Certificate number
        const certNoText = `Certificate #: ${certificateData.certificateNumber}`;
        const certNoTextProcessed = this.reshapeArabic(certNoText);
        page.drawText(certNoTextProcessed, {
          x: width / 2 - font.widthOfTextAtSize(certNoTextProcessed, 14) / 2,
          y: height - 750,
          size: 14,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Error generating certificate PDF:", error);
      throw new Error(`Failed to generate certificate PDF: ${error.message}`);
    }
  }

  /**
   * Load image from URL or file path
   */
  async loadImage(imagePath) {
    try {
      // Check if it's a URL
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        const response = await axios.get(imagePath, {
          responseType: "arraybuffer",
        });
        return Buffer.from(response.data);
      }

      // Check if it's a file path
      let cleanPath = imagePath;
      if (cleanPath.startsWith("/uploads/")) {
        cleanPath = cleanPath.replace("/uploads/", "");
      }
      if (cleanPath.startsWith("uploads/")) {
        cleanPath = cleanPath.replace("uploads/", "");
      }

      const fullPath = path.isAbsolute(cleanPath)
        ? cleanPath
        : path.join(__dirname, "..", "..", "uploads", cleanPath);

      return await fs.readFile(fullPath);
    } catch (error) {
      throw new Error(`Failed to load image: ${error.message}`);
    }
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      )
      : rgb(0, 0, 0);
  }

  /**
   * Save PDF to file
   */
  async savePDF(pdfBuffer, fileName) {
    const uploadsDir = path.join(__dirname, "..", "..", "uploads", "certificates");

    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    return `/uploads/certificates/${fileName}`;
  }
}

export default new PDFGenerationService();
