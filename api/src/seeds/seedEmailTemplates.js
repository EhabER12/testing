import mongoose from "mongoose";
import EmailTemplate from "../models/emailTemplateModel.js";
import dotenv from "dotenv";

dotenv.config();

const defaultTemplates = [
  {
    name: "registration",
    type: "registration",
    subject: {
      ar: "مرحباً بك في Genoun - تم إنشاء حسابك بنجاح",
      en: "Welcome to Genoun - Your account has been created",
    },
    content: {
      ar: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
          <div style="background: linear-gradient(135deg, #04524B 0%, #033D38 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #FB9903; margin: 0; font-size: 32px;">Genoun</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #04524B; margin: 0 0 20px;">أهلاً {{name}} 👋</h2>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">شكراً لانضمامك إلينا! تم إنشاء حسابك بنجاح.</p>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">يمكنك الآن البدء في استكشاف دوراتنا ومنتجاتنا.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" 
                 style="background: linear-gradient(135deg, #FB9903 0%, #d98102 100%); color: #1a1a1a; 
                        padding: 14px 40px; text-decoration: none; border-radius: 50px; 
                        font-weight: bold; display: inline-block;">
                تسجيل الدخول
              </a>
            </div>
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
            <h2 style="color: #04524B; margin: 0 0 20px;">Welcome {{name}} 👋</h2>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">Thank you for joining us! Your account has been created successfully.</p>
            <p style="color: #333; line-height: 1.8; font-size: 16px;">You can now start exploring our courses and products.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" 
                 style="background: linear-gradient(135deg, #FB9903 0%, #d98102 100%); color: #1a1a1a; 
                        padding: 14px 40px; text-decoration: none; border-radius: 50px; 
                        font-weight: bold; display: inline-block;">
                Login Now
              </a>
            </div>
          </div>
          <div style="background-color: #04524B; padding: 20px; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
          </div>
        </div>
      `,
    },
    variables: [
      { name: "name", description: "User full name" },
      { name: "loginUrl", description: "Login page URL" },
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
