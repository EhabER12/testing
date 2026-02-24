import EmailTemplate from "../models/emailTemplateModel.js";
import { EmailService } from "./emailService.js";
import { ApiError } from "../utils/apiError.js";
import logger from "../utils/logger.js";

class EmailTemplateService {
  constructor() {
    this.emailService = new EmailService();
  }

  // Get all templates
  async getAllTemplates() {
    try {
      // Ensure system templates exist
      const systemTemplates = [
        "email_verification",
        "student_welcome",
        "user_invitation",
        "order_confirmation",
        "book_download_links",
        "password_reset",
        "password_reset_confirmation",
        "employee_task_assigned",
        "admin_task_completed",
        "admin_new_request",
      ];

      for (const name of systemTemplates) {
        const exists = await EmailTemplate.exists({ name });
        if (!exists) {
          await this.createDefaultTemplate(name);
        }
      }
    } catch (error) {
      // Log error but don't fail the request
      logger.error('Error in self-healing templates:', error);
    }

    return EmailTemplate.find().sort({ createdAt: -1 });
  }

  // Get template by name
  async getTemplateByName(name) {
    let template = await EmailTemplate.findOne({ name });

    if (!template) {
      // Try to create if it's a system template
      template = await this.createDefaultTemplate(name);

      if (!template) {
        const allTemplates = await EmailTemplate.find({}, 'name');
        logger.error(`Email template '${name}' not found. Available templates: ${allTemplates.map(t => t.name).join(', ')}`);
        throw new ApiError(404, `Email template '${name}' not found`);
      }
    }
    return template;
  }

  // Helper to create default templates
  async createDefaultTemplate(name) {
    logger.info(`Creating default email template: ${name}`);

    if (name === 'email_verification') {
      return await this.saveTemplate({
        name: "email_verification",
        type: "registration",
        subject: {
          ar: "تفعيل حسابك في منصة جنون",
          en: "Verify your Genoun account",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
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
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
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
          </div>`,
        },
        variables: [
          { name: "name", description: "User full name" },
          { name: "verifyUrl", description: "Verification page URL" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    if (name === "student_welcome") {
      return await this.saveTemplate({
        name: "student_welcome",
        type: "registration",
        subject: {
          ar: "مرحباً بك في منصة جنون يا {{name}}",
          en: "Welcome to Genoun, {{name}}",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">منصة جنون</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">أهلاً {{name}} 👋</h2>
              <p style="color: #4a5568; line-height: 1.8; font-size: 16px; margin-bottom: 24px;">
                تم تفعيل حسابك بنجاح، ونحن سعداء بانضمامك لنا.
              </p>
              <p style="color: #4a5568; line-height: 1.8; font-size: 16px; margin-bottom: 30px;">
                يمكنك الآن تسجيل الدخول وبدء رحلتك التعليمية من خلال الزر التالي:
              </p>
              <div style="margin: 30px 0;">
                <a href="{{loginUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                  تسجيل الدخول
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Genoun</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">Welcome {{name}} 👋</h2>
              <p style="color: #4a5568; line-height: 1.8; font-size: 16px; margin-bottom: 24px;">
                Your account is fully activated and ready to use.
              </p>
              <p style="color: #4a5568; line-height: 1.8; font-size: 16px; margin-bottom: 30px;">
                You can now sign in and start your learning journey:
              </p>
              <div style="margin: 30px 0;">
                <a href="{{loginUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Sign In
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "name", description: "Student full name" },
          { name: "loginUrl", description: "Login page URL" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    if (name === 'order_confirmation') {
      return await this.saveTemplate({
        name: "order_confirmation",
        type: "order_confirmation",
        subject: {
          ar: "تأكيد إتمام الدفع - طلب رقم {{orderId}}",
          en: "Payment Confirmation - Order #{{orderId}}",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">منصة جنون</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">تم استلام دفعتك بنجاح! ✅</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                مرحباً {{name}}، شكراً لك.<br>
                لقد تم استلام دفعتك بنجاح. تفاصيل الطلب موضحة أدناه.
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: right;">
                <div style="margin-bottom: 10px;">
                  <span style="color: #718096; font-size: 14px;">رقم الطلب:</span>
                  <strong style="color: #2d3748; font-size: 16px; margin-right: 8px;">{{orderId}}</strong>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="color: #718096; font-size: 14px;">المبلغ:</span>
                  <strong style="color: #2d3748; font-size: 16px; margin-right: 8px;">{{amount}} {{currency}}</strong>
                </div>
              </div>

              <div style="margin: 30px 0;">
                <a href="{{dashboardUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                  الذهاب إلى لوحة التحكم
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Genoun</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">Payment Received! ✅</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                Hi {{name}},<br>
                We have successfully received your payment. Your order details are below.
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
                <div style="margin-bottom: 10px;">
                  <span style="color: #718096; font-size: 14px;">Order ID:</span>
                  <strong style="color: #2d3748; font-size: 16px; margin-left: 8px;">{{orderId}}</strong>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="color: #718096; font-size: 14px;">Amount:</span>
                  <strong style="color: #2d3748; font-size: 16px; margin-left: 8px;">{{amount}} {{currency}}</strong>
                </div>
              </div>

              <div style="margin: 30px 0;">
                <a href="{{dashboardUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                  Go to Dashboard
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "name", description: "Customer name" },
          { name: "orderId", description: "Order ID" },
          { name: "amount", description: "Payment amount" },
          { name: "currency", description: "Payment currency" },
          { name: "year", description: "Current year" },
          { name: "dashboardUrl", description: "Link to user dashboard" },
        ],
      });
    }

    if (name === "book_download_links") {
      return await this.saveTemplate({
        name: "book_download_links",
        type: "custom",
        subject: {
          ar: "روابط تحميل الكتب - طلب رقم {{orderId}}",
          en: "Your Book Download Links - Order #{{orderId}}",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Genoun</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #1a472a; margin: 0 0 16px; font-size: 22px;">مرحباً {{name}}</h2>
              <p style="color: #4a5568; line-height: 1.8; font-size: 15px;">
                تم تأكيد طلبك بنجاح. يمكنك تحميل الكتب المشتراة من الروابط التالية:
              </p>
              <ul style="line-height: 2; font-size: 15px; padding-right: 18px;">
                {{booksList}}
              </ul>
              <p style="color: #718096; font-size: 13px; margin-top: 20px;">
                يمكنك أيضاً الرجوع إلى حسابك من خلال الرابط التالي:
              </p>
              <p><a href="{{dashboardUrl}}" style="color:#1a472a;">{{dashboardUrl}}</a></p>
            </div>
            <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Genoun</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #1a472a; margin: 0 0 16px; font-size: 22px;">Hello {{name}}</h2>
              <p style="color: #4a5568; line-height: 1.8; font-size: 15px;">
                Your payment was confirmed. You can download your purchased books from the links below:
              </p>
              <ul style="line-height: 2; font-size: 15px; padding-left: 18px;">
                {{booksList}}
              </ul>
              <p style="color: #718096; font-size: 13px; margin-top: 20px;">
                You can also access your account here:
              </p>
              <p><a href="{{dashboardUrl}}" style="color:#1a472a;">{{dashboardUrl}}</a></p>
            </div>
            <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "name", description: "Customer name" },
          { name: "orderId", description: "Order ID" },
          { name: "booksList", description: "HTML list of downloadable books" },
          { name: "dashboardUrl", description: "User account URL" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    if (name === 'user_invitation') {
      return await this.saveTemplate({
        name: "user_invitation",
        type: "invitation",
        subject: {
          ar: "دعوة للانضمام لمنصة جنون",
          en: "Invitation to Join Genoun",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">منصة جنون</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">مرحباً بك! 👋</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                لقد تمت دعوتك للانضمام إلى منصة جنون كـ <strong>{{role}}</strong>.
                <br>
                لإكمال عملية التسجيل وتعيين كلمة المرور، يرجى الضغط على الزر أدناه.
              </p>
              <div style="margin: 30px 0;">
                <a href="{{inviteUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                  إكمال التسجيل
                </a>
              </div>
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                هذا الرابط صالح لمدة 24 ساعة فقط.
              </p>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Genoun</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">Welcome! 👋</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                You have been invited to join Genoun as a <strong>{{role}}</strong>.
                <br>
                To complete your registration and set your password, please click the button below.
              </p>
              <div style="margin: 30px 0;">
                <a href="{{inviteUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                  Complete Registration
                </a>
              </div>
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                This link is valid for 24 hours only.
              </p>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "role", description: "User role in Arabic/English" },
          { name: "inviteUrl", description: "Invitation completion URL" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    if (name === 'password_reset') {
      return await this.saveTemplate({
        name: "password_reset",
        type: "password_reset",
        subject: {
          ar: "طلب إعادة تعيين كلمة المرور",
          en: "Password Reset Request",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">منصة جنون</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">طلب إعادة تعيين كلمة المرور 🔑</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                مرحباً {{name}}، لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. يرجى الضغط على الزر أدناه للمتابعة.
              </p>
              <div style="margin: 30px 0;">
                <a href="{{resetUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                  إعادة تعيين كلمة المرور
                </a>
              </div>
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب هذا التغيير، يمكنك تجاهل هذا البريد.
              </p>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Genoun</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">Password Reset Request 🔑</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                Hi {{name}}, we received a request to reset your password. Please click the button below to proceed.
              </p>
              <div style="margin: 30px 0;">
                <a href="{{resetUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                  Reset Password
                </a>
              </div>
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                This link is valid for 1 hour only. If you didn't request this change, you can safely ignore this email.
              </p>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "name", description: "User full name" },
          { name: "resetUrl", description: "Password reset URL" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    if (name === 'password_reset_confirmation') {
      return await this.saveTemplate({
        name: "password_reset_confirmation",
        type: "password_reset",
        subject: {
          ar: "تم تغيير كلمة المرور بنجاح",
          en: "Password Changed Successfully",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">منصة جنون</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">تم تغيير كلمة المرور! ✅</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                مرحباً {{name}}، نحيطك علماً بأنه قد تم تغيير كلمة المرور الخاصة بحسابك بنجاح.
              </p>
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                إذا لم تكن أنت من قام بهذا الإجراء، يرجى التواصل مع الدعم الفني فوراً لحماية حسابك.
              </p>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Genoun</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1a472a; margin: 0 0 20px; font-size: 24px;">Password Changed! ✅</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                Hi {{name}}, this is a confirmation that your password has been successfully changed.
              </p>
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                If you didn't perform this action, please contact support immediately to secure your account.
              </p>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "name", description: "User full name" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    if (name === "employee_task_assigned") {
      return await this.saveTemplate({
        name: "employee_task_assigned",
        type: "custom",
        subject: {
          ar: "تم تعيين مهمة جديدة لك: {{taskTitle}}",
          en: "New task assigned: {{taskTitle}}",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 24px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">منصة جنون</h1>
            </div>
            <div style="padding: 24px 20px;">
              <h2 style="color: #1a472a; margin: 0 0 12px; font-size: 20px;">مرحباً {{employeeName}}</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
                تم إضافة مهمة جديدة لك. تفاصيل المهمة بالأسفل.
              </p>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; text-align: right;">
                <p style="margin: 0 0 8px;"><strong>المهمة:</strong> {{taskTitle}}</p>
                <p style="margin: 0 0 8px;"><strong>الوصف:</strong> {{taskDescription}}</p>
                <p style="margin: 0 0 8px;"><strong>تاريخ الاستحقاق:</strong> {{dueDate}}</p>
                <p style="margin: 0 0 8px;"><strong>الأولوية:</strong> {{priority}}</p>
                <p style="margin: 0;"><strong>تم تعيينها بواسطة:</strong> {{assignedBy}}</p>
              </div>
              <div style="margin: 24px 0; text-align: center;">
                <a href="{{tasksUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  عرض مهامي
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 24px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Genoun</h1>
            </div>
            <div style="padding: 24px 20px;">
              <h2 style="color: #1a472a; margin: 0 0 12px; font-size: 20px;">Hello {{employeeName}}</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
                A new task has been assigned to you. Details are below.
              </p>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; text-align: left;">
                <p style="margin: 0 0 8px;"><strong>Task:</strong> {{taskTitle}}</p>
                <p style="margin: 0 0 8px;"><strong>Description:</strong> {{taskDescription}}</p>
                <p style="margin: 0 0 8px;"><strong>Due date:</strong> {{dueDate}}</p>
                <p style="margin: 0 0 8px;"><strong>Priority:</strong> {{priority}}</p>
                <p style="margin: 0;"><strong>Assigned by:</strong> {{assignedBy}}</p>
              </div>
              <div style="margin: 24px 0; text-align: center;">
                <a href="{{tasksUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  View My Tasks
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "employeeName", description: "Employee full name" },
          { name: "taskTitle", description: "Task title" },
          { name: "taskDescription", description: "Task description" },
          { name: "dueDate", description: "Task due date" },
          { name: "priority", description: "Task priority" },
          { name: "assignedBy", description: "Task assigned by" },
          { name: "tasksUrl", description: "Link to employee tasks page" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    if (name === "admin_task_completed") {
      return await this.saveTemplate({
        name: "admin_task_completed",
        type: "custom",
        subject: {
          ar: "تم إنهاء مهمة: {{taskTitle}}",
          en: "Task completed: {{taskTitle}}",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 24px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">منصة جنون</h1>
            </div>
            <div style="padding: 24px 20px;">
              <h2 style="color: #1a472a; margin: 0 0 12px; font-size: 20px;">اكتملت مهمة موظف</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
                قام الموظف {{employeeName}} بإنهاء المهمة التالية:
              </p>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; text-align: right;">
                <p style="margin: 0 0 8px;"><strong>المهمة:</strong> {{taskTitle}}</p>
                <p style="margin: 0 0 8px;"><strong>الحالة:</strong> {{status}}</p>
                <p style="margin: 0;"><strong>تاريخ الإنهاء:</strong> {{completedAt}}</p>
              </div>
              <div style="margin: 24px 0; text-align: center;">
                <a href="{{tasksUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  عرض تفاصيل الموظف
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 24px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Genoun</h1>
            </div>
            <div style="padding: 24px 20px;">
              <h2 style="color: #1a472a; margin: 0 0 12px; font-size: 20px;">Task completed by employee</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
                {{employeeName}} has completed the following task:
              </p>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; text-align: left;">
                <p style="margin: 0 0 8px;"><strong>Task:</strong> {{taskTitle}}</p>
                <p style="margin: 0 0 8px;"><strong>Status:</strong> {{status}}</p>
                <p style="margin: 0;"><strong>Completed at:</strong> {{completedAt}}</p>
              </div>
              <div style="margin: 24px 0; text-align: center;">
                <a href="{{tasksUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  View Employee Details
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "employeeName", description: "Employee full name" },
          { name: "taskTitle", description: "Task title" },
          { name: "status", description: "Task status" },
          { name: "completedAt", description: "Completion date" },
          { name: "tasksUrl", description: "Link to employee tasks page" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    if (name === "admin_new_request") {
      return await this.saveTemplate({
        name: "admin_new_request",
        type: "custom",
        subject: {
          ar: "طلب جديد: {{formTitle}}",
          en: "New request: {{formTitle}}",
        },
        content: {
          ar: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 24px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">منصة جنون</h1>
            </div>
            <div style="padding: 24px 20px;">
              <h2 style="color: #1a472a; margin: 0 0 12px; font-size: 20px;">تم استلام طلب جديد</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 8px;">
                <strong>النموذج:</strong> {{formTitle}}
              </p>
              <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
                <strong>تاريخ الإرسال:</strong> {{submittedAt}}
              </p>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; text-align: right;">
                {{submissionSummary}}
              </div>
              <div style="margin: 24px 0; text-align: center;">
                <a href="{{submissionsUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  عرض الطلبات
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. جميع الحقوق محفوظة.</p>
            </div>
          </div>`,
          en: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a472a 0%, #0d2b1a 100%); padding: 24px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Genoun</h1>
            </div>
            <div style="padding: 24px 20px;">
              <h2 style="color: #1a472a; margin: 0 0 12px; font-size: 20px;">New request received</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 8px;">
                <strong>Form:</strong> {{formTitle}}
              </p>
              <p style="color: #4a5568; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
                <strong>Submitted at:</strong> {{submittedAt}}
              </p>
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; text-align: left;">
                {{submissionSummary}}
              </div>
              <div style="margin: 24px 0; text-align: center;">
                <a href="{{submissionsUrl}}" 
                   style="background-color: #d4af37; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  View Submissions
                </a>
              </div>
            </div>
            <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #a0aec0; margin: 0; font-size: 12px;">© {{year}} Genoun. All rights reserved.</p>
            </div>
          </div>`,
        },
        variables: [
          { name: "formTitle", description: "Form title" },
          { name: "submittedAt", description: "Submission date" },
          { name: "submissionSummary", description: "Submission summary HTML" },
          { name: "submissionsUrl", description: "Link to submissions page" },
          { name: "year", description: "Current year" },
        ],
      });
    }

    return null;
  }

  // Create or update template
  async saveTemplate(data) {
    const { name } = data;
    return EmailTemplate.findOneAndUpdate({ name }, data, {
      upsert: true,
      new: true,
      runValidators: true,
    });
  }

  // Send email using a template
  async sendTemplatedEmail(to, templateName, variables = {}, lang = "ar") {
    try {
      const template = await this.getTemplateByName(templateName);
      if (!template.isActive) {
        logger.warn(`Template ${templateName} is inactive, skip sending`);
        return;
      }

      let subject = template.subject[lang] || template.subject.en;
      let content = template.content[lang] || template.content.en;

      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        subject = subject.replace(regex, value);
        content = content.replace(regex, value);
      });

      await this.emailService.sendEmail(to, subject, content);
      logger.info(`Templated email '${templateName}' sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send templated email '${templateName}' to ${to}`, {
        error: error.message,
      });
      throw error;
    }
  }
}

export default new EmailTemplateService();
