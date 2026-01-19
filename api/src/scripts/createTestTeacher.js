import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined. Check your .env configuration.");
  process.exit(1);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createTestTeacher = async () => {
  try {
    await connectDB();

    const email = "teacher@test.com";
    const password = "password123";

    // Check if teacher already exists
    let teacher = await User.findOne({ email });

    if (teacher) {
      console.log("Test teacher already exists, updating status to approved...");
      teacher.role = "teacher";
      teacher.status = "active";
      teacher.teacherInfo = {
        isApproved: true,
        approvedAt: new Date(),
        canUploadCourses: true,
        canPublishDirectly: false,
      };
      await teacher.save();
    } else {
      // Create teacher user
      teacher = await User.create({
        fullName: {
          ar: "معلم تجريبي",
          en: "Test Teacher"
        },
        email,
        password,
        role: "teacher",
        status: "active",
        isEmailVerified: true,
        teacherInfo: {
          isApproved: true,
          approvedAt: new Date(),
          canUploadCourses: true,
          canPublishDirectly: false,
        },
      });
      console.log("Test teacher created successfully!");
    }

    console.log("-------------------------------");
    console.log(`Email: ${teacher.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${teacher.role}`);
    console.log(`Approved: ${teacher.teacherInfo.isApproved}`);
    console.log("-------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Error creating test teacher:", error);
    process.exit(1);
  }
};

createTestTeacher();
