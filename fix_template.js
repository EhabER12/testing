import mongoose from "mongoose";
import EmailTemplate from "./api/src/models/emailTemplateModel.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/genoun";

const checkTemplates = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");

        // 1. Check existing templates
        const templates = await EmailTemplate.find({}, "name type");
        console.log("Existing templates:", templates.map(t => t.name));

        // 2. Define the missing template
        const newTemplate = {
            name: "email_verification",
            type: "registration",
            subject: {
                ar: "تفعيل حسابك في منصة جنون",
                en: "Verify your Genoun account",
            },
            content: {
                ar: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">منصة جنون</h1>
          </div>
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">مرحباً {{name}}! 👋</h2>
            <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
              شكراً لتسجيلك معنا. لتفعيل حسابك والبدء في استخدام المنصة، يرجى الضغط على الزر أدناه.
            </p>
            <div style="margin: 30px 0;">
              <a href="{{verifyUrl}}" 
                 style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                تفعيل الحساب
              </a>
            </div>
            <p style="color: #718096; font-size: 14px; margin-top: 30px;">
              إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد الإلكتروني.
            </p>
          </div>
          <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      `,
                en: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Genoun</h1>
          </div>
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">Welcome {{name}}! 👋</h2>
            <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
              Thanks for signing up. To verify your account and get started, please click the button below.
            </p>
            <div style="margin: 30px 0;">
              <a href="{{verifyUrl}}" 
                 style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                Verify Account
              </a>
            </div>
            <p style="color: #718096; font-size: 14px; margin-top: 30px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
          <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
          </div>
        </div>
      `,
            },
            variables: [
                { name: "name", description: "User full name" },
                { name: "verifyUrl", description: "Verification page URL" },
                { name: "year", description: "Current year" },
            ],
            isActive: true
        };

        // 3. Upsert the template
        const result = await EmailTemplate.findOneAndUpdate(
            { name: "email_verification" },
            newTemplate,
            { upsert: true, new: true }
        );

        console.log("✅ Template 'email_verification' inserted/updated successfully!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

checkTemplates();
