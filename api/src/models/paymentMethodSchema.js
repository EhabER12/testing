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

            // Cashier (Kashier)
            mid: String, // Merchant ID
            paymentApiKey: String,
            secretKey: String,

            // Stripe (future)
            publishableKey: String,
            secretKey: String,
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

            // Cashier
            checkoutUrl: String,
            callbackUrl: String,
            redirectUrl: String,
            paymentMethod: String, // card, fawry, etc.
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
