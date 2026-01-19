import mongoose from "mongoose";
import Review from "../models/reviewModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Service from "../models/serviceModel.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the api root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedReviews = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const adminEmail = "admin@admin.com";
    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.log(
        `❌ User ${adminEmail} not found! Please create this user first.`
      );
      process.exit(1);
    }
    console.log(`👤 Found user: ${user.name}`);

    // Fetch potential products and services to link
    const products = await Product.find({});
    const services = await Service.find({});

    console.log(
      `📦 Found ${products.length} products and ${services.length} services`
    );

    if (products.length === 0 && services.length === 0) {
      console.error(
        "❌ No products or services found! Cannot seed reviews linked to existing items."
      );
      process.exit(1);
    }

    const reviewsData = [
      {
        name: user.name,
        email: user.email,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
        status: "approved",
      },
      {
        name: user.name,
        email: user.email,
        rating: 4,
        comment: "Great service, but could be faster.",
        status: "pending",
      },
      {
        name: user.name,
        email: user.email,
        rating: 1,
        comment: "Not satisfied with the quality.",
        status: "rejected",
        rejectionReason: "Inappropriate language",
      },
      {
        name: user.name,
        email: user.email,
        rating: 5,
        comment: "Amazing experience working with this team.",
        status: "approved",
      },
      {
        name: user.name,
        email: user.email,
        rating: 3,
        comment: "It was okay, average experience.",
        status: "approved",
      },
      {
        name: user.name,
        email: user.email,
        rating: 5,
        comment: "I love this so much! Will buy again.",
        status: "approved",
      },
      {
        name: user.name,
        email: user.email,
        rating: 2,
        comment: "Expected better quality for the price.",
        status: "pending",
      },
    ];

    const reviewsToCreate = reviewsData.map((review) => {
      // Pick a random product or service
      let linkedItem = {};
      const useProduct =
        products.length > 0 && (Math.random() > 0.5 || services.length === 0);

      if (useProduct) {
        linkedItem = {
          productId: products[Math.floor(Math.random() * products.length)]._id,
        };
      } else if (services.length > 0) {
        linkedItem = {
          serviceId: services[Math.floor(Math.random() * services.length)]._id,
        };
      }

      return {
        ...review,
        ...linkedItem,
      };
    });

    // Delete existing reviews for this user to avoid duplicates if re-run (optional, but good for testing)
    await Review.deleteMany({ email: adminEmail });
    console.log(`🗑️ Deleted existing reviews for ${adminEmail}`);

    await Review.insertMany(reviewsToCreate);
    console.log(
      `✅ Successfully seeded ${reviewsToCreate.length} reviews for ${user.email}`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding reviews:", error);
    process.exit(1);
  }
};

seedReviews();
