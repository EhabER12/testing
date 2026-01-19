import { BaseRepository } from "./baseRepository.js";
import Payment from "../models/paymentModel.js";

export class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findByUserId(userId, options = {}) {
    return this.findAll({
      ...options,
      filter: { userId },
    });
  }

  async findByProductId(productId, options = {}) {
    return this.findAll({
      ...options,
      filter: { productId },
    });
  }

  async findByServiceId(serviceId, options = {}) {
    return this.findAll({
      ...options,
      filter: { serviceId },
    });
  }

  async findByStatus(status, options = {}) {
    return this.findAll({
      ...options,
      filter: { status },
    });
  }

  async updateStatus(id, status, transactionId = null, paymentDetails = null) {
    const updateData = { status };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (paymentDetails) {
      updateData.paymentDetails = paymentDetails;
    }

    if (status === "success" || status === "failed") {
      updateData.processedAt = new Date();

      if (status === "failed" && paymentDetails?.transactionData) {
        updateData.failureReason =
          paymentDetails.transactionData.data?.message ||
          paymentDetails.transactionData.error?.message ||
          "Payment failed";
      }
    }

    return this.update(id, updateData);
  }

  async findByMerchantOrderId(merchantOrderId) {
    return this.findOne({
      "paymentDetails.merchantOrderId": merchantOrderId,
    });
  }
}
