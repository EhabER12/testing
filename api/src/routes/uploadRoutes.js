import express from "express";
import fs from "fs";
import path from "path";
import { upload } from "../middlewares/uploadMiddleware.js";
import { asyncHandler } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/image",
  protect,
  authorize("admin", "moderator", "teacher"),
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FILE",
          message: "No image file provided",
        },
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    return ApiResponse.success(
      res,
      { url: imageUrl },
      "Image uploaded successfully"
    );
  })
);

router.get(
  "/gallery",
  protect,
  authorize("admin", "moderator"),
  asyncHandler(async (req, res) => {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
      const files = await fs.promises.readdir(uploadsDir);

      // Filter for images
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
      });

      // Get stats for sorting (newest first)
      const fileStats = await Promise.all(
        imageFiles.map(async (file) => {
          const filePath = path.join(uploadsDir, file);
          const stats = await fs.promises.stat(filePath);
          return {
            name: file,
            mtime: stats.mtime,
            url: `/uploads/${file}`,
          };
        })
      );

      // Sort by modification time (descending)
      fileStats.sort((a, b) => b.mtime - a.mtime);

      // Pagination
      const totalFiles = fileStats.length;
      const totalPages = Math.ceil(totalFiles / limit);
      const paginatedFiles = fileStats.slice(skip, skip + limit);

      return ApiResponse.success(
        res,
        {
          images: paginatedFiles.map((f) => ({ name: f.name, url: f.url })),
          pagination: {
            page,
            limit,
            totalFiles,
            totalPages,
            hasMore: page < totalPages,
          },
        },
        "Gallery images fetched"
      );
    } catch (error) {
      console.error("Error reading uploads directory:", error);
      return ApiResponse.success(
        res,
        { images: [], pagination: {} },
        "No images found"
      );
    }
  })
);

export default router;
