import express from "express";
import { Parser } from "json2csv";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  showDashboard,
  exportDashboard,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/", requireAuth, showDashboard);
router.get("/export", requireAuth, exportDashboard);

export default router;
