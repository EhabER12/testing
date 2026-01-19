import mongoose from "mongoose";

const employeeRecordSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },

    // Performance Metrics
    metrics: {
      tasksCompleted: { type: Number, default: 0 },
      tasksAssigned: { type: Number, default: 0 },
      articlesCreated: { type: Number, default: 0 },
      reviewsApproved: { type: Number, default: 0 },
      submissionsProcessed: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "approved"],
      default: "pending",
    },

    adminNotes: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },

    // Attendance/Activity
    daysActive: { type: Number, default: 0 },
    totalLoginCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Unique constraint: one record per employee per month
employeeRecordSchema.index(
  { employeeId: 1, month: 1, year: 1 },
  { unique: true }
);

// Static method to get or create current month's record
employeeRecordSchema.statics.getOrCreateCurrent = async function (employeeId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let record = await this.findOne({ employeeId, month, year });

  if (!record) {
    record = await this.create({ employeeId, month, year });
  }

  return record;
};

// Static method to increment a metric
employeeRecordSchema.statics.incrementMetric = async function (
  employeeId,
  metricName,
  amount = 1
) {
  const record = await this.getOrCreateCurrent(employeeId);
  const updatePath = `metrics.${metricName}`;

  return this.findByIdAndUpdate(
    record._id,
    { $inc: { [updatePath]: amount } },
    { new: true }
  );
};

// Static method to get records for an employee
employeeRecordSchema.statics.getEmployeeRecords = async function (
  employeeId,
  limit = 12
) {
  return this.find({ employeeId })
    .sort({ year: -1, month: -1 })
    .limit(limit)
    .populate("reviewedBy", "name email");
};

// Static method to generate monthly records for all employees
employeeRecordSchema.statics.generateMonthlyRecords = async function () {
  const User = mongoose.model("User");
  const EmployeeTask = mongoose.model("EmployeeTask");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  // Find all moderators
  const employees = await User.find({ role: "moderator" });

  const results = [];

  for (const employee of employees) {
    // Check if record already exists
    let record = await this.findOne({ employeeId: employee._id, month, year });

    if (!record) {
      // Calculate metrics from tasks
      const tasksCompleted = await EmployeeTask.countDocuments({
        employeeId: employee._id,
        status: "completed",
        completedAt: { $gte: monthStart, $lte: monthEnd },
      });

      const tasksAssigned = await EmployeeTask.countDocuments({
        employeeId: employee._id,
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });

      record = await this.create({
        employeeId: employee._id,
        month,
        year,
        metrics: {
          tasksCompleted,
          tasksAssigned,
        },
        daysActive: 0, // This would need activity tracking to calculate
        totalLoginCount: employee.activityInfo?.loginCount || 0,
      });
    }

    results.push(record);
  }

  return results;
};

const EmployeeRecord = mongoose.model("EmployeeRecord", employeeRecordSchema);

export default EmployeeRecord;
