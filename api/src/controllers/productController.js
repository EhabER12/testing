import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import { ApiError } from "../utils/apiError.js";
import AnalyticsService from "../services/analyticsService.js";

export class ProductController {
  // Get all products (with filters)
  async getProducts(req, res, next) {
    try {
      const { category, featured, active, limit, page } = req.query;
      const isAdmin = req.user?.role === "admin";

      const query = {};

      // Filter by category
      if (category) {
        query.categoryId = category;
      }

      // Filter by featured
      if (featured === "true") {
        query.isFeatured = true;
      }

      // Filter by active status
      if (!isAdmin) {
        query.isActive = true;
      } else if (active !== undefined) {
        query.isActive = active === "true";
      }

      // Pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const skip = (pageNum - 1) * limitNum;

      const [products, total] = await Promise.all([
        Product.find(query)
          .sort({ order: 1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate("categoryId", "name"),
        Product.countDocuments(query),
      ]);

      // Map categoryId to category for frontend
      const mappedProducts = products.map((p) => ({
        ...p.toObject(),
        id: p._id,
        category: p.categoryId,
      }));

      res.status(200).json({
        success: true,
        products: mappedProducts,
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

  // Get featured products
  async getFeaturedProducts(req, res, next) {
    try {
      const products = await Product.find({ isActive: true, isFeatured: true })
        .sort({ order: 1 })
        .limit(8)
        .populate("categoryId", "name");

      const mappedProducts = products.map((p) => ({
        ...p.toObject(),
        id: p._id,
        category: p.categoryId,
      }));

      res.status(200).json({
        success: true,
        products: mappedProducts,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product by slug
  async getProductBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const isAdmin = req.user?.role === "admin";

      const query = { slug };
      if (!isAdmin) {
        query.isActive = true;
      }

      const product = await Product.findOne(query).populate(
        "categoryId",
        "name"
      );

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      res.status(200).json({
        success: true,
        product: {
          ...product.toObject(),
          id: product._id,
          category: product.categoryId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product by ID
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id).populate("categoryId", "name");

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      res.status(200).json({
        success: true,
        product: {
          ...product.toObject(),
          id: product._id,
          category: product.categoryId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Create product (admin)
  async createProduct(req, res, next) {
    try {
      const productData = req.body;

      // Parse JSON fields
      if (typeof productData.name === "string") {
        productData.name = JSON.parse(productData.name);
      }
      if (typeof productData.shortDescription === "string") {
        productData.shortDescription = JSON.parse(productData.shortDescription);
      }
      if (typeof productData.description === "string") {
        productData.description = JSON.parse(productData.description);
      }
      if (typeof productData.variants === "string") {
        productData.variants = JSON.parse(productData.variants);
      }
      if (typeof productData.addons === "string") {
        productData.addons = JSON.parse(productData.addons);
      }

      // Handle cover image upload
      if (req.files?.coverImage) {
        productData.coverImage = req.files.coverImage[0].path;
      }

      // Handle gallery uploads
      if (req.files?.gallery) {
        productData.gallery = req.files.gallery.map((file) => file.path);
      }

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      if (error.code === 11000) {
        return next(
          new ApiError(400, "A product with this slug already exists")
        );
      }
      next(error);
    }
  }

  // Update product (admin)
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Parse JSON fields
      if (typeof updateData.name === "string") {
        updateData.name = JSON.parse(updateData.name);
      }
      if (typeof updateData.shortDescription === "string") {
        updateData.shortDescription = JSON.parse(updateData.shortDescription);
      }
      if (typeof updateData.description === "string") {
        updateData.description = JSON.parse(updateData.description);
      }
      if (typeof updateData.variants === "string") {
        updateData.variants = JSON.parse(updateData.variants);
      }
      if (typeof updateData.addons === "string") {
        updateData.addons = JSON.parse(updateData.addons);
      }

      // Handle cover image upload
      if (req.files?.coverImage) {
        updateData.coverImage = req.files.coverImage[0].path;
      }

      // Handle gallery
      if (req.files?.gallery) {
        updateData.gallery = req.files.gallery.map((file) => file.path);
      }

      const product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      if (error.code === 11000) {
        return next(
          new ApiError(400, "A product with this slug already exists")
        );
      }
      next(error);
    }
  }

  // Delete product (admin)
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle product status (admin)
  async toggleProductStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive, isFeatured } = req.body;

      const updateData = {};
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

      const product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      res.status(200).json({
        success: true,
        message: "Product status updated successfully",
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Sync product analytics from GA4
  async syncAnalytics(req, res, next) {
    try {
      const result = await AnalyticsService.syncProductStats();
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
