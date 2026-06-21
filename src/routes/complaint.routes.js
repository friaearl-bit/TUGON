// src/routes/complaint.routes.js

import express from "express";
import {
  showForm,
  createComplaint,
  myComplaints,
  viewComplaint,
  updateComplaint,
  deleteComplaint,
  restoreComplaint,
  getStaffByDepartment,
  hardDeleteComplaint,
} from "../controllers/complaint.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { uploadAttachments } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/new", requireAuth, showForm);
router.post(
  "/new",
  requireAuth,
  uploadAttachments.array("attachments", 10),
  createComplaint,
);

router.get("/success", (req, res) => {
  res.render("complaints/success", {
    user: req.user, // IMPORTANT FOR EVERY PAGE
    referenceNo: req.query.ref || "N/A",
    email: req.user?.email || "N/A",
  });
});

router.get("/my", requireAuth, myComplaints);

// PARAM ROUTE LAST ALWAYS
router.get("/staff/by-department/:id", requireAuth, getStaffByDepartment);
router.get("/:id", requireAuth, viewComplaint);
router.post("/:id/update", requireAuth, updateComplaint);
router.get("/delete/:id", requireAuth, deleteComplaint);
router.get("/restore/:id", requireAuth, restoreComplaint);
router.get("/delete-forever/:id", requireAuth, hardDeleteComplaint);
// router.post("/:id/delete", requireAuth, deleteComplaint);

export default router;
