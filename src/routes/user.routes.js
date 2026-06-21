// src/routes/user.routes.js

import express from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
  listUsers,
  getUser,
  updateUser,
  // createUser,
  updateProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/edit/:id", requireAuth, updateProfile);
router.post("/edit/:id", requireAuth, updateProfile);

// router.get("/list", requireAuth, (req, res, next) => {
//   {
//     user: req.user;
//   }
// });

// List users - ADMIN and SUPERADMIN can view
router.get(
  "/list",
  requireAuth,
  requireRole(["ADMIN", "SUPERADMIN"]),
  listUsers,
);

// Get single user for modal
router.get("/:id", requireAuth, getUser);

// Update user - SUPERADMIN only
router.post("/:id", requireAuth, requireRole("SUPERADMIN"), updateUser);

// Create user - SUPERADMIN only
// router.post("/new", requireAuth, requireRole("SUPERADMIN"), createUser);

export default router;
