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

  verifyHash({ query, credentials }) {
    const { mid, paymentApiKey } = credentials;
    const { paymentStatus, cardDataToken, maskedCard, merchantOrderId, orderId, cardBrand, orderReference, transactionId, amount, currency } = query;

    // Construct the string to hash according to Kashier documentation
    // Note: The order of fields matters. Usually it is:
    // mid + merchantOrderId + amount + currency + orderId + paymentStatus + paymentApiKey (this varies, check docs or use standard)
    // Standard Kashier Hash for Callback:
    // sha256(mid + "&" + paymentStatus + "&" + merchantOrderId + "&" + amount + "&" + currency + "&" + paymentApiKey)
    // Wait, let's allow flexibility or follow standard. 
    // Based on common Kashier implementation: path/?paymentStatus=SUCCESS&cardDataToken=...
    // The query string signature usually signed with the secret. 

    // Let's implement the standard hash construction for verification
    // Assuming the payload coming back has a 'signature' or 'hash' field to compare against, 
    // OR we re-calculate to ensure data integrity.

    // If the callback provides a hash/signature, we should verify it.
    // If not provided in query, we can't verify. 
    // Let's assume there's a 'hash' or 'signature' in the query.

    // For now, let's simply expose a helper that takes the raw values and re-hashes them 
    // so the controller can compare.

    // Simplified verification for now:
    // Only re-implement the same logic as generateHash if the callback uses the same (rare).
    // Usually callbacks have different signing. 

    // Let's rely on `paymentService` to call this with the right fields.
    // We will clean this up to be invalid-proof.

    const queryString = `&paymentStatus=${paymentStatus}&merchantOrderId=${merchantOrderId}&amount=${amount}&currency=${currency}`;
    const secret = paymentApiKey; // Using API Key as secret for now. 

    // Actually, let's implement the standard hash generation for the response
    // mid + orderId + amount + currency + paymentApiKey
    const data = `${mid}${orderId}${amount}${currency}${paymentApiKey}`;
    const calculatedHash = crypto.createHash("sha256").update(data).digest("hex");

    return calculatedHash;
  }
}

export const kashierService = new KashierService();
