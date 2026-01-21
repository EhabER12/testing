import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/apiError.js";

// Ensure upload directories exist
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Video storage configuration
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const lessonId = req.params.id || req.params.lessonId;
        const uploadPath = path.join("uploads", "videos", "lessons", lessonId);
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `video-${uniqueSuffix}${ext}`);
    },
});

// File filter for videos
const videoFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
        "video/x-flv",
    ];

    const allowedExtensions = [".mp4", ".mpeg", ".mov", ".avi", ".webm", ".flv"];

    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(
            new ApiError(
                400,
                `Invalid file type. Allowed formats: ${allowedExtensions.join(", ")}`
            ),
            false
        );
    }
};

// Video upload middleware
export const uploadVideo = multer({
    storage: videoStorage,
    fileFilter: videoFileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
    },
}).single("video");

// Error handling wrapper for multer
export const handleVideoUpload = (req, res, next) => {
    uploadVideo(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return next(new ApiError(400, "File size exceeds 500MB limit"));
            }
            return next(new ApiError(400, `Upload error: ${err.message}`));
        } else if (err) {
            return next(err);
        }
        next();
    });
};

// Delete video file helper
export const deleteVideoFile = (videoPath) => {
    try {
        if (videoPath && fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);

            // Try to delete empty parent directories
            const dir = path.dirname(videoPath);
            try {
                if (fs.readdirSync(dir).length === 0) {
                    fs.rmdirSync(dir);
                }
            } catch (e) {
                // Ignore errors when deleting directories
            }
        }
    } catch (error) {
        console.error("Error deleting video file:", error);
    }
};
