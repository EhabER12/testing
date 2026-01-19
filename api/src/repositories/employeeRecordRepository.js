import { BaseRepository } from "./baseRepository.js";
import EmployeeRecord from "../models/employeeRecordModel.js";

export class EmployeeRecordRepository extends BaseRepository {
  constructor() {
    super(EmployeeRecord);
  }

  async findByEmployeeId(employeeId, options = {}) {
    return this.findAll({
      ...options,
      filter: { ...options.filter, employeeId },
      sort: { year: -1, month: -1 },
    });
  }

  async findByEmployeeAndMonth(employeeId, year, month) {
    return this.findOne({ employeeId, year, month });
  }

  async getOrCreateCurrent(employeeId) {
    return EmployeeRecord.getOrCreateCurrent(employeeId);
  }

  async incrementMetric(employeeId, metricName, amount = 1) {
    return EmployeeRecord.incrementMetric(employeeId, metricName, amount);
  }

  async getEmployeeRecords(employeeId, limit = 12) {
    return EmployeeRecord.getEmployeeRecords(employeeId, limit);
  }

  async generateMonthlyRecords() {
    return EmployeeRecord.generateMonthlyRecords();
  }

  async updateRecord(recordId, updateData) {
    return this.update(recordId, updateData);
  }
}
