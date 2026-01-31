import axios from "axios";
import crypto from "crypto";

/**
 * KashierService - Modern Payment Sessions API v3
 * Official Documentation: https://developers.kashier.io/payment/payment-sessions
 */
class KashierService {
  /**
   * Get the appropriate API base URL based on mode
   */
  getApiBaseUrl(mode) {
    return mode === "live" 
      ? "https://api.kashier.io" 
      : "https://test-api.kashier.io";
  }

  /**
   * Get the payment page URL based on mode
   */
  getPaymentPageUrl(mode) {
    return "https://payments.kashier.io";
  }

  /**
   * Create a payment session using Kashier Payment Sessions API v3
   * @returns {Promise<{sessionId: string, sessionUrl: string, status: string}>}
   */
  async createPaymentSession({
    orderId,
    amount,
    currency,
    customer,
    config,
    merchantRedirect,
    serverWebhook,
    description = "Payment",
  }) {
    const { mode, credentials } = config;
    const { mid, paymentApiKey, secretKey } = credentials;

    if (!mid || !paymentApiKey || !secretKey) {
      throw new Error("Kashier credentials (mid, paymentApiKey, secretKey) are required");
    }

    const apiBaseUrl = this.getApiBaseUrl(mode);
    const paymentPageUrl = this.getPaymentPageUrl(mode);

    // Prepare the payment session payload
    const sessionPayload = {
      merchantId: mid,
      order: orderId,
      amount: amount.toString(),
      currency: currency || "EGP",
      paymentType: "credit",
      type: "one-time",
      allowedMethods: "card,wallet",
      display: "en",
      merchantRedirect: merchantRedirect,
      serverWebhook: serverWebhook,
      description: description,
      customer: {
        email: customer.email,
        reference: customer.reference || orderId,
      },
      enable3DS: true,
      interactionSource: "ECOMMERCE",
      maxFailureAttempts: 3,
      saveCard: "optional",
      retrieveSavedCard: false,
      failureRedirect: true,
      manualCapture: false,
      metaData: {
        orderId: orderId,
        customerName: customer.name,
      },
    };

    try {
      console.log("🔄 Creating Kashier payment session...", {
        mode,
        merchantId: mid,
        orderId,
        amount,
        currency,
      });

      const response = await axios.post(
        `${apiBaseUrl}/v3/payment/sessions`,
        sessionPayload,
        {
          headers: {
            "Authorization": secretKey,
            "api-key": paymentApiKey,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds
        }
      );

      const sessionData = response.data;

      console.log("✅ Kashier payment session created:", {
        sessionId: sessionData._id,
        status: sessionData.status,
      });

      return {
        sessionId: sessionData._id,
        sessionUrl: sessionData.sessionUrl,
        status: sessionData.status,
        merchantOrderId: orderId,
        rawResponse: sessionData,
      };
    } catch (error) {
      console.error("❌ Kashier payment session creation failed:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error("Kashier authentication failed. Check your API credentials.");
      } else if (error.response?.status === 400) {
        throw new Error(
          `Kashier validation error: ${JSON.stringify(error.response.data)}`
        );
      }

      throw new Error(
        `Failed to create Kashier payment session: ${error.message}`
      );
    }
  }

  /**
   * Get payment session details
   */
  async getPaymentSession({ sessionId, config }) {
    const { mode, credentials } = config;
    const { secretKey } = credentials;

    const apiBaseUrl = this.getApiBaseUrl(mode);

    try {
      const response = await axios.get(
        `${apiBaseUrl}/v3/payment/sessions/${sessionId}/payment`,
        {
          headers: {
            Authorization: secretKey,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("❌ Failed to get Kashier payment session:", error.message);
      throw new Error(`Failed to get payment session: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature from Kashier
   * Kashier sends webhooks with payment status updates
   */
  verifyWebhookSignature({ payload, signature, secretKey }) {
    // Kashier webhook verification logic
    // The exact implementation depends on Kashier's webhook signing method
    // Typically: HMAC-SHA256(payload, secretKey)
    
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const calculatedSignature = crypto
        .createHmac("sha256", secretKey)
        .update(payloadString)
        .digest("hex");

      return calculatedSignature === signature;
    } catch (error) {
      console.error("❌ Webhook signature verification failed:", error.message);
      return false;
    }
  }

  /**
   * Parse webhook payload from Kashier
   */
  parseWebhookPayload(body) {
    try {
      // Kashier webhook payload structure
      const {
        sessionId,
        merchantOrderId,
        status,
        amount,
        currency,
        method,
        orderId,
        transactionId,
        customer,
        metaData,
        createdAt,
        updatedAt,
      } = body;

      return {
        sessionId,
        merchantOrderId: merchantOrderId || metaData?.orderId,
        status, // PENDING, COMPLETED, FAILED, EXPIRED
        amount,
        currency,
        paymentMethod: method,
        transactionId: orderId || transactionId,
        customerEmail: customer?.email,
        metaData,
        createdAt,
        updatedAt,
        rawPayload: body,
      };
    } catch (error) {
      console.error("❌ Failed to parse webhook payload:", error.message);
      throw new Error("Invalid webhook payload");
    }
  }

  /**
   * Map Kashier status to internal payment status
   */
  mapPaymentStatus(kashierStatus) {
    const statusMap = {
      CREATED: "pending",
      PENDING: "pending",
      OPENED: "pending",
      COMPLETED: "success",
      SUCCESS: "success",
      FAILED: "failed",
      EXPIRED: "failed",
      CANCELLED: "cancelled",
    };

    return statusMap[kashierStatus?.toUpperCase()] || "pending";
  }
}

export const kashierService = new KashierService();
