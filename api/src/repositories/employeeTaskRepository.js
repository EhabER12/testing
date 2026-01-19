import { BaseRepository } from "./baseRepository.js";
import EmployeeTask from "../models/employeeTaskModel.js";

export class EmployeeTaskRepository extends BaseRepository {
  constructor() {
    super(EmployeeTask);
  }

  async findByEmployeeId(employeeId, options = {}) {
    return this.findAll({
      ...options,
      filter: { ...options.filter, employeeId },
    });
  }

  async findByEmployeeAndWeek(employeeId, weekStart, options = {}) {
    return this.findAll({
      ...options,
      filter: { employeeId, weekStart: { $gte: weekStart } },
    });
  }

  async findByStatus(employeeId, status, options = {}) {
    return this.findAll({
      ...options,
      filter: { employeeId, status },
    });
  }

  async getStats(employeeId) {
    return EmployeeTask.getStats(employeeId);
  }

  async updateStatus(taskId, status) {
    const updateData = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }
    return this.update(taskId, updateData);
  }
}
