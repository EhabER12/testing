import mongoose from "mongoose";
import Payment from "../models/paymentModel.js";
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

const seedPayments = async () => {
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

    const paymentsData = [
      {
        amount: 1500,
        currency: "EGP",
        status: "success",
        paymentMethod: "credit_card",
        billingInfo: {
          name: user.name,
          email: user.email,
          phone: "01012345678",
          address: "123 Admin St",
          city: "Cairo",
          country: "Egypt",
        },
        paymentDetails: {
          items: [
            {
              name: "Premium Service Package",
              price: 1500,
              quantity: 1,
            },
          ],
        },
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      },
      {
        amount: 250,
        currency: "EGP",
        status: "pending",
        paymentMethod: "vodafone_cash",
        billingInfo: {
          name: user.name,
          email: user.email,
          phone: "01012345678",
          address: "123 Admin St",
          city: "Cairo",
          country: "Egypt",
        },
        paymentDetails: {
          items: [
            {
              name: "Consultation Session",
              price: 250,
              quantity: 1,
            },
          ],
        },
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      },
      {
        amount: 5000,
        currency: "EGP",
        status: "failed",
        paymentMethod: "credit_card",
        billingInfo: {
          name: user.name,
          email: user.email,
          phone: "01012345678",
          address: "123 Admin St",
          city: "Cairo",
          country: "Egypt",
        },
        paymentDetails: {
          items: [
            {
              name: "Web Development Full Payment",
              price: 5000,
              quantity: 1,
            },
          ],
        },
        failureReason: "Insufficient funds",
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      },
      {
        amount: 750,
        currency: "EGP",
        status: "refunded",
        paymentMethod: "instapay",
        billingInfo: {
          name: user.name,
          email: user.email,
          phone: "01012345678",
          address: "123 Admin St",
          city: "Cairo",
          country: "Egypt",
        },
        paymentDetails: {
          items: [
            {
              name: "Marketing Campaign (Cancelled)",
              price: 750,
              quantity: 1,
            },
          ],
        },
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
      },
      {
        amount: 3000,
        currency: "EGP",
        status: "success",
        paymentMethod: "credit_card",
        billingInfo: {
          name: user.name,
          email: user.email,
          phone: "01012345678",
          address: "123 Admin St",
          city: "Alexandria",
          country: "Egypt",
        },
        paymentDetails: {
          items: [
            {
              name: "E-commerce Plugin",
              price: 3000,
              quantity: 1,
            },
          ],
        },
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 20 days ago
      },
    ];

    const paymentsToCreate = paymentsData.map((p) => {
      // Randomly link to product or service if available
      let linkedItem = {};
      if (Math.random() > 0.5 && products.length > 0) {
        linkedItem = {
          productId: products[Math.floor(Math.random() * products.length)]._id,
        };
      } else if (services.length > 0) {
        linkedItem = {
          serviceId: services[Math.floor(Math.random() * services.length)]._id,
        };
      }

      return {
        ...p,
        userId: user._id,
        ...linkedItem,
      };
    });

    await Payment.insertMany(paymentsToCreate);
    console.log(
      `✅ Successfully seeded ${paymentsToCreate.length} payments for ${user.email}`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding payments:", error);
    process.exit(1);
  }
};

seedPayments();
