// src/routes/user.routes.js

import express from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
  listAuditLogs,
  exportAuditLogs,
} from "../controllers/admin.controller.js";

const router = express.Router();

// router.get("/edit/:id", requireAuth, updateProfile);
// router.post("/edit/:id", requireAuth, updateProfile);

router.get(
  "/logs",
  requireAuth,
  requireRole(["ADMIN", "SUPERADMIN"]),
  listAuditLogs,
);

router.get(
  "/logs/export",
  requireAuth,
  requireRole(["SUPERADMIN"]),
  exportAuditLogs,
);

// // Get single user for modal
// router.get("/:id", requireAuth, getUser);

// // Update user - SUPERADMIN only
// router.post("/:id", requireAuth, requireRole("SUPERADMIN"), updateUser);

// // Create user - SUPERADMIN only
// // router.post("/new", requireAuth, requireRole("SUPERADMIN"), createUser);

export default router;
