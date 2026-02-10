/**
 * Simple script to check and delete Kashier payment method
 */

const mongoose = require("mongoose");
require("dotenv").config();

const paymentMethodSchema = new mongoose.Schema({
    provider: String,
    displayName: Object,
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date,
}, { collection: "paymentmethods" });

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

async function run() {
    try {
        console.log("🔄 Connecting to MongoDB...");

        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI not found in .env file");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        const existing = await PaymentMethod.findOne({ provider: "cashier" });

        if (!existing) {
            console.log("ℹ️  No Kashier payment method found");
            await mongoose.connection.close();
            process.exit(0);
        }

        console.log("🔍 Found Kashier payment method:");
        console.log("   ID:", existing._id.toString());
        console.log("   Active:", existing.isActive);
        console.log("   Created:", existing.createdAt);

        if (process.argv.includes("--delete")) {
            await PaymentMethod.deleteOne({ _id: existing._id });
            console.log("\n✅ Deleted successfully!");
        } else {
            console.log("\n⚠️  Run with --delete to remove it:");
            console.log("   node checkKashierSimple.js --delete");
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

run();
