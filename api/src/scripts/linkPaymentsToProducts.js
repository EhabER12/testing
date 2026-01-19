/**
 * Script to update existing payments with random productIds
 * This is for testing/demo purposes
 *
 * Run from api directory:
 * node src/scripts/linkPaymentsToProducts.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Import models
import Payment from "../models/paymentModel.js";
import Product from "../models/productModel.js";

async function linkPaymentsToProducts() {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all active products
    const products = await Product.find({ isActive: true }).select("_id name");
    if (products.length === 0) {
      console.log("❌ No products found!");
      process.exit(1);
    }
    console.log(`📦 Found ${products.length} products`);

    // Get payments without productId
    const payments = await Payment.find({
      $or: [{ productId: null }, { productId: { $exists: false } }],
    });
    console.log(`💳 Found ${payments.length} payments without productId\n`);

    if (payments.length === 0) {
      console.log("✅ All payments already have productId linked!");
      process.exit(0);
    }

    // Update each payment with a random product
    let updated = 0;
    for (const payment of payments) {
      const randomProduct =
        products[Math.floor(Math.random() * products.length)];
      payment.productId = randomProduct._id;
      await payment.save();
      console.log(
        `   ✅ Payment ${payment._id.toString().slice(-8)} → ${
          randomProduct.name?.ar || randomProduct.name?.en || "Product"
        }`
      );
      updated++;
    }

    console.log(`\n========== COMPLETE ==========`);
    console.log(`✅ Updated: ${updated} payments`);
    console.log(`===============================\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

linkPaymentsToProducts();
