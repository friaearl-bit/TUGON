// middleware/upload.middleware.js

import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "video/mp4",
]);

function fileFilter(req, file, cb) {
  const isValidMime = allowedMimeTypes.has(file.mimetype);

  const allowedExt = [".jpg", ".jpeg", ".png", ".pdf", ".mp4"];
  const ext = path.extname(file.originalname).toLowerCase();

  const isValidExt = allowedExt.includes(ext);

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.originalname}`), false);
  }
}

export const uploadAttachments = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
});
