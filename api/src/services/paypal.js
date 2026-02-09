import axios from "axios";
import crypto from "crypto";

/**
 * تحديد PayPal API URL بناءً على mode
 */
const getPaypalApiUrl = (mode) => {
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
};

/**
 * Get access token using DB config
 */
export async function getAccessToken(config) {
  const { clientId, clientSecret } = config.credentials;
  const mode = config.mode;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  const paypalApiUrl = getPaypalApiUrl(mode);

  try {
    const response = await axios({
      url: `${paypalApiUrl}/v1/oauth2/token`,
      method: "post",
      auth: {
        username: clientId,
        password: clientSecret,
      },
      data: "grant_type=client_credentials",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10000,
    });

    return response.data.access_token;
  } catch (error) {
    console.error("❌ PayPal getAccessToken error:", error.response?.data);
    throw new Error("Failed to get PayPal access token");
  }
}


/**
 * Convert any currency to USD for PayPal
 * Uses admin-configured exchange rates for direct conversion
 * @param {number} amount - Amount in original currency
 * @param {string} currency - Original currency (EGP, SAR, USD)
 * @param {object} exchangeRates - Exchange rates from settings (how many units = 1 USD)
 * @returns {object} - { amount: number, currency: string, originalAmount: number, originalCurrency: string }
 */
function convertToPayPalCurrency(amount, currency, exchangeRates = {}) {
  // If already USD, no conversion needed
  if (currency === "USD") {
    return { 
      amount, 
      currency: "USD", 
      originalAmount: amount, 
      originalCurrency: currency 
    };
  }

  // Convert EGP to USD directly
  if (currency === "EGP") {
    const egpRate = exchangeRates.EGP || 50.0; // Default: 50 EGP = 1 USD
    const convertedAmount = (amount / egpRate).toFixed(2);
    
    console.log(`💱 Currency Conversion: ${amount} ${currency} → ${convertedAmount} USD (rate: ${egpRate} EGP = 1 USD)`);
    
    return {
      amount: parseFloat(convertedAmount),
      currency: "USD",
      originalAmount: amount,
      originalCurrency: currency
    };
  }

  // Convert SAR to USD directly
  if (currency === "SAR") {
    const sarRate = exchangeRates.SAR || 3.75; // Default: 3.75 SAR = 1 USD
    const convertedAmount = (amount / sarRate).toFixed(2);
    
    console.log(`💱 Currency Conversion: ${amount} ${currency} → ${convertedAmount} USD (rate: ${sarRate} SAR = 1 USD)`);
    
    return {
      amount: parseFloat(convertedAmount),
      currency: "USD",
      originalAmount: amount,
      originalCurrency: currency
    };
  }

  // Fallback: try to find a rate for this currency, otherwise return as-is
  if (exchangeRates[currency]) {
    const rate = exchangeRates[currency];
    const convertedAmount = (amount / rate).toFixed(2);
    console.log(`💱 Currency Conversion: ${amount} ${currency} → ${convertedAmount} USD (rate: ${rate} ${currency} = 1 USD)`);
    return {
      amount: parseFloat(convertedAmount),
      currency: "USD",
      originalAmount: amount,
      originalCurrency: currency
    };
  }

  console.warn(`⚠️ Unknown currency ${currency} with no exchange rate, returning as-is`);
  return {
    amount,
    currency,
    originalAmount: amount,
    originalCurrency: currency
  };
}

/**
 * Create PayPal order
 */
export async function createOrder({ amount, currency = "USD", config, exchangeRates }) {
  console.log("🧪 Creating PayPal order...", config);

  console.log("🧪 PayPal config debug:", {
    mode: config.mode,
    returnUrl: config.config?.returnUrl,
    cancelUrl: config.config?.cancelUrl,
    hasClientId: !!config.credentials?.clientId,
    hasClientSecret: !!config.credentials?.clientSecret,
  });

  const paypalApiUrl = getPaypalApiUrl(config.mode);
  console.log("🧪 PayPal API URL:", paypalApiUrl);

  const accessToken = await getAccessToken(config);

  // Convert currency if needed (EGP → SAR)
  const converted = convertToPayPalCurrency(amount, currency, exchangeRates);
  const paypalAmount = converted.amount;
  const paypalCurrency = converted.currency;

  console.log(`💰 PayPal Order Amount: ${paypalAmount} ${paypalCurrency} (Original: ${amount} ${currency})`);

  try {
    const response = await axios.post(
      `${paypalApiUrl}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: paypalCurrency,
              value: paypalAmount.toString(),
            },
          },
        ],
        application_context: {
          return_url: config.config.returnUrl,
          cancel_url: config.config.cancelUrl,
          brand_name: "Praplo",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ PayPal createOrder error:", error.response?.data);
    throw new Error("Failed to create PayPal order");
  }
}


/**
 * Capture PayPal order
 */
export async function captureOrder({ orderId, config }) {
  const paypalApiUrl = getPaypalApiUrl(config.mode);
  const accessToken = await getAccessToken(config);

  try {
    const response = await axios.post(
      `${paypalApiUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ PayPal captureOrder error:", error.response?.data);
    throw new Error("Failed to capture PayPal order");
  }
}

/**
 * Verify PayPal webhook signature
 * @see https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
 */
export async function verifyWebhookSignature({ headers, body, config }) {
  const paypalApiUrl = getPaypalApiUrl(config.mode);
  const accessToken = await getAccessToken(config);
  
  const webhookId = config.credentials?.webhookId;
  
  if (!webhookId) {
    console.warn("⚠️ PayPal webhook ID not configured - skipping verification");
    return { verification_status: "SUCCESS" }; // Allow if not configured (dev mode)
  }

  try {
    const verificationPayload = {
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: body,
    };

    const response = await axios.post(
      `${paypalApiUrl}/v1/notifications/verify-webhook-signature`,
      verificationPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log("🔐 PayPal webhook verification result:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ PayPal webhook verification error:", error.response?.data || error.message);
    throw new Error("Failed to verify PayPal webhook signature");
  }
}

/**
 * Get order details from PayPal
 */
export async function getOrderDetails({ orderId, config }) {
  const paypalApiUrl = getPaypalApiUrl(config.mode);
  const accessToken = await getAccessToken(config);

  try {
    const response = await axios.get(
      `${paypalApiUrl}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ PayPal getOrderDetails error:", error.response?.data);
    throw new Error("Failed to get PayPal order details");
  }
}

