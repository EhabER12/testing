import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env") });

import Payment from "../models/paymentModel.js";
import { TeacherProfitService } from "../services/teacherProfitService.js";

async function migrateExistingProfits() {
  try {
    console.log("🔄 Starting teacher profit migration...");
    console.log(`📊 Connecting to database: ${process.env.MONGODB_URI?.substring(0, 30)}...`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    const profitService = new TeacherProfitService();

    const successfulPayments = await Payment.find({ status: "success" }).sort({ createdAt: 1 });

    console.log(`📦 Found ${successfulPayments.length} successful payments to process`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const payment of successfulPayments) {
      try {
        const result = await profitService.recordProfit(payment._id);
        if (result) {
          processed++;
          if (processed % 10 === 0) {
            console.log(`   ⏳ Processed ${processed} payments...`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`   ❌ Failed to process payment ${payment._id}:`, error.message);
      }
    }

    console.log("\n📈 Migration Summary:");
    console.log(`   ✅ Successfully created: ${processed} profit records`);
    console.log(`   ⏭️  Skipped (no teacher): ${skipped} payments`);
    console.log(`   ❌ Errors: ${errors} payments`);
    console.log(`\n🎉 Migration complete!`);

    await mongoose.disconnect();
    console.log("👋 Disconnected from database");
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateExistingProfits()
    .then(() => {
      console.log("✨ All done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export default migrateExistingProfits;
