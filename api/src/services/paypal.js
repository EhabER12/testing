import axios from "axios";

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
 * Create PayPal order
 */
export async function createOrder({ amount, currency = "USD", config }) {
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

  try {
    const response = await axios.post(
      `${paypalApiUrl}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString(),
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

