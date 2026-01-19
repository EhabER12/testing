import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export class WhatsappNotificationService {
  constructor() {
    this.apiKey = process.env.WA_AUTHENTICATION_API_KEY;
    // WA_NUM_TOKEN is the instance ID
    this.instance = process.env.WA_NUM_TOKEN;
    this.serverUrl = process.env.WA_SERVER_URL || "https://wa.genoun.com";
  }

  /**
   * Check if WhatsApp service is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.instance);
  }

  /**
   * Format phone number for WhatsApp
   * Ensures number starts with country code and has no special characters
   */
  formatPhoneNumber(number) {
    // Remove all non-digit characters
    let cleaned = number.replace(/\D/g, "");

    // Ensure it starts with country code
    // If it starts with 0, assume it's a local number and needs country code
    if (cleaned.startsWith("0")) {
      // Default to Saudi Arabia if no country code
      cleaned = "966" + cleaned.substring(1);
    }

    // Evolution API format: just the number with country code
    // Some versions may need @s.whatsapp.net suffix, try without first
    return cleaned;
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendTextMessage(number, text) {
    if (!this.isConfigured()) {
      console.warn("WhatsApp service not configured");
      return { success: false, error: "WhatsApp not configured" };
    }

    const formattedNumber = this.formatPhoneNumber(number);

    const options = {
      method: "POST",
      url: `${this.serverUrl}/message/sendText/${this.instance}`,
      headers: {
        apikey: this.apiKey,
        "Content-Type": "application/json",
      },
      data: {
        number: formattedNumber,
        text: text,
        // Options to make messages more natural
        delay: 1500, // 1.5 second delay before sending
        linkPreview: true, // Enable URL previews in messages
      },
    };

    try {
      const response = await axios(options);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "WhatsApp send error:",
        error.response?.data || error.message
      );
      console.error("Request body was:", JSON.stringify(options.data, null, 2));
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Alias for sendTextMessage
   */
  async sendMessage(number, text) {
    return this.sendTextMessage(number, text);
  }

  /**
   * Send a media message via WhatsApp (image with caption)
   */
  async sendMediaMessage(number, mediaUrl, caption = "") {
    if (!this.isConfigured()) {
      console.warn("WhatsApp service not configured");
      return { success: false, error: "WhatsApp not configured" };
    }

    const formattedNumber = this.formatPhoneNumber(number);

    const options = {
      method: "POST",
      url: `${this.serverUrl}/message/sendMedia/${this.instance}`,
      headers: {
        apikey: this.apiKey,
        "Content-Type": "application/json",
      },
      data: {
        number: formattedNumber,
        mediaMessage: {
          mediatype: "image",
          media: mediaUrl,
          caption: caption,
        },
      },
    };

    try {
      const response = await axios(options);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(
        "WhatsApp media send error:",
        error.response?.data || error.message
      );
      // Fall back to text message if media fails
      return this.sendTextMessage(number, caption);
    }
  }

  /**
   * Send article completion notification
   */
  async sendArticleCompletionNotification(numbers, articlesSummary) {
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return { success: false, error: "No phone numbers provided" };
    }

    const { generated, failed, total, articles } = articlesSummary;

    // Build Arabic/English message
    const message = this.buildNotificationMessage(
      generated,
      failed,
      total,
      articles
    );

    const results = [];

    for (const number of numbers) {
      try {
        const result = await this.sendTextMessage(number, message);
        results.push({
          number,
          ...result,
        });

        // Small delay between messages to avoid rate limiting
        await this.delay(500);
      } catch (error) {
        results.push({
          number,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: results.some((r) => r.success),
      results,
    };
  }

  /**
   * Build notification message
   */
  buildNotificationMessage(generated, failed, total, articles = []) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let message = `🤖 *تقرير توليد المقالات اليومي*\n`;
    message += `📅 ${dateStr}\n\n`;

    message += `✅ المقالات المُولّدة: ${generated}\n`;
    if (failed > 0) {
      message += `❌ المقالات الفاشلة: ${failed}\n`;
    }
    message += `📊 المجموع المستهدف: ${total}\n\n`;

    if (articles.length > 0) {
      message += `📝 *المقالات الجديدة:*\n`;
      articles.forEach((article, index) => {
        message += `${index + 1}. ${article.title}\n`;
      });
      message += `\n`;
    }

    message += `---\n`;
    message += `_تم الإرسال تلقائياً من نظام Genoun_`;

    return message;
  }

  /**
   * Send simple notification
   */
  async sendNotification(numbers, message) {
    if (!Array.isArray(numbers)) {
      numbers = [numbers];
    }

    const results = [];

    for (const number of numbers) {
      const result = await this.sendTextMessage(number, message);
      results.push({ number, ...result });
    }

    return results;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(testNumber) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "WhatsApp API credentials not configured",
      };
    }

    const testMessage =
      "🧪 اختبار اتصال - Test connection from Genoun AI Articles System";

    return await this.sendTextMessage(testNumber, testMessage);
  }
}
