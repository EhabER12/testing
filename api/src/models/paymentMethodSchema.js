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
            type: mongoose.Schema.Types.Mixed,
            default: {},
            // Flexible structure to accommodate different payment providers:
            // PayPal: { clientId, clientSecret, webhookId }
            // Kashier: { mid, paymentApiKey, secretKey }
            // Stripe: { publishableKey, secretKey }
        },
        mode: {
            type: String,
            enum: ["sandbox", "live", "test"],
            default: "sandbox",
        },
        config: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
            // Flexible structure for different providers:
            // PayPal: { returnUrl, cancelUrl }
            // Kashier: { webhookUrl, redirectUrl }
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
