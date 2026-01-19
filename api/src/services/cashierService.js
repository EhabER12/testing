import crypto from "crypto";

class KashierService {
  generateHash({ orderId, amount, currency, credentials }) {
    const { mid, paymentApiKey } = credentials;

    const data = `${mid}${orderId}${amount}${currency}${paymentApiKey}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  generateCheckoutUrl({ orderId, amount, currency, customer, config }) {
    const {
      mode,
      credentials,
      config: providerConfig,
    } = config;

    const hash = this.generateHash({
      orderId,
      amount,
      currency,
      credentials,
    });

    const params = new URLSearchParams({
      merchantId: credentials.mid,
      orderId,
      amount: amount.toString(),
      currency,
      hash,
      mode,
      paymentMethod: providerConfig.paymentMethod,
      customerName: customer.name,
      customerEmail: customer.email,
      redirectUrl: providerConfig.redirectUrl,
      callbackUrl: providerConfig.callbackUrl,
    });

    return `${providerConfig.checkoutUrl}/payment?${params.toString()}`;
  }
}

export const kashierService = new KashierService();
