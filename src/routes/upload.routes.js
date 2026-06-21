import express from "express";
import multer from "multer";
import { prisma } from "../config/prisma.js";
import {
  UPLOAD_DEST,
  MAX_FILES,
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
} from "../config/constants.js";

const router = express.Router();

// Multer config with validation
const upload = multer({
  dest: UPLOAD_DEST,
  limits: { files: MAX_FILES, fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_TYPES.includes(file.mimetype));
  },
});

// POST /upload
router.post("/", upload.array("attachments", MAX_FILES), async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const attachments = await Promise.all(
      req.files.map((file) =>
        prisma.complaintAttachment.create({
          data: {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
          },
        }),
      ),
    );

    res.json({ success: true, attachments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
