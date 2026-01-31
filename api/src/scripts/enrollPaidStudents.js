import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env") });

/**
 * Script to enroll students in courses they have successfully paid for
 * This fixes the issue where students who paid before the auto-enrollment feature was added
 * are not enrolled in their purchased courses.
 */
async function enrollPaidStudents() {
  try {
    console.log("🚀 Starting enrollment of paid students...");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    // Import models
    const Payment = (await import("../models/paymentModel.js")).default;
    const Course = (await import("../models/courseModel.js")).default;
    const Progress = (await import("../models/progressModel.js")).default;
    const { CourseService } = await import("../services/courseService.js");
    const courseService = new CourseService();

    // Find all successful payments with courseId
    console.log("\n🔍 Finding successful course payments...");
    
    // First, find payments with courseId field
    const paymentsWithCourseId = await Payment.find({
      $or: [
        { status: "success" },
        { status: "delivered" }
      ],
      courseId: { $exists: true, $ne: null },
      userId: { $exists: true, $ne: null }
    }).populate("courseId").populate("userId");

    console.log(`   Found ${paymentsWithCourseId.length} payments with courseId`);

    // Also find payments where productId might be a Course (for backward compatibility)
    const paymentsWithProductId = await Payment.find({
      $or: [
        { status: "success" },
        { status: "delivered" }
      ],
      productId: { $exists: true, $ne: null },
      courseId: { $exists: false },
      userId: { $exists: true, $ne: null }
    }).populate("userId");

    console.log(`   Found ${paymentsWithProductId.length} payments with productId (checking if they are courses)...`);

    // Check which productIds are actually courses
    const coursePayments = [];
    for (const payment of paymentsWithProductId) {
      try {
        const course = await Course.findById(payment.productId);
        if (course) {
          payment.courseId = course;
          coursePayments.push(payment);
        }
      } catch (err) {
        // Not a course, skip
      }
    }

    console.log(`   Found ${coursePayments.length} additional course payments from productId`);

    // Combine both lists
    const successfulPayments = [...paymentsWithCourseId, ...coursePayments];
    console.log(`   Total: ${successfulPayments.length} course payments to process`);


    let enrolled = 0;
    let alreadyEnrolled = 0;
    let errors = 0;
    let noCourse = 0;
    let noUser = 0;

    // Process each payment
    for (const payment of successfulPayments) {
      try {
        // Check if course and user exist
        if (!payment.courseId) {
          console.log(`   ⚠️  Payment ${payment._id}: Course not found`);
          noCourse++;
          continue;
        }

        if (!payment.userId) {
          console.log(`   ⚠️  Payment ${payment._id}: User not found`);
          noUser++;
          continue;
        }

        const courseId = payment.courseId._id || payment.courseId;
        const userId = payment.userId._id || payment.userId;

        // Check if student is already enrolled
        const existingProgress = await Progress.findOne({
          userId: userId,
          courseId: courseId
        });

        if (existingProgress) {
          alreadyEnrolled++;
          if (alreadyEnrolled % 10 === 0) {
            console.log(`   ℹ️  Already enrolled: ${alreadyEnrolled}`);
          }
          continue;
        }

        // Enroll the student (skip payment check since we know they paid)
        await courseService.enrollStudent(courseId, userId, true);
        enrolled++;

        console.log(`   ✅ Enrolled user ${userId} in course "${payment.courseId.title?.en || payment.courseId.title?.ar}"`);

        if (enrolled % 10 === 0) {
          console.log(`   📊 Progress: ${enrolled} enrolled, ${alreadyEnrolled} already enrolled`);
        }

      } catch (error) {
        errors++;
        console.error(`   ❌ Failed to enroll payment ${payment._id}:`, error.message);
      }
    }

    console.log("\n📈 Enrollment Summary:");
    console.log(`   ✅ Newly enrolled: ${enrolled} students`);
    console.log(`   ℹ️  Already enrolled: ${alreadyEnrolled} students`);
    console.log(`   ⚠️  Course not found: ${noCourse} payments`);
    console.log(`   ⚠️  User not found: ${noUser} payments`);
    console.log(`   ❌ Errors: ${errors} payments`);
    console.log(`\n🎉 Enrollment complete!`);

    await mongoose.disconnect();
    console.log("👋 Disconnected from database");
  } catch (error) {
    console.error("💥 Enrollment failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  enrollPaidStudents()
    .then(() => {
      console.log("✨ All done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export default enrollPaidStudents;
