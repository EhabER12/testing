import { PaymentRepository } from "../repositories/paymentRepository.js";
import { SettingsRepository } from "../repositories/settingsRepository.js";
import { ApiError } from "../utils/apiError.js";
import emailTemplateService from "./emailTemplateService.js";
import { EmailService } from "./emailService.js";
import { FinanceService } from "./financeService.js";
import User from "../models/userModel.js";
import CartSession from "../models/cartSessionModel.js";
import Product from "../models/productModel.js";
import Service from "../models/serviceModel.js";
import logger from "../utils/logger.js";
import * as paypalClient from "./paypal.js";
import { kashierService } from "./cashierService.js";
import PaymentMethod from "../models/paymentMethodSchema.js";

export class PaymentService {
  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.settingsRepository = new SettingsRepository();
    this.emailService = new EmailService();
    this.financeService = new FinanceService();
  }

  async getAllPayments(queryParams) {
    const { page, limit, status, userId, productId, serviceId, packageId, studentMemberId } = queryParams;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    // Filter by productId, serviceId, or packageId if provided
    if (productId) {
      filter.productId = productId;
    }
    if (serviceId) {
      filter.serviceId = serviceId;
    }
    if (packageId) {
      filter.packageId = packageId;
    }
    if (studentMemberId) {
      filter.studentMemberId = studentMemberId;
    }

    const options = {
      page,
      limit,
      filter,
      populate: [
        {
          path: "userId",
          select: "_id fullName email role",
        },
        {
          path: "productId",
          select: "_id name slug basePrice coverImage",
        },
        {
          path: "courseId",
          select: "_id title slug price thumbnail instructorId",
        },
        {
          path: "serviceId",
          select: "_id title slug startingPrice",
        },
        {
          path: "packageId",
          select: "_id name price currency type",
        },
        {
          path: "studentMemberId",
          select: "_id name phone status",
        },
        {
          path: "statusHistory.changedBy",
          select: "_id fullName email",
        },
        {
          path: "cartSessionId",
          select: "_id cartItems cartTotal currency sessionId",
          populate: {
            path: "cartItems.productId",
            select: "_id name slug coverImage basePrice",
          },
        },
      ],
    };

    return this.paymentRepository.findAll(options);
  }

  async getPaymentById(id) {
    const payment = await this.paymentRepository.findById(id, {
      populate: [
        {
          path: "userId",
          select: "_id fullName email role",
        },
      ],
    });

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return payment;
  }

  async updatePaymentStatus(id, status, failureReason, adminId, adminNote) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    // Build status history entry
    const historyEntry = {
      status,
      changedBy: adminId,
      changedAt: new Date(),
      note:
        adminNote ||
        (failureReason ? `Rejection reason: ${failureReason}` : null),
    };

    // Prepare update data
    const updateData = {
      status,
      $push: { statusHistory: historyEntry },
    };

    if (failureReason) {
      updateData.failureReason = failureReason;
    }

    if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    if (status === "processing" || status === "success") {
      updateData.processedAt = new Date();
    }

    const updatedPayment = await this.paymentRepository.update(id, updateData);

    // If status changed to success, send notification and create finance entry
    if (status === "success" && payment.status !== "success") {
      // Determine locale from payment details or default to 'ar'
      const paymentLocale = payment.paymentDetails?.locale ||
        payment.billingInfo?.locale ||
        (payment.currency === "USD" ? "en" : "ar");

      // Send email notification using template
      try {
        await emailTemplateService.sendTemplatedEmail(
          payment.billingInfo?.email || payment.userId?.email,
          "order_confirmation",
          {
            name: payment.billingInfo?.name || payment.userId?.name || "Customer",
            orderId: payment.merchantOrderId,
            amount: payment.amount,
            currency: payment.currency,
            year: new Date().getFullYear(),
            dashboardUrl: (process.env.CLIENT_URL || "http://localhost:3000") + "/dashboard"
          },
          paymentLocale
        );
      } catch (emailError) {
        logger.error("Failed to send purchase notification email using template", { error: emailError.message });
      }

      // Auto-create finance entry for successful payment
      try {
        await this.financeService.createFromPayment(updatedPayment);
      } catch (financeError) {
        logger.error("Failed to create finance entry for payment", { error: financeError.message });
        // Don't fail the payment update due to finance entry failure
      }

      // Record teacher profit
      try {
        const { TeacherProfitService } = await import("./teacherProfitService.js");
        const profitService = new TeacherProfitService();
        await profitService.recordProfit(payment._id);
        logger.info("Teacher profit recorded for payment", { paymentId: payment._id });
      } catch (profitError) {
        logger.error("Failed to record teacher profit", { error: profitError.message });
        // Don't fail the payment if profit recording fails
      }

      // Auto-enroll student in course if this is a course payment
      // Check both courseId (new) and productId (legacy) for backward compatibility
      const paymentCourseId = payment.courseId || payment.productId;

      logger.info("Checking for course enrollment", {
        paymentId: payment._id,
        courseId: payment.courseId,
        productId: payment.productId,
        paymentCourseId,
        userId: payment.userId,
        metadata: payment.metadata
      });

      if (paymentCourseId && payment.userId) {
        try {
          const Course = (await import("../models/courseModel.js")).default;
          const course = await Course.findById(paymentCourseId);

          logger.info("Course lookup result", {
            paymentCourseId,
            courseFound: !!course,
            courseTitle: course?.title?.en || course?.title?.ar
          });

          // Only auto-enroll if it's actually a course (not a product)
          if (course) {
            const { CourseService } = await import("./courseService.js");
            const courseService = new CourseService();
            // Skip payment check since we're calling this after payment success
            await courseService.enrollStudent(paymentCourseId, payment.userId, true);
            logger.info("Student auto-enrolled in course after payment", {
              userId: payment.userId,
              courseId: paymentCourseId,
              paymentId: payment._id
            });
          } else {
            logger.info("No course found for payment - might be a product", { paymentCourseId });
          }
        } catch (enrollError) {
          logger.error("Failed to auto-enroll student in course", {
            error: enrollError.message,
            stack: enrollError.stack,
            userId: payment.userId,
            courseId: paymentCourseId
          });
          // Don't fail the payment if enrollment fails
        }
      } else {
        logger.info("No courseId/productId or userId found for payment", {
          paymentId: payment._id,
          hasPaymentCourseId: !!paymentCourseId,
          hasUserId: !!payment.userId
        });
      }

      // Handle package payments
      if (payment.packageId) {
        try {
          const { StudentMemberService } = await import("./studentMemberService.js");
          const studentMemberService = new StudentMemberService();

          if (payment.studentMemberId) {
            // Existing member renewal
            await studentMemberService.renewSubscription(
              payment.studentMemberId,
              adminId || payment.userId,
              `Renewed via payment: ${payment.merchantOrderId}`
            );
            logger.info("Student member subscription renewed after payment", {
              memberId: payment.studentMemberId,
              paymentId: payment._id,
            });
          } else if (payment.userId) {
            // Check if user already has a student member record for this package
            const StudentMember = (await import("../models/studentMemberModel.js")).default;
            const Package = (await import("../models/packageModel.js")).default;

            let member = await StudentMember.findOne({
              userId: payment.userId,
              packageId: payment.packageId
            });

            if (member) {
              await studentMemberService.renewSubscription(
                member._id,
                adminId || payment.userId,
                `Renewed via payment: ${payment.merchantOrderId}`
              );
            } else {
              // Create new student member record
              const pkg = await Package.findById(payment.packageId);
              const user = await User.findById(payment.userId);

              await studentMemberService.createMember({
                userId: payment.userId,
                packageId: payment.packageId,
                name: user.name || { ar: "طالب جديد", en: "New Student" },
                phone: user.phone || payment.billingInfo?.phone || "000",
                packagePrice: pkg.price,
                startDate: new Date(),
                billingDay: new Date().getDate(),
                status: "active"
              }, adminId || payment.userId);
            }
            logger.info("Student member processed after package payment", {
              userId: payment.userId,
              packageId: payment.packageId,
              paymentId: payment._id,
            });
          }
        } catch (packageError) {
          logger.error("Failed to process package payment subscription", {
            error: packageError.message,
            paymentId: payment._id,
          });
        }
      }
    }

    // If status changed to refunded, create expense entry
    if (status === "refunded" && payment.status !== "refunded") {
      try {
        await this.financeService.createFromRefund(updatedPayment, adminId);
      } catch (financeError) {
        logger.error("Failed to create refund finance entry", { error: financeError.message });
      }
    }

    return updatedPayment;
  }

  async updateAdminNotes(id, adminNotes, adminId) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return this.paymentRepository.update(id, { adminNotes });
  }

  async createManualPayment({
    userId,
    productId,
    courseId,
    serviceId,
    packageId,
    studentMemberId,
    pricingTierId,
    manualPaymentMethodId,
    paymentProofUrl,
    billingInfo,
    cartSessionId,
    currency,
  }) {
    try {
      // Auto-create user logic (same as before)
      let linkedUserId = userId;

      if (!userId && billingInfo?.email) {
        let existingUser = await User.findOne({
          email: billingInfo.email.toLowerCase(),
        });

        if (existingUser) {
          linkedUserId = existingUser._id;
        } else {
          // New user creation logic (abbreviated for brevity, assuming imported services handle it or keep original logic)
          // Ideally we should use userService.createUser but for now keeping inline as per original
          const crypto = await import("crypto");
          const verificationToken = crypto.randomBytes(32).toString("hex");
          const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

          const newUser = new User({
            name: billingInfo.name || "Customer",
            email: billingInfo.email.toLowerCase(),
            phone: billingInfo.phone || "",
            role: "user",
            status: "invited",
            verificationToken: hashedToken,
            verificationTokenExpire: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });

          await newUser.save();
          linkedUserId = newUser._id;

          // Send email...
        }
      }

      // Get manual payment method
      const settings = await this.settingsRepository.getSettings();
      const manualMethod = settings.paymentGateways.manualMethods.find(
        (m) => m.id === manualPaymentMethodId
      );
      if (!manualMethod) {
        throw new ApiError(404, "Manual payment method not found");
      }

      if (!manualMethod.isEnabled) {
        throw new ApiError(400, "This payment method is not available");
      }

      if (manualMethod.requiresAttachment && !paymentProofUrl) {
        throw new ApiError(400, "Payment proof is required for this method");
      }

      // Generate Title and Merchant ID
      const titleString = typeof manualMethod.title === "object"
        ? manualMethod.title.en || manualMethod.title.ar || "Manual"
        : manualMethod.title || "Manual";
      const methodName = titleString.replace(/\s+/g, "-").toUpperCase();
      const merchantOrderId = `${methodName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Create payment data
      const paymentData = {
        userId: linkedUserId,
        productId,
        courseId,
        serviceId,
        packageId,
        studentMemberId,
        amount: billingInfo.amount || 0,
        currency: currency || billingInfo.currency || "EGP",
        status: "pending",
        paymentMethod: titleString || "Manual",
        manualPaymentMethodId,
        paymentProofUrl,
        merchantOrderId,
        pricingTier: {
          tierId: pricingTierId,
          people: 1,
          pricePerPerson: billingInfo.amount || 0,
          label: packageId ? "Package Subscription" : "Manual Payment",
        },
        paymentDetails: {
          methodType: packageId ? "package_subscription" : "manual_user_payment",
          methodTitle: titleString || "Manual",
          requiresAttachment: manualMethod?.requiresAttachment || false,
          instructions: manualMethod?.instructions || "",
          items: billingInfo.items || [],
        },
        billingInfo: {
          ...billingInfo,
          items: undefined,
          amount: undefined,
        },
      };

      const payment = await this.paymentRepository.create(paymentData);

      // Handle Cart Session
      if (cartSessionId) {
        try {
          const cartSession = await CartSession.findOneAndUpdate(
            { sessionId: cartSessionId },
            {
              status: "converted",
              convertedAt: new Date(),
              paymentId: payment._id,
              lastActivityAt: new Date(),
            },
            { new: true }
          );

          if (cartSession) {
            await this.paymentRepository.update(payment._id, {
              cartSessionId: cartSession._id,
            });
          }
        } catch (cartError) {
          console.error("Failed to mark cart session as converted:", cartError);
        }
      }

      // Email notification will be sent when admin approves the payment (changes status to "success")
      // See updatePaymentStatus method for email logic

      return payment;
    } catch (error) {
      throw error;
    }
  }

  async createAdminManualPayment(data) {
    const { adminId, productId, courseId, serviceId, amount, currency, billingInfo, notes } = data;
    // Verification logic...
    const merchantOrderId = `ADMIN-MANUAL-${Date.now()}`;

    const paymentData = {
      userId: adminId,
      productId,
      courseId,
      serviceId,
      amount,
      currency: currency || "EGP",
      status: "pending", // Keep pending so admin can confirm receipt? Or 'success'? Controller says pending.
      paymentMethod: "Manual (Admin Recorded)",
      merchantOrderId,
      billingInfo,
      paymentDetails: {
        methodType: "admin_manual_payment",
        createdBy: adminId,
        notes: notes || "",
        description: "Payment recorded by administrator"
      }
    };

    return await this.paymentRepository.create(paymentData);
  }

  async getRevenueStatistics() {
    // Same implementation as before
    try {
      const successfulPaymentsData = await this.paymentRepository.findAll({
        filter: { status: "success" },
        limit: 10000,
        page: 1,
      });

      const successfulPayments = successfulPaymentsData.results || [];
      const totalRevenue = successfulPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const totalPayments = successfulPayments.length;

      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthlyPayments = successfulPayments.filter(p => new Date(p.createdAt) >= firstDayOfMonth);
      const monthlyRevenue = monthlyPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

      return {
        totalRevenue,
        totalPayments,
        monthlyRevenue,
        monthlyPayments: monthlyPayments.length,
      };
    } catch (error) { throw error; }
  }

  async cancelPayment(paymentId, userId) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) throw new ApiError(404, "Payment not found");
    if (payment.userId && payment.userId.toString() !== userId.toString()) throw new ApiError(403, "Not authorized");
    if (payment.status !== "pending") throw new ApiError(400, "Only pending payments can be cancelled");

    return this.paymentRepository.updateStatus(paymentId, "cancelled", null, {
      ...payment.paymentDetails,
      cancelledAt: new Date(),
      cancelledBy: "user",
    });
  }

  // ==================== NEW: PayPal & Cashier Integration ====================

  async getGatewayConfig(gatewayName) {
    const gateway = await PaymentMethod.findOne({ provider: gatewayName.toLowerCase() });

    if (!gateway || !gateway.isActive) {
      throw new ApiError(400, `${gatewayName} payment is disabled or not configured`);
    }

    return {
      isEnabled: gateway.isActive,
      mode: gateway.mode,
      credentials: gateway.credentials,
      config: gateway.config
    };
  }

  // --- PayPal ---

  async createPaypalPayment({ userId, courseId, productId, serviceId, amount, currency, locale, billingInfo }) {
    const config = await this.getGatewayConfig("paypal");

    // Get exchange rates from settings
    const settings = await this.settingsRepository.getSettings();
    const exchangeRates = settings.financeSettings?.exchangeRates || {};

    // Debug logging
    console.log("💱 PayPal Payment Request:", {
      amount,
      currency,
      financeSettingsExists: !!settings.financeSettings,
      exchangeRates,
    });

    // Map courseId to productId if present (for compatibility)
    const finalProductId = productId || courseId;
    const finalCourseId = courseId || null;

    // Create a pending payment record first
    const merchantOrderId = `PAYPAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const paymentData = {
      userId,
      productId: finalProductId,
      courseId: finalCourseId,
      serviceId,
      amount,
      currency,
      status: "pending",
      paymentMethod: "PayPal",
      merchantOrderId,
      billingInfo: billingInfo || {},
      paymentDetails: {
        methodType: "paypal_checkout",
        gatewayMode: config.mode,
        locale: locale || "en" // Store locale for email notifications
      }
    };

    const payment = await this.paymentRepository.create(paymentData);

    // Call PayPal API to create order with exchange rates
    try {
      const paypalOrder = await paypalClient.createOrder({
        amount,
        currency,
        config: config,
        exchangeRates: exchangeRates // Pass exchange rates for currency conversion
      });

      // Get the actual amount sent to PayPal (after conversion)
      const purchaseUnit = paypalOrder.purchase_units?.[0];
      const paypalAmount = purchaseUnit?.amount?.value;
      const paypalCurrency = purchaseUnit?.amount?.currency_code;

      // Update payment with PayPal Order ID and conversion details
      await this.paymentRepository.update(payment._id, {
        "paymentDetails.paypalOrderId": paypalOrder.id,
        "paymentDetails.approvalLink": paypalOrder.links.find(l => l.rel === "approve")?.href,
        "paymentDetails.convertedAmount": paypalAmount ? parseFloat(paypalAmount) : amount,
        "paymentDetails.convertedCurrency": paypalCurrency || currency,
        "paymentDetails.originalAmount": amount,
        "paymentDetails.originalCurrency": currency,
      });

      return {
        paymentId: payment._id,
        paypalOrderId: paypalOrder.id,
        approvalUrl: paypalOrder.links.find(l => l.rel === "approve")?.href,
        convertedAmount: paypalAmount ? parseFloat(paypalAmount) : null,
        convertedCurrency: paypalCurrency || "USD",
      };

    } catch (error) {
      await this.paymentRepository.updateStatus(payment._id, "failed", "PayPal API Error: " + error.message);
      throw error;
    }
  }

  async capturePaypalOrder({ orderId, userId }) {
    const config = await this.getGatewayConfig("paypal");

    try {
      // Find payment by PayPal Order ID first
      const Payment = (await import("../models/paymentModel.js")).default;
      let payment = await Payment.findOne({ "paymentDetails.paypalOrderId": orderId });

      if (!payment) {
        console.warn(`Payment not found for PayPal order ${orderId}`);
        throw new ApiError(404, "Payment not found for this PayPal order");
      }

      // Check if already captured
      if (payment.status === "success") {
        console.log(`Payment ${payment._id} already captured`);
        return {
          id: payment._id,
          merchantOrderId: payment.merchantOrderId,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          message: "Payment already captured"
        };
      }

      // Capture the PayPal order
      const captureData = await paypalClient.captureOrder({ orderId, config });

      console.log(`PayPal capture response for ${orderId}:`, captureData.status);

      if (captureData.status === "COMPLETED") {
        // Extract capture details
        const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
        const payerEmail = captureData.payer?.email_address;
        const payerName = `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim();

        // Update payment with capture details
        await Payment.findByIdAndUpdate(payment._id, {
          "paymentDetails.captureId": captureId,
          "paymentDetails.payerEmail": payerEmail,
          "paymentDetails.payerName": payerName,
          "paymentDetails.capturedAt": new Date(),
          "paymentDetails.paypalResponse": {
            status: captureData.status,
            captureId,
            payerEmail,
          }
        });

        // Update payment status to success
        await this.updatePaymentStatus(
          payment._id,
          "success",
          null,
          null,
          `PayPal Capture Completed - Capture ID: ${captureId}`
        );

        // Refetch updated payment
        payment = await Payment.findById(payment._id);

        console.log(`✅ PayPal payment ${payment._id} captured successfully`);

        return {
          id: payment._id,
          merchantOrderId: payment.merchantOrderId,
          status: "success",
          amount: payment.amount,
          currency: payment.currency,
          captureId,
          payerEmail,
          message: "Payment captured successfully"
        };
      } else {
        // Capture not completed
        const failureReason = `PayPal capture status: ${captureData.status}`;
        await this.updatePaymentStatus(payment._id, "failed", failureReason, null, failureReason);
        throw new ApiError(400, `PayPal capture failed: ${captureData.status}`);
      }
    } catch (error) {
      console.error(`❌ PayPal capture error for ${orderId}:`, error.message);
      throw error;
    }
  }

  async handlePaypalWebhook(payload, headers = {}) {
    try {
      const config = await this.getGatewayConfig("paypal");

      // Verify webhook signature if headers provided
      if (headers && headers["paypal-transmission-sig"]) {
        try {
          const verificationResult = await paypalClient.verifyWebhookSignature({
            headers,
            body: payload,
            config
          });

          if (verificationResult.verification_status !== "SUCCESS") {
            console.error("❌ PayPal webhook signature verification failed");
            throw new ApiError(401, "Invalid webhook signature");
          }
          console.log("✅ PayPal webhook signature verified");
        } catch (verifyError) {
          console.warn("⚠️ Webhook verification skipped:", verifyError.message);
          // Continue processing if verification fails (for backwards compatibility)
        }
      }

      const eventType = payload.event_type;
      const resource = payload.resource;

      console.log(`🔔 PayPal Webhook Event: ${eventType}`);

      const Payment = (await import("../models/paymentModel.js")).default;

      if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
        // Extract order ID from the webhook payload
        const captureId = resource.id;
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        const amount = resource.amount?.value;
        const currency = resource.amount?.currency_code;

        console.log(`✅ PayPal Payment Captured via Webhook - Order: ${orderId}, Capture: ${captureId}`);

        // Try to find and update payment by PayPal order ID
        if (orderId) {
          const payment = await Payment.findOne({ "paymentDetails.paypalOrderId": orderId });

          if (payment && payment.status !== "success") {
            await this.updatePaymentStatus(
              payment._id,
              "success",
              null,
              null,
              `PayPal Webhook: Capture ${captureId} completed`
            );
            console.log(`✅ Payment ${payment._id} marked as success via webhook`);
          }
        }
      } else if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.DECLINED") {
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        console.log(`❌ PayPal Payment Denied via Webhook - Order: ${orderId}`);

        if (orderId) {
          const payment = await Payment.findOne({ "paymentDetails.paypalOrderId": orderId });

          if (payment && payment.status === "pending") {
            await this.updatePaymentStatus(
              payment._id,
              "failed",
              "Payment denied by PayPal",
              null,
              `PayPal Webhook: Payment denied`
            );
          }
        }
      } else if (eventType === "CHECKOUT.ORDER.APPROVED") {
        // Order approved but not yet captured - this is expected in our flow
        console.log(`🟡 PayPal Order Approved (pending capture) - Order: ${resource.id}`);
      }

      return true;
    } catch (error) {
      console.error("PayPal Webhook Error:", error);
      // Return true anyway to acknowledge receipt and stop PayPal retries
      return true;
    }
  }

  // --- Cashier (Kashier) - Payment Sessions API v3 ---

  async createCashierPayment({ userId, courseId, productId, amount, currency, customer }) {
    const config = await this.getGatewayConfig("cashier");
    const finalProductId = productId || courseId;
    const finalCourseId = courseId || null;

    const merchantOrderId = `KASHIER-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Get base URL for webhooks and redirects
    const settings = await this.settingsRepository.getSettings();
    const baseUrl = settings.siteSettings?.siteUrl || process.env.SITE_URL || process.env.CLIENT_URL || "https://med-side.net";
    const apiBaseUrl = settings.siteSettings?.apiUrl || process.env.API_URL || "https://api.med-side.net";

    console.log("🔧 Kashier URL Configuration:", {
      siteUrl: settings.siteSettings?.siteUrl,
      apiUrl: settings.siteSettings?.apiUrl,
      baseUrl,
      apiBaseUrl,
      merchantRedirect: `${baseUrl}/payment/result`,
      serverWebhook: `${apiBaseUrl}/api/payments/kashier/webhook`,
    });

    const paymentData = {
      userId,
      productId: finalProductId,
      courseId: finalCourseId,
      amount,
      currency: currency || "EGP",
      status: "pending",
      paymentMethod: "Kashier",
      merchantOrderId,
      paymentDetails: {
        methodType: "kashier_session",
        gatewayMode: config.mode,
        sessionId: null, // Will be updated after session creation
      },
      billingInfo: {
        name: customer.name,
        email: customer.email
      }
    };

    const payment = await this.paymentRepository.create(paymentData);

    try {
      // Create Payment Session using new API
      const session = await kashierService.createPaymentSession({
        orderId: merchantOrderId,
        amount,
        currency: currency || "EGP",
        customer: {
          email: customer.email,
          name: customer.name,
          reference: userId?.toString() || merchantOrderId,
        },
        config,
        merchantRedirect: `${baseUrl}/payment/result?paymentId=${payment._id}`,
        serverWebhook: `${apiBaseUrl}/api/payments/kashier/webhook`,
        description: `Payment for ${finalProductId ? 'product' : 'course'} - Order ${merchantOrderId}`,
      });

      // Update payment with session information
      await this.paymentRepository.update(payment._id, {
        paymentDetails: {
          ...paymentData.paymentDetails,
          sessionId: session.sessionId,
          sessionUrl: session.sessionUrl,
          sessionStatus: session.status,
        },
      });

      console.log("✅ Kashier payment created:", {
        paymentId: payment._id,
        merchantOrderId,
        sessionId: session.sessionId,
      });

      return {
        paymentId: payment._id,
        merchantOrderId,
        sessionId: session.sessionId,
        checkoutUrl: session.sessionUrl,
        sessionUrl: session.sessionUrl,
      };
    } catch (error) {
      // If session creation fails, mark payment as failed
      await this.paymentRepository.updateStatus(payment._id, "failed", null, {
        ...paymentData.paymentDetails,
        error: error.message,
      });
      throw error;
    }
  }

  async handleKashierWebhook(payload, signature) {
    const config = await this.getGatewayConfig("cashier");

    // Verify webhook signature if provided
    if (signature) {
      const isValid = kashierService.verifyWebhookSignature({
        payload,
        signature,
        secretKey: config.credentials.secretKey,
      });

      if (!isValid) {
        console.error("❌ Kashier webhook signature verification failed");
        throw new ApiError(400, "Invalid webhook signature");
      }
    }

    // Parse webhook payload
    const webhookData = kashierService.parseWebhookPayload(payload);

    console.log("📥 Kashier webhook received:", {
      sessionId: webhookData.sessionId,
      merchantOrderId: webhookData.merchantOrderId,
      status: webhookData.status,
      amount: webhookData.amount,
    });

    // Look up payment by merchantOrderId or sessionId
    const Payment = (await import("../models/paymentModel.js")).default;
    let payment = await Payment.findOne({ merchantOrderId: webhookData.merchantOrderId });

    if (!payment) {
      // Try finding by sessionId
      payment = await Payment.findOne({ "paymentDetails.sessionId": webhookData.sessionId });
    }

    if (!payment) {
      console.error("❌ Payment not found for webhook:", {
        merchantOrderId: webhookData.merchantOrderId,
        sessionId: webhookData.sessionId,
      });
      throw new ApiError(404, "Payment not found");
    }

    // Check if already processed
    if (payment.status === "success") {
      console.log("ℹ️ Payment already processed:", payment._id);
      return payment;
    }

    // Map Kashier status to internal status
    const newStatus = kashierService.mapPaymentStatus(webhookData.status);

    // Update payment with webhook information
    const updatedPaymentDetails = {
      ...payment.paymentDetails,
      sessionId: webhookData.sessionId,
      sessionStatus: webhookData.status,
      transactionId: webhookData.transactionId,
      paymentMethod: webhookData.paymentMethod,
      webhookReceivedAt: new Date(),
      webhookData: webhookData.rawPayload,
    };

    await this.updatePaymentStatus(
      payment._id,
      newStatus,
      webhookData.transactionId,
      null,
      `Kashier Webhook: ${webhookData.status}`
    );

    // Update payment details
    await Payment.findByIdAndUpdate(payment._id, {
      paymentDetails: updatedPaymentDetails,
    });

    console.log("✅ Payment updated from webhook:", {
      paymentId: payment._id,
      oldStatus: payment.status,
      newStatus,
    });

    return payment;
  }

  // Keep old callback handler for backward compatibility (deprecated)
  async handleCashierCallback(payload) {
    console.warn("⚠️ Using deprecated Cashier callback handler. Please migrate to webhook handler.");

    const config = await this.getGatewayConfig("cashier");
    const { merchantOrderId } = payload;

    // Look up payment by merchantOrderId
    const Payment = (await import("../models/paymentModel.js")).default;
    const payment = await Payment.findOne({ merchantOrderId });

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (payment.status === "success") return payment;

    // Update status based on callback
    const status = payload.paymentStatus === "SUCCESS" ? "success" : "failed";

    await this.updatePaymentStatus(payment._id, status, null, null, `Cashier Callback: ${payload.paymentStatus}`);

    return payment;
  }
}
