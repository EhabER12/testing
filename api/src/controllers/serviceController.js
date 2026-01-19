import Service from "../models/serviceModel.js";
import { ApiError } from "../utils/apiError.js";
import AnalyticsService from "../services/analyticsService.js";

export class ServiceController {
  // Get all services (public - active only, admin - all)
  async getServices(req, res, next) {
    try {
      const { category, featured, active, limit, page } = req.query;
      const isAdmin = req.user?.role === "admin";

      const query = {};

      // Filter by category
      if (category) {
        query.category = category;
      }

      // Filter by featured
      if (featured === "true") {
        query.isFeatured = true;
      }

      // Filter by active status (public always sees active only)
      if (!isAdmin) {
        query.isActive = true;
      } else if (active !== undefined) {
        query.isActive = active === "true";
      }

      // Pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const skip = (pageNum - 1) * limitNum;

      const [services, total] = await Promise.all([
        Service.find(query)
          .sort({ order: 1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate("relatedServices", "title slug icon category"),
        Service.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        services,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get featured services for landing page
  async getFeaturedServices(req, res, next) {
    try {
      const services = await Service.find({ isActive: true, isFeatured: true })
        .sort({ order: 1 })
        .limit(6);

      res.status(200).json({
        success: true,
        services,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single service by slug
  async getServiceBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const isAdmin = req.user?.role === "admin";

      const query = { slug };
      if (!isAdmin) {
        query.isActive = true;
      }

      const service = await Service.findOne(query).populate(
        "relatedServices",
        "title slug icon category shortDescription coverImage"
      );

      if (!service) {
        throw new ApiError(404, "Service not found");
      }

      res.status(200).json({
        success: true,
        service,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single service by ID (admin)
  async getServiceById(req, res, next) {
    try {
      const { id } = req.params;

      const service = await Service.findById(id).populate(
        "relatedServices",
        "title slug icon category"
      );

      if (!service) {
        throw new ApiError(404, "Service not found");
      }

      res.status(200).json({
        success: true,
        service,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create service (admin)
  async createService(req, res, next) {
    try {
      const serviceData = req.body;

      // Handle cover image upload
      if (req.files?.coverImage) {
        serviceData.coverImage = req.files.coverImage[0].path;
      }

      // Handle gallery uploads
      if (req.files?.gallery) {
        serviceData.gallery = req.files.gallery.map((file) => ({
          url: file.path,
          alt: { ar: "", en: "" },
        }));
      }

      const service = await Service.create(serviceData);

      res.status(201).json({
        success: true,
        message: "Service created successfully",
        service,
      });
    } catch (error) {
      if (error.code === 11000) {
        return next(
          new ApiError(400, "A service with this slug already exists")
        );
      }
      next(error);
    }
  }

  // Update service (admin)
  async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Handle cover image upload
      if (req.files?.coverImage) {
        updateData.coverImage = req.files.coverImage[0].path;
      }

      // Handle gallery - combine existing (kept) images with new uploads
      let finalGallery = [];

      // Parse existingGallery from form data (images user chose to keep)
      if (updateData.existingGallery) {
        try {
          finalGallery = JSON.parse(updateData.existingGallery);
          delete updateData.existingGallery;
        } catch (e) {
          finalGallery = [];
        }
      }

      // Add new gallery uploads
      if (req.files?.gallery) {
        const newGalleryItems = req.files.gallery.map((file) => ({
          url: file.path,
          alt: { ar: "", en: "" },
        }));
        finalGallery = [...finalGallery, ...newGalleryItems];
      }

      // Only update gallery if there are changes
      if (
        finalGallery.length > 0 ||
        req.files?.gallery ||
        updateData.existingGallery
      ) {
        updateData.gallery = finalGallery;
      }

      const service = await Service.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!service) {
        throw new ApiError(404, "Service not found");
      }

      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        service,
      });
    } catch (error) {
      if (error.code === 11000) {
        return next(
          new ApiError(400, "A service with this slug already exists")
        );
      }
      next(error);
    }
  }

  // Delete service (admin)
  async deleteService(req, res, next) {
    try {
      const { id } = req.params;

      const service = await Service.findByIdAndDelete(id);

      if (!service) {
        throw new ApiError(404, "Service not found");
      }

      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle service status (admin)
  async toggleServiceStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive, isFeatured } = req.body;

      const updateData = {};
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

      const service = await Service.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!service) {
        throw new ApiError(404, "Service not found");
      }

      res.status(200).json({
        success: true,
        message: "Service status updated successfully",
        service,
      });
    } catch (error) {
      next(error);
    }
  }

  // Reorder services (admin)
  async reorderServices(req, res, next) {
    try {
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds)) {
        throw new ApiError(400, "orderedIds must be an array");
      }

      const bulkOps = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { order: index },
        },
      }));

      await Service.bulkWrite(bulkOps);

      res.status(200).json({
        success: true,
        message: "Services reordered successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove gallery image (admin)
  async removeGalleryImage(req, res, next) {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      const service = await Service.findById(id);

      if (!service) {
        throw new ApiError(404, "Service not found");
      }

      service.gallery = service.gallery.filter((img) => img.url !== imageUrl);
      await service.save();

      res.status(200).json({
        success: true,
        message: "Gallery image removed successfully",
        service,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get service categories with counts
  async getCategories(req, res, next) {
    try {
      const categories = await Service.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      res.status(200).json({
        success: true,
        categories: categories.map((c) => ({
          category: c._id,
          count: c.count,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Sync service analytics from GA4
  async syncAnalytics(req, res, next) {
    try {
      const result = await AnalyticsService.syncServiceStats();
      res.status(200).json({
        success: true,
        message: "Analytics sync completed",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
