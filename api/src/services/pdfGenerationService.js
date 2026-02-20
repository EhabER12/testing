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

// ============ MODULE-LEVEL CACHES FOR PERFORMANCE ============
// Font bytes cache - stores raw font file contents
const fontBytesCache = new Map();
// Image bytes cache - stores raw image file contents
const imageBytesCache = new Map();

// Configuration paths (can be overridden by environment variables)
const FONTS_PATH = process.env.CERTIFICATE_FONTS_PATH || path.join(__dirname, "..", "assets", "fonts");
const UPLOADS_PATH = process.env.CERTIFICATE_UPLOADS_PATH || path.join(__dirname, "..", "..", "uploads");

class PDFGenerationService {
  constructor() {
    // Per-document font cache (embedded fonts are document-specific)
    this.documentFontCache = null;
  }

  /**
   * Check if text contains Arabic characters (extended range)
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
    const firstArabicIndex = text.search(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/);
    const firstLatinIndex = text.search(/[a-zA-Z]/);
    
    if (firstArabicIndex === -1) return false;
    if (firstLatinIndex === -1) return true;
    
    return firstArabicIndex < firstLatinIndex;
  }

  /**
   * Reshape and process Arabic text for PDF rendering
   * 
   * arabic-reshaper.convertArabic() converts Arabic text to Presentation Forms
   * which are already in the correct visual order for left-to-right rendering.
   * DO NOT reverse the output - it's already in display order.
   */
  reshapeArabic(text) {
    if (!text) return "";
    const stringText = String(text);
    
    // If no Arabic, return as-is
    if (!this.containsArabic(stringText)) return stringText;

    try {
      // Convert to Arabic Presentation Forms (connected letter shapes)
      // The output is already in visual LTR order - DO NOT REVERSE
      return arabicReshaper.convertArabic(stringText);
    } catch (error) {
      console.error("Arabic text processing error:", error.message);
      return stringText;
    }
  }

  /**
   * Reverse a string properly (handles surrogate pairs)
   */
  reverseString(str) {
    // Use Array.from to handle Unicode properly (including surrogate pairs)
    return Array.from(str).reverse().join('');
  }

  /**
   * Process mixed Arabic/Latin/Number text for PDF (BiDi)
   */
  processMixedBidiText(text) {
    // First convert to presentation forms
    const shaped = arabicReshaper.convertArabic(text);
    
    // Split into runs of Arabic vs non-Arabic
    const runs = [];
    let currentRun = '';
    let currentIsArabic = null;
    
    for (const char of Array.from(shaped)) {
      const isArabic = this.containsArabic(char);
      
      if (currentIsArabic === null) {
        currentIsArabic = isArabic;
        currentRun = char;
      } else if (isArabic === currentIsArabic || (!isArabic && /[\s]/.test(char))) {
        currentRun += char;
      } else {
        if (currentRun) runs.push({ text: currentRun, rtl: currentIsArabic });
        currentRun = char;
        currentIsArabic = isArabic;
      }
    }
    if (currentRun) runs.push({ text: currentRun, rtl: currentIsArabic });
    
    // For RTL base direction: reverse run order, and reverse RTL runs internally
    const processedRuns = runs.map(run => {
      if (run.rtl) {
        return this.reverseString(run.text);
      }
      return run.text;
    });
    
    // Reverse the order of runs for RTL base
    return processedRuns.reverse().join('');
  }

  /**
   * Process bidirectional text (mixed Arabic/English/Numbers)
   * Improved algorithm that handles numbers and punctuation better
   */
  processBidiText(text) {
    try {
      const runs = [];
      let currentRun = "";
      let currentType = null;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        let charType;

        if (this.containsArabic(char)) {
          charType = 'rtl';
        } else if (/[a-zA-Z]/.test(char)) {
          charType = 'ltr';
        } else if (/\d/.test(char)) {
          // Numbers inherit direction from surrounding text
          charType = 'number';
        } else {
          charType = 'neutral';
        }

        if (currentType === null) {
          currentType = charType;
          currentRun = char;
        } else if (charType === currentType || charType === 'neutral' || charType === 'number') {
          currentRun += char;
        } else {
          runs.push({ text: currentRun, type: currentType });
          currentRun = char;
          currentType = charType;
        }
      }

      if (currentRun) {
        runs.push({ text: currentRun, type: currentType });
      }

      // Process each run
      const processedRuns = runs.map(run => {
        if (run.type === 'rtl') {
          try {
            // Note: arabic-reshaper uses convertArabic, not reshape
            const reshaped = arabicReshaper.convertArabic(run.text);
            return { text: reshaped.split("").reverse().join(""), type: 'rtl' };
          } catch (e) {
            return { text: run.text.split("").reverse().join(""), type: 'rtl' };
          }
        }
        return run;
      });

      // For RTL base direction, reverse the order of runs
      if (this.isRtlText(text)) {
        processedRuns.reverse();
      }

      return processedRuns.map(r => r.text).join("");
    } catch (error) {
      console.error("BiDi processing error:", error.message);
      return text;
    }
  }

  /**
   * Get text direction based on content
   */
  getTextDirection(text) {
    if (!text) return 'ltr';
    return this.isRtlText(text) ? 'rtl' : 'ltr';
  }

  /**
   * Detect locale from certificate data
   */
  detectLocale(certificateData) {
    let name = "";
    if (typeof certificateData.studentName === "string") {
      name = certificateData.studentName;
    } else if (certificateData.studentName?.ar) {
      name = certificateData.studentName.ar;
    }
    
    return this.containsArabic(name) ? "ar" : "en";
  }

  /**
   * Get font filename with weight support
   * NOTE: For Arabic text, Amiri is preferred as it has full Arabic glyph support
   */
  getFontFilename(fontFamily, fontWeight = "normal") {
    const isBold = this.isBoldWeight(fontWeight);
    
    // Font map with weight variants
    // Font map with local bundled fonts (plus aliases for extra Arabic families)
    const fontMap = {
      "Cairo": { regular: "Cairo-Regular.ttf", bold: "Cairo-Regular.ttf" },
      "Amiri": { regular: "Amiri-Regular.ttf", bold: "Amiri-Regular.ttf" },
      "Tajawal": { regular: "Tajawal-Regular.ttf", bold: "Tajawal-Regular.ttf" },
      "Almarai": { regular: "Almarai-Regular.ttf", bold: "Almarai-Regular.ttf" },
      "Noto Kufi Arabic": { regular: "NotoKufiArabic-Regular.ttf", bold: "NotoKufiArabic-Regular.ttf" },
      "Changa": { regular: "Tajawal-Regular.ttf", bold: "Tajawal-Regular.ttf" },
      "El Messiri": { regular: "Cairo-Regular.ttf", bold: "Cairo-Regular.ttf" },
      "Reem Kufi": { regular: "NotoKufiArabic-Regular.ttf", bold: "NotoKufiArabic-Regular.ttf" },
      "Great Vibes": { regular: "GreatVibes-Regular.ttf", bold: "GreatVibes-Regular.ttf" },
      "Dancing Script": { regular: "DancingScript-Regular.ttf", bold: "DancingScript-Regular.ttf" },
      "Pacifico": { regular: "Pacifico-Regular.ttf", bold: "Pacifico-Regular.ttf" },
    };

    const fontConfig = fontMap[fontFamily] || fontMap["Cairo"];
    return isBold ? fontConfig.bold : fontConfig.regular;
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
   * @param {Object} placeholder - The placeholder config (can be null/undefined)
   * @param {Number} pageWidth - Page width for default x position
   * @param {Number} pageHeight - Page height for default y position
   * @param {Boolean} allowNull - If true, return null for missing placeholders; if false, create defaults
   */
  normalizeplaceholder(placeholder, pageWidth, pageHeight, allowNull = false) {
    // If placeholder is completely missing and we allow null, return null
    if ((placeholder === null || placeholder === undefined) && allowNull) {
      return null;
    }

    // If placeholder is falsy, create a default placeholder
    const p = placeholder || {};

    // Ensure all properties exist with defaults
    return {
      x: p.x !== undefined && p.x !== null ? Number(p.x) : pageWidth / 2,
      y: p.y !== undefined && p.y !== null ? Number(p.y) : 400,
      fontSize: p.fontSize !== undefined && p.fontSize !== null && Number(p.fontSize) > 0 ? Number(p.fontSize) : 24,
      fontFamily: p.fontFamily && typeof p.fontFamily === 'string' ? p.fontFamily : "Cairo",
      color: p.color && typeof p.color === 'string' ? p.color : "#000000",
      align: p.align && typeof p.align === 'string' ? p.align : "center",
      fontWeight: p.fontWeight && typeof p.fontWeight === 'string' ? p.fontWeight : "normal",
      text: p.text || undefined, // For custom text
    };
  }

  /**
   * Load font bytes from disk with caching
   * Uses module-level cache to avoid repeated disk reads
   */
  async loadFontBytes(fontPath) {
    // Check module-level cache first
    if (fontBytesCache.has(fontPath)) {
      return fontBytesCache.get(fontPath);
    }
    
    // Read from disk and cache
    const fontBytes = await fs.readFile(fontPath);
    fontBytesCache.set(fontPath, fontBytes);
    return fontBytes;
  }

  /**
   * Load and embed a font with proper caching
   */
  async loadFont(pdfDoc, fontFamily, fontWeight = "normal") {
    const filename = this.getFontFilename(fontFamily, fontWeight);
    const fontPath = path.join(FONTS_PATH, filename);

    try {
      const fontBytes = await this.loadFontBytes(fontPath);
      return await pdfDoc.embedFont(fontBytes);
    } catch (error) {
      console.warn(`Font ${fontFamily} (${filename}) not found at ${fontPath}, trying fallback`);
      
      // Try regular variant if bold failed
      if (this.isBoldWeight(fontWeight)) {
        try {
          const regularFilename = this.getFontFilename(fontFamily, "normal");
          const regularPath = path.join(FONTS_PATH, regularFilename);
          const regularBytes = await this.loadFontBytes(regularPath);
          return await pdfDoc.embedFont(regularBytes);
        } catch (e) {
          // Continue to Cairo fallback
        }
      }
      
      // Fallback to Cairo
      try {
        const fallbackPath = path.join(FONTS_PATH, "Cairo-Regular.ttf");
        const fallbackBytes = await this.loadFontBytes(fallbackPath);
        return await pdfDoc.embedFont(fallbackBytes);
      } catch (fallbackError) {
        console.error("Cairo font not found, using Helvetica");
        // Use standard PDF font
        const { StandardFonts } = await import('pdf-lib');
        return await pdfDoc.embedFont(StandardFonts.Helvetica);
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

      // Detect locale - DEFAULT TO ARABIC for this platform
      // Only use English if explicitly requested or no Arabic content exists
      const locale = preferredLocale || "ar";

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
        console.log('=== drawText called ===');
        console.log('text:', text);
        console.log('placeholderConfig:', placeholderConfig);
        console.log('defaultY:', defaultY);
        
        if (!text) {
          console.log('ERROR: text is empty/null, skipping draw');
          return;
        }
        
        if (!placeholderConfig) {
          console.log('ERROR: placeholderConfig is empty/null, skipping draw');
          return;
        }

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

        // Build config
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

        // Calculate X position based on alignment.
        // X represents:
        // - left edge when align=left
        // - center anchor when align=center
        // - right edge when align=right
        let xPosition = config.x;
        if (config.align === "center") {
          xPosition = config.x - textWidth / 2;
        } else if (config.align === "right") {
          xPosition = config.x - textWidth;
        }

        // Ensure text doesn't go off the page
        xPosition = Math.max(10, Math.min(xPosition, width - textWidth - 10));

        // Transform Y coordinate: Web uses top-down (Y from top), PDF uses bottom-up (Y from bottom)
        // In web/CSS: Y is the TOP of the text element (distance from page top)
        // In pdf-lib: Y is the BASELINE of the text (distance from page bottom)
        // Text baseline is approximately 75-80% down from the top of text (ascent ratio)
        // So: pdf_y = height - (web_y + fontSize * 0.75)
        const ascent = config.fontSize * 0.75;
        const pdfY = height - config.y - ascent;

        // Ensure Y is within bounds
        const safePdfY = Math.max(10, Math.min(pdfY, height - 10));

        // Check if we should simulate bold
        const isBold = this.isBoldWeight(config.fontWeight);

        console.log('Final draw position:', {
          xPosition,
          safePdfY,
          textWidth,
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

      // Get text values based on locale
      // FIXED: Properly prioritize Arabic when locale is Arabic
      const getBilingualText = (textData, defaultAr, defaultEn) => {
        // If no data at all, return default based on locale
        if (!textData) {
          return locale === "ar" ? defaultAr : defaultEn;
        }
        
        // If it's a string, just return it (can't determine language)
        if (typeof textData === "string") {
          return textData || (locale === "ar" ? defaultAr : defaultEn);
        }
        
        // If it's a bilingual object
        if (typeof textData === "object") {
          const arText = textData.ar?.trim() || "";
          const enText = textData.en?.trim() || "";
          
          // For Arabic locale: ALWAYS prefer Arabic if available
          if (locale === "ar") {
            if (arText) return arText;
            if (enText) return enText;
            return defaultAr;
          }
          
          // For English locale: prefer English, fallback to Arabic
          if (enText) return enText;
          if (arText) return arText;
          return defaultEn;
        }
        
        return locale === "ar" ? defaultAr : defaultEn;
      };

      // Handle student name (could be string or object with ar/en)
      const studentName = getBilingualText(data.studentName, "الطالب", "Student");

      // Handle course name (could be string or object with ar/en)
      const courseName = getBilingualText(data.courseName, "الدورة", "Course");

      // DEBUG: Log final text values
      console.log('=== FINAL TEXT FOR PDF ===');
      console.log('locale:', locale);
      console.log('studentName:', studentName);
      console.log('courseName:', courseName);
      console.log('raw studentName:', JSON.stringify(data.studentName));
      console.log('raw courseName:', JSON.stringify(data.courseName));
      console.log('==========================');

      // Format date - always use English format to avoid BiDi issues
      const issuedDate = new Date(data.issuedAt || Date.now()).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );

      // Draw certificate elements based on template placeholders
      // Track if we drew any placeholder successfully
      let drewAnyPlaceholder = false;

      // Helper to create placeholder with specific default Y
      const normalizePlaceholderWithDefaultY = (placeholder, defaultY) => {
        const p = placeholder || {};
        return {
          x: p.x !== undefined && p.x !== null ? Number(p.x) : width / 2,
          y: p.y !== undefined && p.y !== null ? Number(p.y) : defaultY,
          fontSize: p.fontSize !== undefined && p.fontSize !== null && Number(p.fontSize) > 0 ? Number(p.fontSize) : 24,
          fontFamily: p.fontFamily && typeof p.fontFamily === 'string' ? p.fontFamily : "Cairo",
          color: p.color && typeof p.color === 'string' ? p.color : "#000000",
          align: p.align && typeof p.align === 'string' ? p.align : "center",
          fontWeight: p.fontWeight && typeof p.fontWeight === 'string' ? p.fontWeight : "normal",
          text: p.text || undefined,
        };
      };

      // Normalize all placeholders before processing with appropriate default Y positions
      // Handle null values for deleted standard elements
      const normalizedPlaceholders = {
        studentName: placeholders.studentName ? normalizePlaceholderWithDefaultY(placeholders.studentName, 300) : null,
        courseName: placeholders.courseName ? normalizePlaceholderWithDefaultY(placeholders.courseName, 400) : null,
        issuedDate: placeholders.issuedDate ? normalizePlaceholderWithDefaultY(placeholders.issuedDate, 500) : null,
        certificateNumber: placeholders.certificateNumber ? normalizePlaceholderWithDefaultY(placeholders.certificateNumber, 600) : null,
        customText: (placeholders.customText || []).map(ct => this.normalizeplaceholder(ct, width, height, true)).filter(Boolean),
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

      // Student Name - only draw if not deleted
      if (normalizedPlaceholders.studentName) {
        console.log('Drawing student name:', studentName, 'at position:', normalizedPlaceholders.studentName);
        await drawText(studentName, normalizedPlaceholders.studentName, 300);
        drewAnyPlaceholder = true;
      }

      // Course Name - only draw if not deleted
      if (normalizedPlaceholders.courseName) {
        console.log('Drawing course name:', courseName, 'at position:', normalizedPlaceholders.courseName);
        await drawText(courseName, normalizedPlaceholders.courseName, 400);
        drewAnyPlaceholder = true;
      }

      // Issue Date - only draw if not deleted
      if (normalizedPlaceholders.issuedDate) {
        console.log('Drawing issued date:', issuedDate, 'at position:', normalizedPlaceholders.issuedDate);
        await drawText(issuedDate, normalizedPlaceholders.issuedDate, 500);
        drewAnyPlaceholder = true;
      }

      // Certificate Number - only draw if not deleted
      if (normalizedPlaceholders.certificateNumber) {
        const certNumber = data.certificateNumber || "CERT-XXXX";
        console.log('Drawing certificate number:', certNumber, 'at position:', normalizedPlaceholders.certificateNumber);
        await drawText(certNumber, normalizedPlaceholders.certificateNumber, 600);
        drewAnyPlaceholder = true;
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

        // Helper to draw centered text with bounds checking
        const drawCenteredText = (text, y, fontSize, color, isArabic = false) => {
          const processedText = isArabic ? this.reshapeArabic(text) : text;
          const textWidth = font.widthOfTextAtSize(processedText, fontSize);
          const x = Math.max(20, Math.min(centerX - textWidth / 2, width - textWidth - 20));
          page.drawText(processedText, { x, y: height - y, size: fontSize, font, color });
        };

        // Helper to draw label-value pair
        const drawLabelValue = (label, value, y, labelX, valueX, fontSize, labelColor, valueColor) => {
          page.drawText(this.reshapeArabic(label), { x: centerX + labelX, y: height - y, size: fontSize, font, color: labelColor });
          page.drawText(this.reshapeArabic(value), { x: centerX + valueX, y: height - y, size: fontSize, font, color: valueColor });
        };

        // Decorative elements
        page.drawRectangle({ x: 50, y: height - 120, width: width - 100, height: 3, color: rgb(0.2, 0.4, 0.2) });

        // Titles
        drawCenteredText("CERTIFICATE OF COMPLETION", 180, 42, rgb(0.1, 0.3, 0.1));
        drawCenteredText("شهادة إتمام", 200, 32, rgb(0.2, 0.4, 0.2), true);

        // Student section
        drawCenteredText("يُمنح هذا الشهادة إلى", 280, 20, rgb(0.3, 0.3, 0.3), true);
        drawCenteredText(studentName, 340, 36, rgb(0, 0, 0), true);
        page.drawRectangle({ x: centerX - 100, y: height - 350, width: 200, height: 2, color: rgb(0.2, 0.4, 0.2) });

        // Course section
        drawCenteredText("لإتمامه المساق", 420, 20, rgb(0.3, 0.3, 0.3), true);
        drawCenteredText(courseName, 480, 28, rgb(0, 0, 0), true);

        // Footer section
        page.drawRectangle({ x: 100, y: height - 650, width: width - 200, height: 1, color: rgb(0.7, 0.7, 0.7) });
        drawLabelValue("تاريخ الإصدار:", issuedDate, 680, -150, 50, 16, rgb(0.2, 0.2, 0.2), rgb(0, 0, 0));
        drawLabelValue("رقم الشهادة:", certificateData.certificateNumber, 720, -150, 50, 14, rgb(0.2, 0.2, 0.2), rgb(0, 0, 0));
        page.drawRectangle({ x: 50, y: height - 750, width: width - 100, height: 2, color: rgb(0.2, 0.4, 0.2) });
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
   * Load image from URL or file path with caching
   */
  async loadImage(imagePath) {
    try {
      // Check if it's a URL (no caching for URLs)
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        const response = await axios.get(imagePath, {
          responseType: "arraybuffer",
          timeout: 30000, // 30 second timeout
        });
        return Buffer.from(response.data);
      }

      // Normalize file path
      let cleanPath = imagePath;
      if (cleanPath.startsWith("/uploads/")) {
        cleanPath = cleanPath.replace("/uploads/", "");
      }
      if (cleanPath.startsWith("uploads/")) {
        cleanPath = cleanPath.replace("uploads/", "");
      }

      const fullPath = path.isAbsolute(cleanPath)
        ? cleanPath
        : path.join(UPLOADS_PATH, cleanPath);

      // Check cache for local files
      if (imageBytesCache.has(fullPath)) {
        return imageBytesCache.get(fullPath);
      }

      const imageBytes = await fs.readFile(fullPath);
      
      // Cache the image (only for frequently used images like backgrounds)
      // Limit cache size to prevent memory issues
      if (imageBytesCache.size < 50) {
        imageBytesCache.set(fullPath, imageBytes);
      }
      
      return imageBytes;
    } catch (error) {
      console.error(`Failed to load image from ${imagePath}:`, error.message);
      throw new Error(`Failed to load image: ${error.message}`);
    }
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    if (!hex) return rgb(0, 0, 0);
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
    const uploadsDir = path.join(UPLOADS_PATH, "certificates");

    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);

    return `/uploads/certificates/${fileName}`;
  }

  /**
   * Clear caches (useful for testing or memory management)
   */
  clearCaches() {
    fontBytesCache.clear();
    imageBytesCache.clear();
    console.log('PDF generation caches cleared');
  }
}

export default new PDFGenerationService();
