import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            enum: ["paypal", "cashier", "stripe"],
            required: true,
            unique: true,
        },
        displayName: {
            ar: { type: String, required: true },
            en: { type: String, required: true },
        },
        description: {
            ar: String,
            en: String,
        },
        credentials: {
            // PayPal
            clientId: String,
            clientSecret: String,
            webhookId: String,

            // Kashier (Payment Sessions API v3)
            mid: String, // Merchant ID
            paymentApiKey: String, // API Key for authentication
            secretKey: String, // Secret Key for webhook verification

            // Stripe (future)
            publishableKey: String,
        },
        mode: {
            type: String,
            enum: ["sandbox", "live", "test"],
            default: "sandbox",
        },
        config: {
            // PayPal
            returnUrl: String,
            cancelUrl: String,

            // Kashier - Removed deprecated fields
            // Note: Payment Sessions API v3 doesn't need these URLs
            // Webhooks are configured via serverWebhook parameter in API call
            // Redirects are configured via merchantRedirect parameter
            webhookUrl: String, // Optional: For reference only
            redirectUrl: String, // Optional: For reference only
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        order: {
            type: Number,
            default: 0,
        },
        logo: String,
    },
    {
        timestamps: true,
    }
);

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;
