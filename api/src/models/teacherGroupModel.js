import mongoose from "mongoose";

const teacherGroupSchema = new mongoose.Schema(
  {
    // Teacher Type (course user vs subscription teacher)
    teacherType: {
      type: String,
      enum: ["course", "subscription"],
      default: "course",
      required: true,
      index: true,
    },

    // Teacher Reference (course teachers)
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.teacherType !== "subscription";
      },
      index: true,
    },

    // Subscription Teacher Reference (settings.subscriptionTeachers subdoc id)
    subscriptionTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    // Group Name (optional, for organized groups)
    groupName: {
      ar: { type: String },
      en: { type: String },
    },

    // Students in this group/teacher
    students: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "StudentMember",
          required: true,
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["active", "inactive", "completed"],
          default: "active",
        },
      },
    ],

    // Group Type
    groupType: {
      type: String,
      enum: ["individual", "group"],
      default: "individual",
      required: true,
    },

    // Pricing Configuration
    pricing: {
      individualRate: {
        type: Number,
        default: 0,
        min: [0, "Individual rate cannot be negative"],
      },
      groupRate: {
        type: Number,
        default: 0,
        min: [0, "Group rate cannot be negative"],
      },
      studentsPerIndividual: {
        type: Number,
        default: 12,
        min: [1, "Students per individual must be at least 1"],
        validate: {
          validator: Number.isInteger,
          message: "Students per individual must be an integer",
        },
      },
      currency: {
        type: String,
        enum: ["EGP", "SAR", "USD"],
        default: "EGP",
      },
    },

    // Teacher Permissions
    permissions: {
      canUploadCourses: {
        type: Boolean,
        default: false,
      },
      canPublishDirectly: {
        type: Boolean,
        default: false,
      },
    },

    // Statistics (auto-calculated)
    stats: {
      totalStudents: {
        type: Number,
        default: 0,
      },
      activeStudents: {
        type: Number,
        default: 0,
      },
      completedStudents: {
        type: Number,
        default: 0,
      },
      coursesCreated: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
    },

    // Schedule (optional)
    schedule: [
      {
        day: {
          type: String,
          enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        },
        startTime: String,
        endTime: String,
      },
    ],

    // Notes
    notes: {
      type: String,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual: Calculate expected revenue
teacherGroupSchema.virtual("expectedRevenue").get(function () {
  const activeCount = this.students.filter((s) => s.status === "active").length;

  if (this.groupType === "group") {
    return this.pricing.groupRate;
  } else {
    // Individual: calculate based on number of students and rate per X students
    const studentsPerRate = this.pricing.studentsPerIndividual || 12;
    const individualRate = this.pricing.individualRate || 0;
    return Math.ceil(activeCount / studentsPerRate) * individualRate;
  }
});

// Indexes for faster queries
teacherGroupSchema.index({ teacherId: 1, isActive: 1 });
teacherGroupSchema.index({ "students.studentId": 1 });
teacherGroupSchema.index({ groupType: 1 });
teacherGroupSchema.index({ teacherId: 1, groupType: 1, isActive: 1 });
teacherGroupSchema.index({ subscriptionTeacherId: 1, teacherType: 1, isActive: 1 });

// Update statistics before saving
teacherGroupSchema.pre("save", function (next) {
  this.stats.totalStudents = this.students.length;
  this.stats.activeStudents = this.students.filter((s) => s.status === "active").length;
  this.stats.completedStudents = this.students.filter((s) => s.status === "completed").length;
  next();
});

const TeacherGroup = mongoose.model("TeacherGroup", teacherGroupSchema);
export default TeacherGroup;
