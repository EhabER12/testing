import axios from "axios";

/**
 * Resolve PayPal API host by mode.
 */
const getPaypalApiUrl = (mode) =>
  mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const normalizeMode = (mode) => (mode === "live" ? "live" : "sandbox");
const getAlternateMode = (mode) => (mode === "live" ? "sandbox" : "live");

const extractPaypalErrorDetails = (error) =>
  error?.response?.data?.error_description ||
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Unknown error";

const isClientAuthError = (details) =>
  /invalid_client|client authentication failed|authentication failed|unauthorized client/i.test(
    String(details || "")
  );

async function requestAccessTokenForMode({ clientId, clientSecret, mode }) {
  const paypalApiUrl = getPaypalApiUrl(mode);

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
}

/**
 * Get access token from configured credentials.
 * If mode is misconfigured, tries the opposite mode once.
 */
export async function getAccessToken(config) {
  const clientId = String(config?.credentials?.clientId || "").trim();
  const clientSecret = String(config?.credentials?.clientSecret || "").trim();
  const preferredMode = normalizeMode(config?.mode);

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  const modesToTry = [preferredMode, getAlternateMode(preferredMode)];
  let lastDetails = "";

  for (let index = 0; index < modesToTry.length; index++) {
    const mode = modesToTry[index];

    try {
      const accessToken = await requestAccessTokenForMode({
        clientId,
        clientSecret,
        mode,
      });

      if (mode !== preferredMode) {
        console.warn(
          `PayPal mode mismatch detected. Configured: ${preferredMode}, working: ${mode}`
        );
      }

      return { accessToken, mode };
    } catch (error) {
      const details = extractPaypalErrorDetails(error);
      lastDetails = details;
      console.error(`PayPal getAccessToken error [${mode}]:`, error?.response?.data || details);

      const canRetryAlternate = index === 0 && isClientAuthError(details);
      if (!canRetryAlternate) {
        throw new Error(`Failed to get PayPal access token: ${details}`);
      }
    }
  }

  throw new Error(`Failed to get PayPal access token: ${lastDetails}`);
}

/**
 * Convert any currency to USD for PayPal.
 * Uses admin-configured exchange rates for direct conversion.
 */
function convertToPayPalCurrency(amount, currency, exchangeRates = {}) {
  if (currency === "USD") {
    return {
      amount,
      currency: "USD",
      originalAmount: amount,
      originalCurrency: currency,
    };
  }

  if (currency === "EGP") {
    const egpRate = exchangeRates.EGP || 50.0;
    const convertedAmount = (amount / egpRate).toFixed(2);

    console.log(
      `Currency Conversion: ${amount} ${currency} -> ${convertedAmount} USD (rate: ${egpRate} EGP = 1 USD)`
    );

    return {
      amount: parseFloat(convertedAmount),
      currency: "USD",
      originalAmount: amount,
      originalCurrency: currency,
    };
  }

  if (currency === "SAR") {
    const sarRate = exchangeRates.SAR || 3.75;
    const convertedAmount = (amount / sarRate).toFixed(2);

    console.log(
      `Currency Conversion: ${amount} ${currency} -> ${convertedAmount} USD (rate: ${sarRate} SAR = 1 USD)`
    );

    return {
      amount: parseFloat(convertedAmount),
      currency: "USD",
      originalAmount: amount,
      originalCurrency: currency,
    };
  }

  if (exchangeRates[currency]) {
    const rate = exchangeRates[currency];
    const convertedAmount = (amount / rate).toFixed(2);
    console.log(
      `Currency Conversion: ${amount} ${currency} -> ${convertedAmount} USD (rate: ${rate} ${currency} = 1 USD)`
    );

    return {
      amount: parseFloat(convertedAmount),
      currency: "USD",
      originalAmount: amount,
      originalCurrency: currency,
    };
  }

  console.warn(
    `Unknown currency ${currency} with no exchange rate, returning as-is`
  );

  return {
    amount,
    currency,
    originalAmount: amount,
    originalCurrency: currency,
  };
}

/**
 * Create PayPal order.
 */
export async function createOrder({ amount, currency = "USD", config, exchangeRates }) {
  console.log("Creating PayPal order...");
  console.log("PayPal config debug:", {
    mode: config.mode,
    returnUrl: config.config?.returnUrl,
    cancelUrl: config.config?.cancelUrl,
    hasClientId: !!config.credentials?.clientId,
    hasClientSecret: !!config.credentials?.clientSecret,
  });

  const { accessToken, mode } = await getAccessToken(config);
  const paypalApiUrl = getPaypalApiUrl(mode);

  const returnUrl = config?.config?.returnUrl;
  const cancelUrl = config?.config?.cancelUrl;

  if (!returnUrl || !cancelUrl) {
    throw new Error("PayPal return/cancel URLs are not configured");
  }

  const converted = convertToPayPalCurrency(amount, currency, exchangeRates);
  const paypalAmount = converted.amount;
  const paypalCurrency = converted.currency;

  console.log(
    `PayPal Order Amount: ${paypalAmount} ${paypalCurrency} (Original: ${amount} ${currency})`
  );

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
          return_url: returnUrl,
          cancel_url: cancelUrl,
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
    console.error("PayPal createOrder error:", error.response?.data);
    const paypalError =
      error?.response?.data?.details?.[0]?.description ||
      error?.response?.data?.message ||
      error?.message ||
      "Unknown PayPal error";
    throw new Error(`Failed to create PayPal order: ${paypalError}`);
  }
}

/**
 * Capture PayPal order.
 */
export async function captureOrder({ orderId, config }) {
  const { accessToken, mode } = await getAccessToken(config);
  const paypalApiUrl = getPaypalApiUrl(mode);

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
    console.error("PayPal captureOrder error:", error.response?.data);
    throw new Error("Failed to capture PayPal order");
  }
}

/**
 * Verify PayPal webhook signature.
 */
export async function verifyWebhookSignature({ headers, body, config }) {
  const { accessToken, mode } = await getAccessToken(config);
  const paypalApiUrl = getPaypalApiUrl(mode);

  const webhookId = config.credentials?.webhookId;

  if (!webhookId) {
    console.warn("PayPal webhook ID not configured - skipping verification");
    return { verification_status: "SUCCESS" };
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

    console.log("PayPal webhook verification result:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "PayPal webhook verification error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to verify PayPal webhook signature");
  }
}

/**
 * Get order details from PayPal.
 */
export async function getOrderDetails({ orderId, config }) {
  const { accessToken, mode } = await getAccessToken(config);
  const paypalApiUrl = getPaypalApiUrl(mode);

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
    console.error("PayPal getOrderDetails error:", error.response?.data);
    throw new Error("Failed to get PayPal order details");
  }
}
