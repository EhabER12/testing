import mongoose from "mongoose";

const employeeTaskSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      ar: { type: String },
      en: { type: String },
    },
    description: {
      ar: { type: String },
      en: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
    weekStart: { type: Date }, // For weekly grouping
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: { type: String },
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

// Index for finding tasks by employee and week
employeeTaskSchema.index({ employeeId: 1, weekStart: 1 });
employeeTaskSchema.index({ employeeId: 1, status: 1 });
employeeTaskSchema.index({ employeeId: 1, dueDate: 1 });

// Static method to get week start date
employeeTaskSchema.statics.getWeekStart = function (date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Static method to get task statistics for an employee
employeeTaskSchema.statics.getStats = async function (employeeId) {
  const now = new Date();
  const weekStart = this.getWeekStart(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totals, thisWeek, thisMonth, overdue] = await Promise.all([
    // Total counts by status
    this.aggregate([
      { $match: { employeeId: new mongoose.Types.ObjectId(employeeId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // This week's tasks
    this.countDocuments({
      employeeId,
      weekStart: { $gte: weekStart },
    }),

    // This month's completed
    this.countDocuments({
      employeeId,
      status: "completed",
      completedAt: { $gte: monthStart },
    }),

    // Overdue tasks
    this.countDocuments({
      employeeId,
      status: { $in: ["pending", "in_progress"] },
      dueDate: { $lt: now },
    }),
  ]);

  const statusCounts = totals.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    total: {
      pending: statusCounts.pending || 0,
      in_progress: statusCounts.in_progress || 0,
      completed: statusCounts.completed || 0,
      cancelled: statusCounts.cancelled || 0,
    },
    thisWeek,
    thisMonthCompleted: thisMonth,
    overdue,
  };
};

const EmployeeTask = mongoose.model("EmployeeTask", employeeTaskSchema);

export default EmployeeTask;
