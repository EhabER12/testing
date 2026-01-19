/**
 * Sync Past Payments to Finance
 *
 * This script syncs all successful past payments that don't have
 * corresponding finance entries yet.
 *
 * Run with: node src/scripts/syncPaymentsToFinance.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.join(__dirname, "../../.env") });

import Payment from "../models/paymentModel.js";
import Finance from "../models/financeModel.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function syncPaymentsToFinance() {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all successful payments
    const payments = await Payment.find({
      status: "success",
    }).lean();

    console.log(`📦 Found ${payments.length} successful payments`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const payment of payments) {
      try {
        // Check if finance entry already exists
        const existingEntry = await Finance.findOne({
          "reference.id": payment._id,
          source: "payment_auto",
          isDeleted: { $ne: true },
        });

        if (existingEntry) {
          skipped++;
          continue;
        }

        // Create finance entry
        const description = `Payment: ${
          payment.billingInfo?.name || "Customer"
        } - ${payment.merchantOrderId || payment._id}`;

        const currency = payment.currency || "EGP";
        const amount = payment.amount;
        const exchangeRate = Finance.getExchangeRate(currency);
        const amountInUSD = Finance.convertToUSD(amount, currency);

        const financeEntry = new Finance({
          type: "income",
          amount: amount,
          currency: currency,
          category: "product_sale",
          description: description,
          transactionDate: payment.processedAt || payment.createdAt,
          source: "payment_auto",
          reference: {
            id: payment._id,
            model: "Payment",
            displayId: payment.merchantOrderId,
          },
          metadata: {
            customerName: payment.billingInfo?.name,
            customerEmail: payment.billingInfo?.email,
            paymentMethod: payment.paymentMethod,
          },
          amountInUSD: amountInUSD,
          exchangeRate: exchangeRate,
        });

        await financeEntry.save();
        synced++;

        console.log(`✅ Synced: ${description} - ${amount} ${currency}`);
      } catch (err) {
        errors++;
        console.error(`❌ Error syncing payment ${payment._id}:`, err.message);
      }
    }

    console.log("\n========== SYNC COMPLETE ==========");
    console.log(`✅ Synced:  ${synced}`);
    console.log(`⏭️  Skipped: ${skipped} (already existed)`);
    console.log(`❌ Errors:  ${errors}`);
    console.log(`📊 Total:   ${payments.length}`);
    console.log("====================================\n");
  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the sync
syncPaymentsToFinance();
