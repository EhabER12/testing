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
        // {
        //   path: "productId",
        //   select: "name slug basePrice",
        // },
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
          },
          "ar"
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
        // ... (existing course enrollment logic) ...
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

  buildBillingData(billingInfo) {
    const nameParts = billingInfo.name
      ? billingInfo.name.split(" ")
      : ["User", "Name"];
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "Name";

    return {
      apartment: billingInfo.apartment || "NA",
      email: billingInfo.email || "customer@example.com",
      floor: billingInfo.floor || "NA",
      first_name: firstName,
      street: billingInfo.street || billingInfo.address || "NA",
      building: billingInfo.building || "NA",
      phone_number: billingInfo.phone || "+201000000000",
      shipping_method: "NA",
      postal_code: billingInfo.postalCode || "00000",
      city: billingInfo.city || "Cairo",
      country: "EG",
      last_name: lastName,
      state: billingInfo.state || "NA",
    };
  }

  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
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
      // Auto-create user for guest checkout
      let linkedUserId = userId;

      if (!userId && billingInfo?.email) {
        // Check if user already exists
        let existingUser = await User.findOne({
          email: billingInfo.email.toLowerCase(),
        });

        if (existingUser) {
          // Link payment to existing user
          linkedUserId = existingUser._id;
        } else {
          // Create new user with "pending" status (different from admin "invited")
          const crypto = await import("crypto");
          const verificationToken = crypto.randomBytes(32).toString("hex");
          const hashedToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

          const newUser = new User({
            name: billingInfo.name || "Customer",
            email: billingInfo.email.toLowerCase(),
            phone: billingInfo.phone || "",
            role: "user",
            status: "invited", // Will need to complete registration
            verificationToken: hashedToken,
            verificationTokenExpire: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days for customers
          });

          await newUser.save();
          linkedUserId = newUser._id;

          // Send professional Genoun-branded email using template
          const clientUrl =
            process.env.NEXT_PUBLIC_WEBSITE_URL ||
            process.env.CLIENT_URL ||
            "https://genoun.com";
          const registrationLink = `${clientUrl}/complete-registration?token=${verificationToken}`;

          try {
            await emailTemplateService.sendTemplatedEmail(
              billingInfo.email,
              "registration",
              {
                name: billingInfo.name || "Customer",
                loginUrl: registrationLink,
                year: new Date().getFullYear(),
              },
              "ar"
            );
          } catch (emailError) {
            console.error("Failed to send registration email using template:", emailError);
            // Continue - don't fail payment due to email issues
          }
        }
      }

      // Get manual payment method from settings
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

      // Check if payment proof is required
      if (manualMethod.requiresAttachment && !paymentProofUrl) {
        throw new ApiError(400, "Payment proof is required for this method");
      }

      // Generate merchant order ID with method name
      // Handle bilingual title (could be string or {ar, en} object)
      const titleString =
        typeof manualMethod.title === "object"
          ? manualMethod.title.en || manualMethod.title.ar || "Manual"
          : manualMethod.title || "Manual";
      const methodName = titleString.replace(/\s+/g, "-").toUpperCase();
      const merchantOrderId = `${methodName}-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;

      // Create payment data
      const paymentData = {
        userId: linkedUserId, // Now linked to user (new or existing)
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

      // Mark cart session as converted if we have a cart session ID
      // cartSessionId from frontend is the sessionId string (UUID), not MongoDB _id
      if (cartSessionId) {
        try {
          // Look up cart session by sessionId field
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

          // Update payment with the actual cart session ObjectId
          if (cartSession) {
            await this.paymentRepository.update(payment._id, {
              cartSessionId: cartSession._id,
            });
          }
        } catch (cartError) {
          console.error("Failed to mark cart session as converted:", cartError);
          // Don't fail payment due to cart session update failure
        }
      }

      // Send order confirmation email using template
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
            },
            "ar"
          );
          logger.info("Order confirmation email sent using template", { email: billingInfo.email });
        } catch (emailError) {
          logger.error("Failed to send order confirmation email using template", { error: emailError.message });
          // Continue - don't fail payment due to email issues
        }
      }

      return payment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create admin manual payment (admin creating payment for a customer)
   * @param {Object} data Payment data
   * @returns {Promise<Object>} Created payment
   */
  async createAdminManualPayment(data) {
    try {
      const {
        adminId,
        productId,
        serviceId,
        amount,
        currency,
        billingInfo,
        notes,
      } = data;

      // Verify product/service exists
      if (productId) {
        const product = await Product.findById(productId);
        if (!product) {
          throw new ApiError(404, "Product not found");
        }
        if (!product.isActive) {
          throw new ApiError(400, "Product is not active");
        }
      }

      if (serviceId) {
        const service = await Service.findById(serviceId);
        if (!service) {
          throw new ApiError(404, "Service not found");
        }
        if (!service.isActive) {
          throw new ApiError(400, "Service is not active");
        }
      }

      // Generate unique merchant order ID
      const merchantOrderId = `ADMIN-MANUAL-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;

      // Create payment data
      const paymentData = {
        userId: adminId, // The admin who created it
        productId,
        serviceId,
        amount,
        currency: currency || "EGP",
        status: "pending", // Admin can manually update to completed later
        paymentMethod: "Manual (Admin Recorded)", // Clear indication this is admin-created
        merchantOrderId,
        billingInfo,
        paymentDetails: {
          methodType: "admin_manual_payment",
          createdBy: adminId,
          notes: notes || "",
          description: "Payment recorded by administrator",
        },
      };

      const payment = await this.paymentRepository.create(paymentData);

      return payment;
    } catch (error) {
      throw error;
    }
  }

  async getRevenueStatistics() {
    try {
      const successfulPaymentsData = await this.paymentRepository.findAll({
        filter: { status: "success" },
        limit: 10000,
        page: 1,
      });

      const successfulPayments = successfulPaymentsData.results || [];

      const totalRevenue = successfulPayments.reduce(
        (acc, payment) => acc + (payment.amount || 0),
        0
      );

      const totalPayments = successfulPayments.length;

      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      const monthlyPayments = successfulPayments.filter((payment) => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= firstDayOfMonth;
      });

      const monthlyRevenue = monthlyPayments.reduce(
        (acc, payment) => acc + (payment.amount || 0),
        0
      );

      return {
        totalRevenue,
        totalPayments,
        monthlyRevenue,
        monthlyPayments: monthlyPayments.length,
      };
    } catch (error) {
      throw error;
    }
  }

  async cancelPayment(paymentId, userId) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (payment.userId && payment.userId.toString() !== userId.toString()) {
      throw new ApiError(403, "Not authorized to cancel this payment");
    }

    if (payment.status !== "pending") {
      throw new ApiError(400, "Only pending payments can be cancelled");
    }

    return this.paymentRepository.updateStatus(paymentId, "cancelled", null, {
      ...payment.paymentDetails,
      cancelledAt: new Date(),
      cancelledBy: "user",
    });
  }
}
