/**
 * Script to check if a Kashier payment method already exists and optionally delete it
 * Run this before creating a new Kashier payment method if you get a 400 error
 */

import mongoose from "mongoose";
import PaymentMethod from "./src/models/paymentMethodSchema.js";
import dotenv from "dotenv";

dotenv.config();

async function checkAndDeleteKashier() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Check if Kashier exists
        const existing = await PaymentMethod.findOne({ provider: "cashier" });

        if (!existing) {
            console.log("ℹ️  No Kashier payment method found in database");
            process.exit(0);
        }

        console.log("\n🔍 Found existing Kashier payment method:");
        console.log("   ID:", existing._id);
        console.log("   Provider:", existing.provider);
        console.log("   Display Name (AR):", existing.displayName?.ar);
        console.log("   Display Name (EN):", existing.displayName?.en);
        console.log("   Mode:", existing.mode);
        console.log("   Active:", existing.isActive);
        console.log("   Created:", existing.createdAt);
        console.log("   Updated:", existing.updatedAt);

        // Check if --delete flag is passed
        if (process.argv.includes("--delete")) {
            await PaymentMethod.deleteOne({ provider: "cashier" });
            console.log("\n✅ Kashier payment method deleted successfully!");
            console.log("   You can now create a new one from the dashboard");
        } else {
            console.log("\n⚠️  To delete this Kashier payment method, run:");
            console.log("   node checkKashier.js --delete");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

checkAndDeleteKashier();
