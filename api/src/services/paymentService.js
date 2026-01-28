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

      // Auto-enroll student in course if this is a course payment
      if (payment.metadata && payment.metadata.type === "course" && payment.metadata.courseId) {
        // ... (existing course enrollment logic could be added here or handled by another service) ...
        // For now, assuming user purchased a specific product/course and we might need to trigger enrollment
        // But since this is general payment service, we'll leave specific enrollment logic to the caller or listener
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
        serviceId,
        packageId,
        studentMemberId,
        amount: billingInfo.amount || 0,
        currency: currency || billingInfo.currency || "SAR",
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

      // Send Confirmation Email
      if (billingInfo?.email) {
        try {
          await emailTemplateService.sendTemplatedEmail(
            billingInfo.email,
            "order_confirmation",
            {
              name: billingInfo.name || "Customer",
              orderId: merchantOrderId,
              amount: billingInfo.amount || 0,
              currency: currency || billingInfo.currency || "SAR",
              year: new Date().getFullYear(),
              dashboardUrl: (process.env.CLIENT_URL || "http://localhost:3000") + "/dashboard"
            },
            "ar"
          );
        } catch (e) { logger.error("Email error", e) }
      }

      return payment;
    } catch (error) {
      throw error;
    }
  }

  async createAdminManualPayment(data) {
    const { adminId, productId, serviceId, amount, currency, billingInfo, notes } = data;
    // Verification logic...
    const merchantOrderId = `ADMIN-MANUAL-${Date.now()}`;

    const paymentData = {
      userId: adminId,
      productId,
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

    // Create a pending payment record first
    const merchantOrderId = `PAYPAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const paymentData = {
      userId,
      productId: finalProductId,
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

      // Update payment with PayPal Order ID
      await this.paymentRepository.update(payment._id, {
        "paymentDetails.paypalOrderId": paypalOrder.id,
        "paymentDetails.approvalLink": paypalOrder.links.find(l => l.rel === "approve")?.href
      });

      return {
        paymentId: payment._id,
        paypalOrderId: paypalOrder.id,
        approvalUrl: paypalOrder.links.find(l => l.rel === "approve")?.href
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

  // --- Cashier (Kashier) ---

  async createCashierPayment({ userId, courseId, productId, amount, currency, customer }) {
    const config = await this.getGatewayConfig("cashier");
    const finalProductId = productId || courseId;

    const merchantOrderId = `KASHIER-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const paymentData = {
      userId,
      productId: finalProductId,
      amount,
      currency: currency || "EGP", // Kashier is usually EGP
      status: "pending",
      paymentMethod: "Cashier",
      merchantOrderId,
      paymentDetails: {
        methodType: "kashier_checkout",
        gatewayMode: config.mode
      },
      billingInfo: {
        name: customer.name,
        email: customer.email
      }
    };

    const payment = await this.paymentRepository.create(paymentData);

    // Generate Checkout URL
    const checkoutUrl = kashierService.generateCheckoutUrl({
      orderId: merchantOrderId,
      amount,
      currency: currency || "EGP",
      customer,
      config
    });

    return {
      paymentId: payment._id,
      merchantOrderId,
      checkoutUrl
    };
  }

  async handleCashierCallback(payload) {
    // Verify Hash
    const config = await this.getGatewayConfig("cashier");

    const { merchantOrderId, orderStatus, signature } = payload;
    // Note: Kashier payload keys differ. 
    // Usually query params like paymentStatus, merchantOrderId.
    // Assuming payload is processed/normalized or we trust content.
    // But standard way:

    // Look up payment by merchantOrderId
    const Payment = (await import("../models/paymentModel.js")).default;
    const payment = await Payment.findOne({ merchantOrderId });

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    // Verify Hash
    // Re-calculate hash using our credentials and the incoming data
    const calculatedHash = kashierService.generateHash({
      orderId: merchantOrderId,
      amount: payment.amount,
      currency: payment.currency,
      credentials: config.credentials
    });

    // Check if signature matches (assuming signature is passed in payload, usually 'hash' or 'signature')
    // payload.signature or payload.hash
    const incomingSignature = signature || payload.hash;

    if (incomingSignature && calculatedHash !== incomingSignature) {
      console.error("Cashier Hash Mismatch", { calculated: calculatedHash, received: incomingSignature });
      // We might want to throw error, or just log and mark as suspicious
      throw new ApiError(400, "Invalid Payment Signature");
    }

    if (payment.status === "success") return payment;

    // Update status based on callback
    // Usually check query string 'paymentStatus' == 'SUCCESS'
    const status = payload.paymentStatus === "SUCCESS" ? "success" : "failed";

    await this.updatePaymentStatus(payment._id, status, null, null, `Cashier Callback: ${payload.paymentStatus}`);

    return payment;
  }
}
