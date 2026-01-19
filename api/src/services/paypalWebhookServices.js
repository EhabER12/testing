import axios from "axios";
import paymentMethodSchema from "../models/paymentMethodSchema.js";

/**
 * Verify PayPal Webhook Signature
 */
export const verifyPaypalWebhook = async (req) => {
  try {
    // 1️⃣ هات إعدادات PayPal من DB
    const paypalMethod = await paymentMethodSchema.findOne({
      provider: "paypal",
      isActive: true,
    });

    if (!paypalMethod) {
      console.log("❌ PayPal not configured");
      return false;
    }

    const { webhookId } = paypalMethod.credentials;

    if (!webhookId) {
      console.log("❌ PayPal webhookId missing");
      return false;
    }

    // 2️⃣ حدد البيئة
    const paypalApiUrl =
      paypalMethod.mode === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

    // 3️⃣ Access Token
    const authResponse = await axios.post(
      `${paypalApiUrl}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: {
          username: paypalMethod.credentials.clientId,
          password: paypalMethod.credentials.clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = authResponse.data.access_token;

    // 4️⃣ Verify Webhook Signature
    const response = await axios.post(
      `${paypalApiUrl}/v1/notifications/verify-webhook-signature`,
      {
        auth_algo: req.headers["paypal-auth-algo"],
        cert_url: req.headers["paypal-cert-url"],
        transmission_id: req.headers["paypal-transmission-id"],
        transmission_sig: req.headers["paypal-transmission-sig"],
        transmission_time: req.headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: JSON.parse(req.body.toString()),
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.verification_status === "SUCCESS";
  } catch (error) {
    console.error("❌ PayPal Webhook Verification Error:", error.response?.data || error.message);
    return false;
  }
};
