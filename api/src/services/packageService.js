import Package from "../models/packageModel.js";
import StudentMember from "../models/studentMemberModel.js";
import { NotFoundError, ValidationError } from "../utils/apiError.js";

class PackageService {
  // Create package
  async createPackage(data, createdBy) {
    const packageData = {
      ...data,
      createdBy,
    };

    const newPackage = await Package.create(packageData);
    return newPackage;
  }

  // Get all packages
  async getAllPackages(filters = {}) {
    const query = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const packages = await Package.find(query)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .sort({ displayOrder: 1, createdAt: -1 });

    // Add enrolled count from StudentMember
    const packagesWithStats = await Promise.all(
      packages.map(async (pkg) => {
        const enrolled = await StudentMember.countDocuments({
          packageId: pkg._id,
          status: { $in: ["active", "due_soon"] },
        });

        const total = await StudentMember.countDocuments({
          packageId: pkg._id,
        });

        return {
          ...pkg.toJSON(),
          stats: {
            ...pkg.stats,
            enrolledCount: enrolled,
            totalCount: total,
          },
        };
      })
    );

    return packagesWithStats;
  }

  // Get package by ID
  async getPackageById(packageId) {
    const pkg = await Package.findById(packageId)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email");

    if (!pkg) {
      throw new NotFoundError("Package");
    }

    // Get enrolled students
    const enrolledCount = await StudentMember.countDocuments({
      packageId: pkg._id,
      status: { $in: ["active", "due_soon"] },
    });

    const totalCount = await StudentMember.countDocuments({
      packageId: pkg._id,
    });

    return {
      ...pkg.toJSON(),
      stats: {
        ...pkg.stats,
        enrolledCount,
        totalCount,
      },
    };
  }

  // Update package
  async updatePackage(packageId, updates, updatedBy) {
    const pkg = await Package.findById(packageId);

    if (!pkg) {
      throw new NotFoundError("Package");
    }

    Object.keys(updates).forEach((key) => {
      pkg[key] = updates[key];
    });

    pkg.updatedBy = updatedBy;
    await pkg.save();

    return pkg;
  }

  // Delete package
  async deletePackage(packageId) {
    const pkg = await Package.findById(packageId);

    if (!pkg) {
      throw new NotFoundError("Package");
    }

    // Check if any students are enrolled
    const enrolledCount = await StudentMember.countDocuments({
      packageId: pkg._id,
      status: { $in: ["active", "due_soon", "overdue"] },
    });

    if (enrolledCount > 0) {
      throw new ValidationError(
        `Cannot delete package. ${enrolledCount} student(s) are still enrolled.`
      );
    }

    await Package.deleteOne({ _id: pkg._id });
    return { message: "Package deleted successfully" };
  }

  // Get package statistics
  async getPackageStats(packageId) {
    const pkg = await Package.findById(packageId);

    if (!pkg) {
      throw new NotFoundError("Package");
    }

    // Get students by status
    const activeCount = await StudentMember.countDocuments({
      packageId: pkg._id,
      status: "active",
    });

    const dueSoonCount = await StudentMember.countDocuments({
      packageId: pkg._id,
      status: "due_soon",
    });

    const overdueCount = await StudentMember.countDocuments({
      packageId: pkg._id,
      status: "overdue",
    });

    const pausedCount = await StudentMember.countDocuments({
      packageId: pkg._id,
      status: "paused",
    });

    const totalRevenue = pkg.price * (activeCount + dueSoonCount);

    return {
      packageId: pkg._id,
      packageName: pkg.name,
      price: pkg.price,
      stats: {
        active: activeCount,
        dueSoon: dueSoonCount,
        overdue: overdueCount,
        paused: pausedCount,
        total: activeCount + dueSoonCount + overdueCount + pausedCount,
        revenue: totalRevenue,
      },
    };
  }

  // Get students enrolled in a package
  async getPackageStudents(packageId, filters = {}) {
    const query = { packageId };

    if (filters.status) {
      query.status = filters.status;
    }

    const students = await StudentMember.find(query)
      .populate("assignedTeacherId", "fullName email")
      .sort({ createdAt: -1 });

    return students;
  }
}

export default new PackageService();
