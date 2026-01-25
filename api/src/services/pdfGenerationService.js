import { PDFDocument, rgb } from "pdf-lib";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fontkit = require("fontkit");
const arabicReshaper = require("arabic-reshaper");
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGenerationService {
  /**
   * Check if text contains Arabic characters
   */
  containsArabic(text) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  }

  /**
   * Check if text contains Latin characters
   */
  containsLatin(text) {
    return /[a-zA-Z]/.test(text);
  }

  /**
   * Detect if text is primarily Arabic (RTL)
   * Returns true if the first strong directional character is Arabic
   */
  isRtlText(text) {
    if (!text) return false;
    // Check the first significant character to determine direction
    const firstArabicIndex = text.search(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
    const firstLatinIndex = text.search(/[a-zA-Z]/);
    
    if (firstArabicIndex === -1) return false;
    if (firstLatinIndex === -1) return true;
    
    return firstArabicIndex < firstLatinIndex;
  }

  /**
   * Reshape and process Arabic text for PDF rendering
   * Handles mixed Arabic/English text properly
   */
  reshapeArabic(text) {
    if (!text) return "";
    
    // Ensure text is a string
    const stringText = String(text);

    // Check if text contains Arabic characters
    const hasArabic = this.containsArabic(stringText);
    if (!hasArabic) return stringText;

    try {
      // Check for mixed content (Arabic + Latin/Numbers)
      const hasLatin = this.containsLatin(stringText);
      const hasNumbers = /\d/.test(stringText);
      
      if (hasLatin || hasNumbers) {
        // Mixed content: use improved bidi algorithm
        return this.processBidiText(stringText);
      } else {
        // Pure Arabic: reshape and reverse for PDF rendering
        const reshaped = arabicReshaper.reshape(stringText);
        return reshaped.split("").reverse().join("");
      }
    } catch (error) {
      console.error("Arabic reshaping error for text:", stringText, error);
      return stringText;
    }
  }

  /**
   * Process bidirectional text (mixed Arabic/English/Numbers)
   * Implements a simplified visual ordering algorithm for PDF
   */
  processBidiText(text) {
    // Split text into runs of similar direction
    const runs = [];
    let currentRun = "";
    let currentType = null; // 'rtl', 'ltr', 'neutral'

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      let charType;

      if (this.containsArabic(char)) {
        charType = 'rtl';
      } else if (/[a-zA-Z]/.test(char)) {
        charType = 'ltr';
      } else if (/\d/.test(char)) {
        // Numbers follow the embedding direction (treat as weak LTR but keep with adjacent text)
        charType = 'number';
      } else {
        // Whitespace and punctuation
        charType = 'neutral';
      }

      if (currentType === null) {
        currentType = charType;
        currentRun = char;
      } else if (charType === currentType || charType === 'neutral' || charType === 'number') {
        currentRun += char;
      } else {
        // Save current run and start new one
        runs.push({ text: currentRun, type: currentType });
        currentRun = char;
        currentType = charType;
      }
    }

    // Don't forget the last run
    if (currentRun) {
      runs.push({ text: currentRun, type: currentType });
    }

    // Process each run
    const processedRuns = runs.map(run => {
      if (run.type === 'rtl') {
        // Reshape Arabic text and reverse characters
        try {
          const reshaped = arabicReshaper.reshape(run.text);
          return { text: reshaped.split("").reverse().join(""), type: 'rtl' };
        } catch (e) {
          return { text: run.text.split("").reverse().join(""), type: 'rtl' };
        }
      }
      return run;
    });

    // For RTL base direction (Arabic text), reverse the order of runs
    // This puts the first Arabic text on the right side
    const baseRtl = this.isRtlText(text);
    if (baseRtl) {
      processedRuns.reverse();
    }

    return processedRuns.map(r => r.text).join("");
  }

  /**
   * Process mixed Arabic/English text (legacy method - kept for compatibility)
   * @deprecated Use processBidiText instead
   */
  processMixedText(text) {
    return this.processBidiText(text);
  }

  /**
   * Detect locale from certificate data
   * Returns 'ar' for Arabic, 'en' for English
   */
  detectLocale(certificateData) {
    // Check if student name has Arabic characters
    let name = "";
    if (typeof certificateData.studentName === "string") {
      name = certificateData.studentName;
    } else if (certificateData.studentName?.ar) {
      // If we have bilingual data, prefer Arabic for Arabic-first platforms
      name = certificateData.studentName.ar;
    }
    
    // If student name contains Arabic, use Arabic locale
    if (this.containsArabic(name)) {
      return "ar";
    }
    
    // Otherwise use English
    return "en";
  }

  /**
   * Font mapping: Maps font family names to .ttf filenames
   * Note: Font weight variants would need separate font files
   * For now, we use Regular variants and simulate bold with stroke
   */
  getFontFilename(fontFamily, fontWeight = "normal") {
    // Map font weight strings to standardized values
    const normalizedWeight = this.normalizeFontWeight(fontWeight);
    
    // For now, use regular variants (font files for different weights would need to be added)
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
   * Normalize font weight to standard values
   */
  normalizeFontWeight(fontWeight) {
    if (!fontWeight) return "normal";
    
    const weight = String(fontWeight).toLowerCase();
    
    // Map numeric weights to descriptive values
    const weightMap = {
      "100": "thin",
      "200": "extralight",
      "300": "light",
      "400": "normal",
      "500": "medium",
      "600": "semibold",
      "700": "bold",
      "800": "extrabold",
      "900": "black",
      "normal": "normal",
      "bold": "bold",
      "medium": "medium",
    };
    
    return weightMap[weight] || "normal";
  }

  /**
   * Check if font weight is bold-like (for simulated bold)
   */
  isBoldWeight(fontWeight) {
    const weight = this.normalizeFontWeight(fontWeight);
    return ["bold", "semibold", "extrabold", "black", "600", "700", "800", "900"].includes(weight) || 
           ["bold", "semibold", "extrabold", "black"].includes(weight);
  }

  /**
   * Normalize and validate a placeholder configuration
   * Ensures all required properties exist with proper defaults
   */
  normalizeplaceholder(placeholder, pageWidth, pageHeight) {
    if (!placeholder || typeof placeholder !== 'object') {
      return null;
    }

    // Ensure all properties exist with defaults
    return {
      x: placeholder.x !== undefined && placeholder.x !== null ? Number(placeholder.x) : pageWidth / 2,
      y: placeholder.y !== undefined && placeholder.y !== null ? Number(placeholder.y) : 400,
      fontSize: placeholder.fontSize !== undefined && placeholder.fontSize !== null && Number(placeholder.fontSize) > 0 ? Number(placeholder.fontSize) : 24,
      fontFamily: placeholder.fontFamily && typeof placeholder.fontFamily === 'string' ? placeholder.fontFamily : "Cairo",
      color: placeholder.color && typeof placeholder.color === 'string' ? placeholder.color : "#000000",
      align: placeholder.align && typeof placeholder.align === 'string' ? placeholder.align : "center",
      fontWeight: placeholder.fontWeight && typeof placeholder.fontWeight === 'string' ? placeholder.fontWeight : "normal",
      text: placeholder.text || undefined, // For custom text
    };
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
   * @param {String} preferredLocale - Optional locale preference ('ar' or 'en')
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateCertificatePDF(certificateData, template, preferredLocale = null) {
    try {
      // Validate inputs
      if (!certificateData) {
        throw new Error('Certificate data is required');
      }

      if (!template) {
        throw new Error('Template is required');
      }

      // Convert Mongoose document to plain object if needed
      // Note: With .lean() queries from certificateService, template should already be plain
      const templateObj = template;
      
      // Deep clone placeholders to avoid reference issues and ensure all properties are accessible
      const placeholders = templateObj.placeholders 
        ? JSON.parse(JSON.stringify(templateObj.placeholders)) 
        : {};

      // Ensure certificateData is a plain object
      const data = typeof certificateData.toObject === 'function' 
        ? certificateData.toObject() 
        : (certificateData._doc ? { ...certificateData._doc } : { ...certificateData });

      // Detect locale from certificate data or use preferred/default
      const locale = preferredLocale || this.detectLocale(data) || "ar";

      console.log('Generating certificate PDF with template:', {
        templateId: templateObj._id || templateObj.id,
        templateName: templateObj.name,
        hasPlaceholders: !!placeholders,
        placeholdersKeys: Object.keys(placeholders),
        placeholdersContent: placeholders,
        isFallback: templateObj.isFallback,
        locale: locale,
        certificateData: {
          certificateNumber: data.certificateNumber,
          studentName: data.studentName,
          courseName: data.courseName
        }
      });

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
          // Draw a simple colored background if image fails
          page.drawRectangle({
            x: 0,
            y: 0,
            width,
            height,
            color: rgb(0.95, 0.95, 0.95), // Light gray background
          });

          // Draw border
          page.drawRectangle({
            x: 20,
            y: 20,
            width: width - 40,
            height: height - 40,
            borderColor: rgb(0.2, 0.4, 0.2),
            borderWidth: 2,
          });
        }
      } else {
        // Default background if no image provided
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0.98, 0.98, 0.98), // Very light gray
        });

        // Draw decorative border
        page.drawRectangle({
          x: 30,
          y: 30,
          width: width - 60,
          height: height - 60,
          borderColor: rgb(0.2, 0.4, 0.2),
          borderWidth: 1,
        });
      }

      // Helper function to draw text with proper coordinate transformation and RTL support
      const drawText = async (text, placeholderConfig, defaultY) => {
        if (!placeholderConfig || !text) return;

        // Log the raw placeholder config for debugging
        console.log('Raw placeholder config:', JSON.stringify(placeholderConfig, null, 2));

        // Explicitly extract each property with proper fallbacks
        const rawX = placeholderConfig.x;
        const rawY = placeholderConfig.y;
        const rawFontSize = placeholderConfig.fontSize;
        const rawColor = placeholderConfig.color;
        const rawAlign = placeholderConfig.align;
        const rawFontFamily = placeholderConfig.fontFamily;
        const rawFontWeight = placeholderConfig.fontWeight;

        // Build config with explicit property extraction
        const config = {
          x: rawX !== undefined && rawX !== null ? Number(rawX) : width / 2,
          y: rawY !== undefined && rawY !== null ? Number(rawY) : defaultY,
          fontSize: rawFontSize !== undefined && rawFontSize !== null && rawFontSize > 0 ? Number(rawFontSize) : 24,
          color: this.hexToRgb(rawColor && typeof rawColor === 'string' ? rawColor : "#000000"),
          align: rawAlign && typeof rawAlign === 'string' ? rawAlign : "center",
          fontFamily: rawFontFamily && typeof rawFontFamily === 'string' ? rawFontFamily : "Cairo",
          fontWeight: rawFontWeight && typeof rawFontWeight === 'string' ? rawFontWeight : "normal",
        };

        // Detect if text is RTL (Arabic)
        const textIsRtl = this.isRtlText(String(text));
        const textHasArabic = this.containsArabic(String(text));

        // Log the resolved config
        console.log('Resolved text config:', {
          text: String(text).substring(0, 50),
          x: config.x,
          y: config.y,
          fontSize: config.fontSize,
          colorHex: rawColor,
          align: config.align,
          fontFamily: config.fontFamily,
          fontWeight: config.fontWeight,
          isRtl: textIsRtl,
          hasArabic: textHasArabic,
        });

        // Process text for Arabic/RTL if needed
        const processedText = this.reshapeArabic(String(text));

        // Validate coordinates are within page bounds
        if (config.x < 0 || config.x > width) {
          console.warn(`Text X position out of bounds: x=${config.x}, adjusting`);
          config.x = Math.max(0, Math.min(config.x, width));
        }
        if (config.y < 0 || config.y > height) {
          console.warn(`Text Y position out of bounds: y=${config.y}, adjusting`);
          config.y = Math.max(0, Math.min(config.y, height));
        }

        // Load font if not in cache
        if (!fontCache[config.fontFamily]) {
          try {
            fontCache[config.fontFamily] = await this.loadFont(pdfDoc, config.fontFamily);
          } catch (fontError) {
            console.error(`Failed to load font ${config.fontFamily}:`, fontError.message);
            fontCache[config.fontFamily] = defaultFont; // Use fallback
          }
        }

        const font = fontCache[config.fontFamily];
        const textWidth = font.widthOfTextAtSize(processedText, config.fontSize);

        // Calculate X position based on alignment AND text direction
        // For RTL text, alignment interpretation may need adjustment
        let xPosition = config.x;
        let effectiveAlign = config.align;

        // For center alignment, both LTR and RTL work the same
        if (effectiveAlign === "center") {
          xPosition = config.x - textWidth / 2;
        } else if (effectiveAlign === "right") {
          // Right alignment: text ends at x position
          xPosition = config.x - textWidth;
        } else if (effectiveAlign === "left") {
          // Left alignment: text starts at x position
          xPosition = config.x;
        }

        // Ensure text doesn't go off the page
        xPosition = Math.max(10, Math.min(xPosition, width - textWidth - 10));

        // Transform Y coordinate: Web uses top-down, PDF uses bottom-up
        // The y value from frontend is distance from TOP, we need distance from BOTTOM
        const pdfY = height - config.y - config.fontSize;

        // Ensure Y is within bounds
        const safePdfY = Math.max(10, Math.min(pdfY, height - 10));

        // Check if we should simulate bold
        const isBold = this.isBoldWeight(config.fontWeight);

        console.log('Final draw position:', {
          xPosition,
          safePdfY,
          textWidth,
          effectiveAlign,
          isBold,
        });

        // Draw text (simulate bold by drawing multiple times with slight offset if needed)
        if (isBold) {
          // Draw text multiple times with slight offset to simulate bold
          const offsets = [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5]];
          for (const [ox, oy] of offsets) {
            page.drawText(processedText, {
              x: xPosition + ox,
              y: safePdfY + oy,
              size: config.fontSize,
              font: font,
              color: config.color,
            });
          }
        } else {
          page.drawText(processedText, {
            x: xPosition,
            y: safePdfY,
            size: config.fontSize,
            font: font,
            color: config.color,
          });
        }
      };

      // Get text values based on locale and content language detection
      // Helper to get best text value considering both locale preference and content language
      const getBilingualText = (textData, defaultAr, defaultEn) => {
        if (!textData) {
          return locale === "ar" ? defaultAr : defaultEn;
        }
        
        if (typeof textData === "string") {
          return textData;
        }
        
        if (typeof textData === "object") {
          // Get both values
          const arText = textData.ar || defaultAr;
          const enText = textData.en || defaultEn;
          
          // Prefer the locale-appropriate text, but fall back to the other
          if (locale === "ar") {
            // For Arabic locale, prefer Arabic text
            return arText || enText;
          } else {
            // For English locale, prefer English text, but use Arabic if English is empty
            return enText || arText;
          }
        }
        
        return locale === "ar" ? defaultAr : defaultEn;
      };

      // Handle student name (could be string or object with ar/en)
      const studentName = getBilingualText(data.studentName, "الطالب", "Student");

      // Handle course name (could be string or object with ar/en)
      const courseName = getBilingualText(data.courseName, "الدورة", "Course");

      console.log('Resolved text values:', {
        locale,
        studentName,
        studentNameIsRtl: this.isRtlText(studentName),
        courseName,
        courseNameIsRtl: this.isRtlText(courseName),
        originalStudentName: data.studentName,
        originalCourseName: data.courseName
      });

      const issuedDate = new Date(data.issuedAt || Date.now()).toLocaleDateString(
        locale === "ar" ? "ar-EG" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );

      // Draw certificate elements based on template placeholders
      // Track if we drew any placeholder successfully
      let drewAnyPlaceholder = false;

      // Normalize all placeholders before processing
      const normalizedPlaceholders = {
        studentName: this.normalizeplaceholder(placeholders.studentName, width, height),
        courseName: this.normalizeplaceholder(placeholders.courseName, width, height),
        issuedDate: this.normalizeplaceholder(placeholders.issuedDate, width, height),
        certificateNumber: this.normalizeplaceholder(placeholders.certificateNumber, width, height),
        customText: (placeholders.customText || []).map(ct => this.normalizeplaceholder(ct, width, height)).filter(Boolean),
        images: placeholders.images || [],
      };

      console.log('Normalized placeholders:', {
        studentName: normalizedPlaceholders.studentName,
        courseName: normalizedPlaceholders.courseName,
        issuedDate: normalizedPlaceholders.issuedDate,
        certificateNumber: normalizedPlaceholders.certificateNumber,
        customTextCount: normalizedPlaceholders.customText?.length,
        imagesCount: normalizedPlaceholders.images?.length
      });

      // Student Name
      if (normalizedPlaceholders.studentName) {
        console.log('Drawing student name:', studentName, 'at position:', normalizedPlaceholders.studentName);
        await drawText(studentName, normalizedPlaceholders.studentName, 300);
        drewAnyPlaceholder = true;
      } else {
        console.log('No valid student name placeholder found');
      }

      // Course Name
      if (normalizedPlaceholders.courseName) {
        console.log('Drawing course name:', courseName, 'at position:', normalizedPlaceholders.courseName);
        await drawText(courseName, normalizedPlaceholders.courseName, 450);
        drewAnyPlaceholder = true;
      } else {
        console.log('No valid course name placeholder found');
      }

      // Issue Date
      if (normalizedPlaceholders.issuedDate) {
        console.log('Drawing issued date:', issuedDate, 'at position:', normalizedPlaceholders.issuedDate);
        await drawText(issuedDate, normalizedPlaceholders.issuedDate, 600);
        drewAnyPlaceholder = true;
      } else {
        console.log('No valid issued date placeholder found');
      }

      // Certificate Number
      const certNumber = data.certificateNumber || "CERT-XXXX";
      if (normalizedPlaceholders.certificateNumber) {
        console.log('Drawing certificate number:', certNumber, 'at position:', normalizedPlaceholders.certificateNumber);
        await drawText(
          certNumber,
          normalizedPlaceholders.certificateNumber,
          750
        );
        drewAnyPlaceholder = true;
      } else {
        console.log('No valid certificate number placeholder found');
      }

      // Custom Text Elements
      if (normalizedPlaceholders.customText && normalizedPlaceholders.customText.length > 0) {
        console.log('Drawing custom text elements:', normalizedPlaceholders.customText.length);
        for (const custom of normalizedPlaceholders.customText) {
          if (custom && custom.text) {
            console.log('Drawing custom text:', custom.text, 'at position:', custom);
            await drawText(custom.text, custom, height / 2);
            drewAnyPlaceholder = true;
          }
        }
      }

      // Additional Images
      if (normalizedPlaceholders.images && Array.isArray(normalizedPlaceholders.images) && normalizedPlaceholders.images.length > 0) {
        console.log('Drawing additional images:', normalizedPlaceholders.images.length);
        for (const imgConfig of normalizedPlaceholders.images) {
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
            console.log('Successfully drew image at position:', imgConfig);
          } catch (err) {
            console.error("Error drawing additional image:", err.message);
          }
        }
      }

      // Decide whether to use default layout
      // Use default layout only if:
      // 1. No placeholders were drawn at all, OR
      // 2. Force flags are enabled
      const shouldUseDefaultLayout = !drewAnyPlaceholder;
      const forceDefaultLayout = process.env.DEBUG_CERTIFICATE_TEMPLATES === 'true';
      const alwaysUseDefaultLayout = process.env.ALWAYS_USE_DEFAULT_CERTIFICATE_LAYOUT === 'true';

      if (shouldUseDefaultLayout || forceDefaultLayout || alwaysUseDefaultLayout) {
        console.log('Using default layout. shouldUseDefaultLayout:', shouldUseDefaultLayout, 'forceDefaultLayout:', forceDefaultLayout, 'alwaysUseDefaultLayout:', alwaysUseDefaultLayout);
        const font = defaultFont;
        const centerX = width / 2;

        // Header decoration
        page.drawRectangle({
          x: 50,
          y: height - 120,
          width: width - 100,
          height: 3,
          color: rgb(0.2, 0.4, 0.2),
        });

        // Title - "CERTIFICATE OF COMPLETION"
        const title = "CERTIFICATE OF COMPLETION";
        const titleFontSize = 42;
        const titleWidth = font.widthOfTextAtSize(title, titleFontSize);
        const titleX = centerX - titleWidth / 2;
        const titleY = height - 180;

        // Ensure title is within bounds
        const safeTitleX = Math.max(20, Math.min(titleX, width - titleWidth - 20));

        page.drawText(title, {
          x: safeTitleX,
          y: titleY,
          size: titleFontSize,
          font: font,
          color: rgb(0.1, 0.3, 0.1),
        });

        // Arabic Title - "شهادة إتمام"
        const certTitleAr = this.reshapeArabic("شهادة إتمام");
        const arTitleFontSize = 32;
        const arTitleWidth = font.widthOfTextAtSize(certTitleAr, arTitleFontSize);
        const arTitleX = centerX - arTitleWidth / 2;
        const arTitleY = height - 200;

        const safeArTitleX = Math.max(20, Math.min(arTitleX, width - arTitleWidth - 20));

        page.drawText(certTitleAr, {
          x: safeArTitleX,
          y: arTitleY,
          size: arTitleFontSize,
          font: font,
          color: rgb(0.2, 0.4, 0.2),
        });

        // Student name header
        const studentHeader = this.reshapeArabic("يُمنح هذا الشهادة إلى");
        const headerFontSize = 20;
        const headerWidth = font.widthOfTextAtSize(studentHeader, headerFontSize);
        const headerX = centerX - headerWidth / 2;
        const headerY = height - 280;

        const safeHeaderX = Math.max(20, Math.min(headerX, width - headerWidth - 20));

        page.drawText(studentHeader, {
          x: safeHeaderX,
          y: headerY,
          size: headerFontSize,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });

        // Student name
        const sNameProcessed = this.reshapeArabic(studentName);
        const studentFontSize = 36;
        const studentWidth = font.widthOfTextAtSize(sNameProcessed, studentFontSize);
        const studentX = centerX - studentWidth / 2;
        const studentY = height - 340;

        const safeStudentX = Math.max(20, Math.min(studentX, width - studentWidth - 20));

        page.drawText(sNameProcessed, {
          x: safeStudentX,
          y: studentY,
          size: studentFontSize,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Decorative line under student name
        page.drawRectangle({
          x: centerX - 100,
          y: height - 350,
          width: 200,
          height: 2,
          color: rgb(0.2, 0.4, 0.2),
        });

        // Course completion text
        const courseHeader = this.reshapeArabic("لإتمامه المساق");
        const courseHeaderFontSize = 20;
        const courseHeaderWidth = font.widthOfTextAtSize(courseHeader, courseHeaderFontSize);
        const courseHeaderX = centerX - courseHeaderWidth / 2;
        const courseHeaderY = height - 420;

        const safeCourseHeaderX = Math.max(20, Math.min(courseHeaderX, width - courseHeaderWidth - 20));

        page.drawText(courseHeader, {
          x: safeCourseHeaderX,
          y: courseHeaderY,
          size: courseHeaderFontSize,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });

        // Course name
        const cNameProcessed = this.reshapeArabic(courseName);
        const courseFontSize = 28;
        const courseWidth = font.widthOfTextAtSize(cNameProcessed, courseFontSize);
        const courseX = centerX - courseWidth / 2;
        const courseY = height - 480;

        const safeCourseX = Math.max(20, Math.min(courseX, width - courseWidth - 20));

        page.drawText(cNameProcessed, {
          x: safeCourseX,
          y: courseY,
          size: courseFontSize,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Footer section with decorative elements
        page.drawRectangle({
          x: 100,
          y: height - 650,
          width: width - 200,
          height: 1,
          color: rgb(0.7, 0.7, 0.7),
        });

        // Issue date
        const dateLabel = this.reshapeArabic("تاريخ الإصدار:");
        const dateLabelFontSize = 16;
        const dateLabelWidth = font.widthOfTextAtSize(dateLabel, dateLabelFontSize);
        const dateLabelX = centerX - 150;
        const dateLabelY = height - 680;

        page.drawText(dateLabel, {
          x: dateLabelX,
          y: dateLabelY,
          size: dateLabelFontSize,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });

        const dateValue = this.reshapeArabic(issuedDate);
        const dateValueFontSize = 16;
        const dateValueWidth = font.widthOfTextAtSize(dateValue, dateValueFontSize);
        const dateValueX = centerX + 50;
        const dateValueY = height - 680;

        page.drawText(dateValue, {
          x: dateValueX,
          y: dateValueY,
          size: dateValueFontSize,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Certificate number
        const certNoLabel = this.reshapeArabic("رقم الشهادة:");
        const certNoLabelFontSize = 14;
        const certNoLabelWidth = font.widthOfTextAtSize(certNoLabel, certNoLabelFontSize);
        const certNoLabelX = centerX - 150;
        const certNoLabelY = height - 720;

        page.drawText(certNoLabel, {
          x: certNoLabelX,
          y: certNoLabelY,
          size: certNoLabelFontSize,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });

        const certNoValue = this.reshapeArabic(certificateData.certificateNumber);
        const certNoValueFontSize = 14;
        const certNoValueWidth = font.widthOfTextAtSize(certNoValue, certNoValueFontSize);
        const certNoValueX = centerX + 50;
        const certNoValueY = height - 720;

        page.drawText(certNoValue, {
          x: certNoValueX,
          y: certNoValueY,
          size: certNoValueFontSize,
          font: font,
          color: rgb(0, 0, 0),
        });

        // Footer decoration
        page.drawRectangle({
          x: 50,
          y: height - 750,
          width: width - 100,
          height: 2,
          color: rgb(0.2, 0.4, 0.2),
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
