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

        // Check if Kashier already exists
        let kashier = await PaymentMethod.findOne({ provider: "cashier" });

        if (!kashier) {
            console.log("📝 Creating Kashier payment method...");
            kashier = await PaymentMethod.create({
                provider: "cashier",
                displayName: {
                    ar: "كاشير",
                    en: "Kashier",
                },
                description: {
                    ar: "الدفع عبر كاشير - بطاقات ائتمانية ومحافظ إلكترونية",
                    en: "Pay with Kashier - Cards & Wallets",
                },
                credentials: {
                    mid: "", // Merchant ID from Kashier Dashboard
                    paymentApiKey: "", // API Key for authentication
                    secretKey: "", // Secret Key for webhook verification
                },
                mode: "sandbox",
                config: {
                    webhookUrl: "", // Optional: For reference
                    redirectUrl: "", // Optional: Custom redirect URL
                },
                isActive: false,
                order: 2,
            });
            console.log("✅ Kashier payment method created");
        } else {
            console.log("ℹ️ Kashier payment method already exists");
        }

        console.log("✅ Payment gateways seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding payment gateways:", error);
        process.exit(1);
    }
};

seedPaymentGateways();
