import Category from "../models/categoryModel.js";
import { ApiError } from "../utils/apiError.js";
import path from "path";

export class CategoryController {
  // Get all categories
  async getCategories(req, res, next) {
    try {
      const { active } = req.query;
      const isAdmin = req.user?.role === "admin";

      const query = {};

      // Filter by active status
      if (!isAdmin) {
        query.isActive = true;
      } else if (active !== undefined) {
        query.isActive = active === "true";
      }

      const categories = await Category.find(query)
        .sort({ order: 1, createdAt: -1 })
        .populate("productCount")
        .populate("courseCount");

      res.status(200).json({
        success: true,
        categories,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get category by ID
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);

      if (!category) {
        throw new ApiError(404, "Category not found");
      }

      res.status(200).json({
        success: true,
        category,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create category (admin)
  async createCategory(req, res, next) {
    try {
      const categoryData = req.body;

      // Parse JSON fields safely
      if (typeof categoryData.name === "string") {
        try {
          categoryData.name = JSON.parse(categoryData.name);
        } catch (e) {
          throw new ApiError(400, "Invalid name format - must be valid JSON");
        }
      }
      if (typeof categoryData.description === "string") {
        try {
          categoryData.description = JSON.parse(categoryData.description);
        } catch (e) {
          throw new ApiError(
            400,
            "Invalid description format - must be valid JSON"
          );
        }
      }

      // Validate that at least one language is provided for name
      if (!categoryData.name?.ar && !categoryData.name?.en) {
        throw new ApiError(
          400,
          "At least one language (ar or en) is required for name"
        );
      }

      // Ensure both ar and en exist (set empty string if not provided)
      categoryData.name = {
        ar: categoryData.name?.ar || categoryData.name?.en || "",
        en: categoryData.name?.en || categoryData.name?.ar || "",
      };
      categoryData.description = {
        ar: categoryData.description?.ar || "",
        en: categoryData.description?.en || "",
      };

      // Handle image upload - store relative URL path, not absolute file path
      if (req.files?.image) {
        const filename = path.basename(req.files.image[0].path);
        categoryData.image = `/uploads/${filename}`;
      }

      const category = await Category.create(categoryData);

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update category (admin)
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Parse JSON fields safely
      if (typeof updateData.name === "string") {
        try {
          updateData.name = JSON.parse(updateData.name);
        } catch (e) {
          throw new ApiError(400, "Invalid name format - must be valid JSON");
        }
      }
      if (typeof updateData.description === "string") {
        try {
          updateData.description = JSON.parse(updateData.description);
        } catch (e) {
          throw new ApiError(
            400,
            "Invalid description format - must be valid JSON"
          );
        }
      }

      // If name is being updated, validate at least one language is provided
      if (updateData.name && !updateData.name?.ar && !updateData.name?.en) {
        throw new ApiError(
          400,
          "At least one language (ar or en) is required for name"
        );
      }

      // Normalize name and description if provided
      if (updateData.name) {
        updateData.name = {
          ar: updateData.name?.ar || updateData.name?.en || "",
          en: updateData.name?.en || updateData.name?.ar || "",
        };
      }
      if (updateData.description) {
        updateData.description = {
          ar: updateData.description?.ar || "",
          en: updateData.description?.en || "",
        };
      }

      // Handle image upload - store relative URL path, not absolute file path
      if (req.files?.image) {
        const filename = path.basename(req.files.image[0].path);
        updateData.image = `/uploads/${filename}`;
      }

      const category = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!category) {
        throw new ApiError(404, "Category not found");
      }

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete category (admin)
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const category = await Category.findByIdAndDelete(id);

      if (!category) {
        throw new ApiError(404, "Category not found");
      }

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle category status (admin)
  async toggleCategoryStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const category = await Category.findByIdAndUpdate(
        id,
        { isActive },
        { new: true }
      );

      if (!category) {
        throw new ApiError(404, "Category not found");
      }

      res.status(200).json({
        success: true,
        message: "Category status updated successfully",
        category,
      });
    } catch (error) {
      next(error);
    }
  }
}
