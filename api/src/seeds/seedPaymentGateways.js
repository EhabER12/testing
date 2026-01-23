import mongoose from "mongoose";
import PaymentMethod from "../models/paymentMethodSchema.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the api root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedPaymentGateways = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Check if PayPal already exists
        let paypal = await PaymentMethod.findOne({ provider: "paypal" });

        if (!paypal) {
            console.log("📝 Creating PayPal payment method...");
            paypal = await PaymentMethod.create({
                provider: "paypal",
                displayName: {
                    ar: "باي بال",
                    en: "PayPal",
                },
                description: {
                    ar: "الدفع عبر باي بال",
                    en: "Pay with PayPal",
                },
                credentials: {
                    clientId: "",
                    clientSecret: "",
                    webhookId: "",
                },
                mode: "sandbox",
                config: {
                    returnUrl: "",
                    cancelUrl: "",
                },
                isActive: false,
                order: 1,
            });
            console.log("✅ PayPal payment method created");
        } else {
            console.log("ℹ️ PayPal payment method already exists");
        }

        // Check if Cashier already exists
        let cashier = await PaymentMethod.findOne({ provider: "cashier" });

        if (!cashier) {
            console.log("📝 Creating Cashier payment method...");
            cashier = await PaymentMethod.create({
                provider: "cashier",
                displayName: {
                    ar: "كاشير",
                    en: "Cashier",
                },
                description: {
                    ar: "الدفع عبر كاشير",
                    en: "Pay with Cashier (Kashier)",
                },
                credentials: {
                    mid: "",
                    paymentApiKey: "",
                    secretKey: "",
                },
                mode: "sandbox",
                config: {
                    checkoutUrl: "",
                    callbackUrl: "",
                    redirectUrl: "",
                },
                isActive: false,
                order: 2,
            });
            console.log("✅ Cashier payment method created");
        } else {
            console.log("ℹ️ Cashier payment method already exists");
        }

        console.log("✅ Payment gateways seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding payment gateways:", error);
        process.exit(1);
    }
};

seedPaymentGateways();
