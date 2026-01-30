import { BaseRepository } from "./baseRepository.js";
import User from "../models/userModel.js";

export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, includePassword = false) {
    const options = includePassword ? { select: "+password" } : {};
    return this.findOne({ email }, options);
  }

  async updateRole(id, role) {
    return this.update(id, { role });
  }

  async updateStatus(id, status) {
    return this.update(id, { status });
  }

  async search(query, options = {}) {
    const filter = {
      $or: [
        { "fullName.ar": { $regex: query, $options: "i" } },
        { "fullName.en": { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    };

    return this.findAll({ ...options, filter });
  }
}
