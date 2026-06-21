import express from "express";
import { addToast, addFlash } from "../utils/toast.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
  getReportsData,
  showReportsDashboard,
} from "../controllers/reports.controller.js";

const router = express.Router();

// router.use(addToast);
router.use(requireAuth);
router.use(requireRole(["ADMIN", "SUPERADMIN"]));

router.get("/", requireAuth, showReportsDashboard);
router.get("/data", requireAuth, getReportsData);

export default router;
