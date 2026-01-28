import StudentMember from "../models/studentMemberModel.js";
import User from "../models/userModel.js";
import { ApiError } from "../utils/apiError.js";
import { WhatsappNotificationService } from "./whatsappNotificationService.js";
import logger from "../utils/logger.js";
import { differenceInDays, addDays, parse as parseDate, isValid } from "date-fns";
import Package from "../models/packageModel.js";
import { parse } from 'csv-parse/sync';

export class StudentMemberService {
  constructor() {
    this.whatsappService = new WhatsappNotificationService();
  }

  // Import members from CSV
  async importMembers(fileBuffer, createdBy) {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = {
      total: records.length,
      success: 0,
      failed: 0,
      errors: []
    };

    const packages = await Package.find({});
    // Fetch all teachers for matching
    const teachers = await User.find({ role: 'teacher' });

    for (const [index, record] of records.entries()) {
      try {
        // Validation
        if (!record.name || !record.phone || !record.plan) {
          throw new Error('Missing required fields: name, phone, or plan');
        }

        // Find package (Case insensitive and trimmed)
        const normalize = (str) => str?.trim().toLowerCase() || "";
        const recordPlan = normalize(record.plan);

        const pkg = packages.find(p =>
          normalize(p.name?.ar) === recordPlan ||
          normalize(p.name?.en) === recordPlan
        );

        if (!pkg) {
          throw new Error(`Package not found: ${record.plan}`);
        }

        // Find teacher if provided
        let assignedTeacherId = null;
        let assignedTeacherName = null;
        
        if (record.teacher) {
          const teacherQuery = normalize(record.teacher);
          const teacher = teachers.find(t => {
            const nameAr = normalize(t.fullName?.ar);
            const nameEn = normalize(t.fullName?.en);
            const email = normalize(t.email);
            return nameAr === teacherQuery || nameEn === teacherQuery || email === teacherQuery;
          });
          
          if (teacher) {
            assignedTeacherId = teacher._id;
          } else {
            // Store as text if teacher not found in system
            assignedTeacherName = record.teacher;
          }
        }

        // Helper to parse date
        const parseDateValue = (dateStr) => {
          if (!dateStr) return new Date();

          // Try standard Date constructor first (YYYY-MM-DD)
          let date = new Date(dateStr);
          if (isValid(date)) return date;

          // Try DD/MM/YYYY or DD-MM-YYYY
          // Split by / or -
          const parts = dateStr.split(/[/-]/);
          if (parts.length === 3) {
            // Assume Day Month Year where Year is 4 digits
            let day, month, year;
            if (parts[0].length === 4) {
              // YYYY/MM/DD
              year = parseInt(parts[0]);
              month = parseInt(parts[1]) - 1;
              day = parseInt(parts[2]);
            } else {
              // DD/MM/YYYY
              day = parseInt(parts[0]);
              month = parseInt(parts[1]) - 1;
              year = parseInt(parts[2]);
            }
            date = new Date(year, month, day);
            if (isValid(date)) return date;
          }

          return new Date(); // Fallback to now
        };

        const startDate = parseDateValue(record['start time']);

        // Handle billingDay: usually 1-28. If they provided a date, extract the day.
        let billingDay = 1;
        if (record.billingDay) {
          const parsedBilling = parseInt(record.billingDay);
          // If it's a simple number like "5"
          if (!isNaN(parsedBilling) && parsedBilling >= 1 && parsedBilling <= 31) {
            billingDay = Math.min(parsedBilling, 28); // Cap at 28 for safety
          } else {
            // Maybe it's a date string
            const bDate = parseDateValue(record.billingDay);
            if (isValid(bDate)) {
              billingDay = Math.min(bDate.getDate(), 28);
            }
          }
        } else {
          billingDay = Math.min(startDate.getDate(), 28);
        }

        // Prepare data
        const memberData = {
          name: { ar: record.name, en: record.name },
          phone: record.phone,
          governorate: record.governorate || record.province || "", // Support both column names
          packageId: pkg._id,
          startDate: startDate,
          billingDay: billingDay,
          packagePrice: pkg.price
        };
        
        // Add teacher information if available
        if (assignedTeacherId) {
          memberData.assignedTeacherId = assignedTeacherId;
        }
        if (assignedTeacherName) {
          memberData.assignedTeacherName = assignedTeacherName;
        }

        // Create member
        await this.createMember(memberData, createdBy);
        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          row: index + 2, // 1-based index + header
          name: record.name,
          error: error.message
        });
      }
    }

    return results;
  }

  // Get all student members with filters
  async getAllMembers(filters = {}, options = {}) {
    const { status, assignedTeacherId, governorate, packageId, search } = filters;

    const query = {};

    if (status) query.status = status;
    if (assignedTeacherId) query.assignedTeacherId = assignedTeacherId;
    if (governorate) query.governorate = governorate;
    if (packageId) query.packageId = packageId;

    if (search) {
      query.$or = [
        { "name.ar": { $regex: search, $options: "i" } },
        { "name.en": { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const { page = 1, limit = 10, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const members = await StudentMember.find(query)
      .populate("assignedTeacherId", "fullName email")
      .populate("userId", "fullName email")
      .populate("packageId", "name type")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await StudentMember.countDocuments(query);

    return {
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get member by ID
  async getMemberById(memberId) {
    const member = await StudentMember.findById(memberId)
      .populate("assignedTeacherId", "name email phone")
      .populate("userId", "name email phone")
      .populate("renewalHistory.renewedBy", "name email")
      .populate("packageId", "name type description");

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    return member;
  }

  // Get subscriptions by user ID
  async getSubscriptionsByUserId(userId) {
    const subscriptions = await StudentMember.find({ userId })
      .populate("assignedTeacherId", "name email phone")
      .populate("packageId", "name type description")
      .sort("-createdAt");

    return subscriptions;
  }

  // Create new member
  async createMember(memberData, createdBy) {
    // Calculate next due date based on billing day
    const startDate = memberData.startDate || new Date();
    const billingDay = memberData.billingDay || startDate.getDate();

    const member = new StudentMember({
      ...memberData,
      startDate,
      billingDay,
      createdBy,
    });

    // Calculate next due date
    member.nextDueDate = member.calculateNextDueDate(startDate);

    await member.save();

    logger.info("Student member created", { memberId: member._id, createdBy });

    return member;
  }

  // Update member
  async updateMember(memberId, updateData, updatedBy) {
    const member = await StudentMember.findById(memberId);
    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    Object.assign(member, updateData);
    member.updatedBy = updatedBy;
    await member.save();

    logger.info("Student member updated", { memberId, updatedBy });

    return member;
  }

  // Delete member
  async deleteMember(memberId) {
    const member = await StudentMember.findById(memberId);
    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    await member.deleteOne();

    logger.info("Student member deleted", { memberId });

    return { message: "Member deleted successfully" };
  }

  // Renew subscription
  async renewSubscription(memberId, renewedBy, note = "") {
    const member = await StudentMember.findById(memberId);
    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    await member.renew(renewedBy, note);

    logger.info("Subscription renewed", { memberId, renewedBy });

    return member;
  }

  // Get members due for renewal reminder
  async getMembersDueForReminder(remindBeforeDays = 2) {
    const members = await StudentMember.findDueForReminder(remindBeforeDays);

    return members.map((member) => ({
      ...member.toObject(),
      daysLeft: member.daysLeft,
    }));
  }

  // Send WhatsApp reminder to a member
  async sendReminderToMember(memberId, messageTemplate) {
    const member = await StudentMember.findById(memberId).populate(
      "assignedTeacherId",
      "name"
    );

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    if (!member.phone) {
      throw new ApiError(400, "Member has no phone number");
    }

    // Build message from template
    const message = this.buildReminderMessage(member, messageTemplate);

    // Send WhatsApp message
    try {
      await this.whatsappService.sendMessage(member.phone, message);

      // Update reminder tracking
      member.lastReminderSent = new Date();
      member.reminderCount += 1;
      await member.save();

      logger.info("WhatsApp reminder sent", {
        memberId,
        phone: member.phone,
      });

      return {
        success: true,
        message: "Reminder sent successfully",
        phone: member.phone,
      };
    } catch (error) {
      logger.error("Failed to send WhatsApp reminder", {
        memberId,
        error: error.message,
      });
      throw new ApiError(500, "Failed to send WhatsApp message");
    }
  }

  // Send bulk reminders to all due members
  async sendBulkReminders(remindBeforeDays = 2, messageTemplate) {
    const members = await this.getMembersDueForReminder(remindBeforeDays);

    const results = [];

    for (const member of members) {
      try {
        const result = await this.sendReminderToMember(member.id, messageTemplate);
        results.push({
          memberId: member.id,
          name: member.name,
          phone: member.phone,
          success: true,
        });
      } catch (error) {
        results.push({
          memberId: member.id,
          name: member.name,
          phone: member.phone,
          success: false,
          error: error.message,
        });
      }
    }

    logger.info("Bulk reminders sent", {
      total: members.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });

    return results;
  }

  // Build reminder message from template
  buildReminderMessage(member, template) {
    if (!template) {
      // Default template
      template = `مرحباً {{name}}،

نذكرك بأن موعد تجديد اشتراكك في البرنامج سيكون في {{dueDate}}.

الأيام المتبقية: {{daysLeft}} يوم

يرجى التواصل معنا للتجديد.

شكراً لك 🌟`;
    }

    const dueDate = new Date(member.nextDueDate).toLocaleDateString("ar-SA");
    const daysLeft = member.daysLeft || 0;
    const teacherName = member.assignedTeacherId?.name || member.assignedTeacherName || "";

    return template
      .replace(/{{name}}/g, member.name.ar)
      .replace(/{{dueDate}}/g, dueDate)
      .replace(/{{daysLeft}}/g, daysLeft)
      .replace(/{{teacherName}}/g, teacherName)
      .replace(/{{phone}}/g, member.phone);
  }

  // Update all member statuses
  async updateAllStatuses(remindBeforeDays = 2) {
    const updatedCount = await StudentMember.updateAllStatuses(remindBeforeDays);

    logger.info("Member statuses updated", { updatedCount });

    return {
      message: "Statuses updated successfully",
      updatedCount,
    };
  }

  // Get statistics
  async getStatistics() {
    const [
      totalMembers,
      activeMembers,
      dueSoonMembers,
      overdueMembers,
      pausedMembers,
    ] = await Promise.all([
      StudentMember.countDocuments(),
      StudentMember.countDocuments({ status: "active" }),
      StudentMember.countDocuments({ status: "due_soon" }),
      StudentMember.countDocuments({ status: "overdue" }),
      StudentMember.countDocuments({ status: "paused" }),
    ]);

    // Get members by teacher
    const membersByTeacher = await StudentMember.aggregate([
      {
        $group: {
          _id: "$assignedTeacherId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "teacher",
        },
      },
      {
        $unwind: "$teacher",
      },
      {
        $project: {
          teacherId: "$_id",
          teacherName: "$teacher.name",
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return {
      total: totalMembers,
      byStatus: {
        active: activeMembers,
        dueSoon: dueSoonMembers,
        overdue: overdueMembers,
        paused: pausedMembers,
      },
      byTeacher: membersByTeacher,
    };
  }

  // Export members to CSV
  async exportMembersToCSV(filters = {}) {
    const { status, assignedTeacherId, governorate, packageId, search } = filters;

    const query = {};

    if (status) query.status = status;
    if (assignedTeacherId) query.assignedTeacherId = assignedTeacherId;
    if (governorate) query.governorate = governorate;
    if (packageId) query.packageId = packageId;

    if (search) {
      query.$or = [
        { "name.ar": { $regex: search, $options: "i" } },
        { "name.en": { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const members = await StudentMember.find(query)
      .populate("assignedTeacherId", "fullName email")
      .populate("userId", "fullName email")
      .populate("packageId", "name")
      .sort("-createdAt");

    // Build CSV content
    const headers = [
      "Name (AR)",
      "Name (EN)",
      "Phone",
      "Governorate",
      "Package",
      "Teacher",
      "Start Date",
      "Next Due Date",
      "Status",
      "Notes"
    ];

    const rows = members.map(member => {
      const teacherName = member.assignedTeacherId 
        ? (member.assignedTeacherId.fullName?.ar || member.assignedTeacherId.fullName?.en || member.assignedTeacherId.email || "")
        : (member.assignedTeacherName || "");

      const packageName = member.packageId 
        ? (member.packageId.name?.ar || member.packageId.name?.en || "")
        : "";

      return [
        member.name?.ar || "",
        member.name?.en || "",
        member.phone || "",
        member.governorate || "",
        packageName,
        teacherName,
        member.startDate ? new Date(member.startDate).toISOString().split('T')[0] : "",
        member.nextDueDate ? new Date(member.nextDueDate).toISOString().split('T')[0] : "",
        member.status || "",
        (member.notes || "").replace(/[\r\n]+/g, " ").replace(/"/g, '""')
      ];
    });

    // Escape CSV values
    const escapeCSV = (value) => {
      if (typeof value !== 'string') return value;
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV string
    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ];

    return csvLines.join('\n');
  }
}
