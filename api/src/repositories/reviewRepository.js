import { BaseRepository } from "./baseRepository.js";
import Review from "../models/reviewModel.js";

export class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
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

  async approve(id) {
    return this.update(id, { status: "approved" });
  }

  async reject(id, reason) {
    return this.update(id, {
      status: "rejected",
      rejectionReason: reason,
    });
  }
}
