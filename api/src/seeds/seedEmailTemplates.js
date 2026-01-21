import mongoose from "mongoose";
import EmailTemplate from "../models/emailTemplateModel.js";
import dotenv from "dotenv";

dotenv.config();

const defaultTemplates = [
  {

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
  },
  {
    name: "order_confirmation",
    type: "order_confirmation",
    subject: {
      ar: "تم تأكيد طلبك بنجاح - رقم الطلب {{orderId}}",
      en: "Order confirmed successfully - Order #{{orderId}}",
    },
    content: {
      ar: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
          <div style="background: linear-gradient(135deg, #04524B 0%, #033D38 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #FB9903; margin: 0; font-size: 32px;">Genoun</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #04524B; margin: 0 0 20px;">شكراً لشرائك يا {{name}}!</h2>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">تم استلام طلبك بنجاح وهو قيد التنفيذ.</p>
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>رقم الطلب:</strong> {{orderId}}</p>
              <p style="margin: 5px 0;"><strong>المبلغ الإجمالي:</strong> {{amount}} {{currency}}</p>
            </div>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">يمكنك متابعة حالة طلبك من خلال حسابك.</p>
          </div>
          <div style="background-color: #04524B; padding: 20px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      `,
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #04524B 0%, #033D38 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #FB9903; margin: 0; font-size: 32px;">Genoun</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #04524B; margin: 0 0 20px;">Thank you for your purchase, {{name}}!</h2>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">We've received your order and it's being processed.</p>
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> {{orderId}}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> {{amount}} {{currency}}</p>
            </div>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">You can track your order status from your account.</p>
          </div>
          <div style="background-color: #04524B; padding: 20px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
          </div>
        </div>
      `,
    },
    variables: [
      { name: "name", description: "Customer name" },
      { name: "orderId", description: "Order unique ID" },
      { name: "amount", description: "Total amount paid" },
      { name: "currency", description: "Currency (e.g., EGP, SAR)" },
      { name: "year", description: "Current year" },
    ],
  },
];

const seedEmailTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/genoun");
    console.log("Connected to MongoDB for seeding email templates...");

    for (const template of defaultTemplates) {
      await EmailTemplate.findOneAndUpdate(
        { name: template.name },
        template,
        { upsert: true, new: true }
      );
      console.log(`Seeded/Updated template: ${template.name}`);
    }

    console.log("Email templates seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding email templates:", error);
    process.exit(1);
  }
};

seedEmailTemplates();
