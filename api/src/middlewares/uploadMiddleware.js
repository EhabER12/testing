import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../utils/apiError.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|avif)$/i)) {
    return cb(new ApiError(400, "Only image files are allowed!"), false);
  }
  cb(null, true);
};

// File filter for images and PDFs (for trips)
const mixedFileFilter = (req, file, cb) => {
  // Accept images and PDFs
  // If fieldname is tripFile, allow PDF
  if (file.fieldname === "tripFile") {
    if (!file.originalname.match(/\.(pdf)$/i)) {
      return cb(
        new ApiError(400, "Only PDF files are allowed for trip documents!"),
        false
      );
    }
  } else {
    // For other fields, accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|avif)$/i)) {
      return cb(new ApiError(400, "Only image files are allowed!"), false);
    }
  }
  cb(null, true);
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: imageFileFilter,
});

// Upload handler for trip forms (accepts images + PDFs)
export const uploadTripFiles = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: mixedFileFilter,
}).any();

export const uploadSingle = (fieldName) => upload.single(fieldName);

export const uploadMultiple = (fieldName, maxCount) =>
  upload.array(fieldName, maxCount);

// File filter for form attachments (images, PDF, DOC, DOCX, TXT)
const attachmentFileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|gif|svg|webp|pdf|doc|docx|txt)$/i;
  if (!file.originalname.match(allowedExtensions)) {
    return cb(
      new ApiError(
        400,
        "Only images, PDF, DOC, DOCX, and TXT files are allowed!"
      ),
      false
    );
  }
  cb(null, true);
};

export const uploadFormAttachments = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: attachmentFileFilter,
}).any();

export const ensureUploadDirectories = (req, res, next) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    next();
  } catch (error) {
    console.error("Error ensuring upload directory exists:", error);
    next(new ApiError(500, "Could not create upload directory"));
  }
};
