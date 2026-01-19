import mongoose from "mongoose";
import Settings from "../models/settingsModel.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the api root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedPaymentMethods = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find settings or create if not exists
    let settings = await Settings.findOne();

    if (!settings) {
      console.log("⚙️ Settings not found, creating default...");
      try {
        // Try creating with empty object, schema defaults will fill in
        settings = await Settings.create({
          siteName: "Genoun LLC",
          siteDescription: "We Build Your Future",
          contactEmail: "info@genoun.com",
          contactPhone: "+1234567890",
          address: "123 Street, Riyadh, Saudi Arabia",
        });
      } catch (err) {
        // If generic create fails, try with minimal required fields based on schema
        settings = await Settings.create({
          siteName: "Genoun LLC",
          siteDescription: "We Build Your Future",
          contactEmail: "info@genoun.com",
          contactPhone: "+1234567890",
          address: "123 Street",
        });
      }
    }

    console.log("📝 Updating payment methods...");

    const methods = [
      {
        title: {
          en: "InstaPay",
          ar: "إنستا باي",
        },
        description: {
          en: "Instant payment via InstaPay app (Egypt)",
          ar: "دفع فوري عبر تطبيق إنستا باي (مصر)",
        },
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/2/22/InstaPay_Logo.png",
        isEnabled: true,
        requiresAttachment: true,
        instructions: {
          en: "Transfer to: hazem.aamer@instapay",
          ar: "التحويل إلى: hazem.aamer@instapay",
        },
        order: 1,
      },
      {
        title: {
          en: "Vodafone Cash",
          ar: "فودافون كاش",
        },
        description: {
          en: "Mobile wallet payment via Vodafone Cash",
          ar: "دفع عبر محفظة فودافون كاش",
        },
        imageUrl:
          "https://www.clipartmax.com/png/middle/151-1517832_pay-with-vodafone-cash-vodafone-mobile-money-logo.png",
        isEnabled: true,
        requiresAttachment: true,
        instructions: {
          en: "Transfer to Wallet: 010xxxxxxxx",
          ar: "التحويل إلى المحفظة: 010xxxxxxxx",
        },
        order: 2,
      },
      {
        title: {
          en: "Bank Transfer",
          ar: "تحويل بنكي",
        },
        description: {
          en: "Direct bank transfer to Clear Bank",
          ar: "تحويل بنكي مباشر إلى Clear Bank",
        },
        imageUrl:
          "https://logowik.com/content/uploads/images/clearbank-new-20228028.jpg",
        isEnabled: true,
        requiresAttachment: true,
        instructions: {
          en: "Bank Name: Clear Bank\nAccount Name: HAZEM AMER\nIBAN: GB66CLRB04281236949560\nSWIFT: CLRBGB22XXX",
          ar: "اسم البنك: Clear Bank\nاسم الحساب: HAZEM AMER\nIBAN: GB66CLRB04281236949560\nSWIFT: CLRBGB22XXX",
        },
        order: 3,
      },
    ];

    // Initialize paymentGateways if null
    if (!settings.paymentGateways) {
      settings.paymentGateways = { manualMethods: [] };
    }

    settings.paymentGateways.manualMethods = methods;

    await settings.save();
    console.log("✅ Payment methods seeded successfully!");

    const count = settings.paymentGateways.manualMethods.length;
    console.log(`📊 Total methods: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding payment methods:", error);
    process.exit(1);
  }
};

seedPaymentMethods();
