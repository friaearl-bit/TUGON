// src/controllers/complaint.controller.js

import { prisma } from "../config/prisma.js";
import { generateReferenceNo } from "../utils/ref.js";
import { logger } from "../utils/logger.js";
import { SYSTEM_MESSAGES } from "../config/messages.js";
import { addToast, addFlash } from "../utils/toast.js";
import { notify } from "../services/notification.service.js";
import {
  ComplaintCategory,
  MAX_COMPLAINTS,
  MAX_DESCRIPTION_LENGTH,
} from "../config/constants.js";
import { ComplaintStatus, ComplaintPriority } from "@prisma/client";

import {
  notifyComplaintCreated,
  notifyComplaintAssignment,
  notifyComplaintStatusChange,
  notifyComplaintPriorityChange,
  notifyComplaintResolved,
  notifyComplaintRejected,
} from "../services/complaint.notify.js";

const TRANSITIONS = {
  PENDING: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  REJECTED: [],
  CLOSED: [],
};

function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to);
}

export async function showForm(req, res) {
  console.log(req.body);
  console.log(req.files);
  logger.debug({ userId: req.user?.id }, "Showing complaint form");
  res.render("complaints/new", { user: req.user });
}

export async function createComplaint(req, res) {
  try {
    console.log("BODY: ", req.body);
    console.log("FILES: ", req.fies);
    logger.debug(
      {
        userId: req.user?.id,
        body: req.body,
        file: req.file,
        files: req.files,
      },
      "Complaint submission received",
    );

    const {
      category,
      subject,
      description,
      barangay,
      subdivisionVillage,
      streetName,
      buildingFloor,
      priority,
      emailAddress,
      contactNo,
      caseId,
    } = req.body;

    // VALIDATION
    const errors = [];

    if (!category) errors.push("Category is required");
    if (!subject) errors.push("Subject is required");
    if (!description) errors.push("Description is required");
    if (!priority) errors.push("Priority is required");
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(
        `Description must be under ${MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    const activeCount = await prisma.complaint.count({
      where: {
        createdById: req.user.id,
        status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
      },
    });
    if (activeCount >= MAX_COMPLAINTS) {
      errors.push(`Maximum ${MAX_COMPLAINTS} active complaints allowed`);
    }

    if (errors.length > 0) {
      logger.warn({ userId: req.user?.id, errors }, "Validation failed");

      addToast(req, res, {
        type: "error",
        title: "Validation Error",
        message: errors.join("\n"),
      });

      return res.redirect("/complaints/new");
    }

    // PROCESS COMPLAINT
    const complaint = await prisma.complaint.create({
      data: {
        referenceNo: generateReferenceNo(),
        title: subject,
        category,
        subject,
        description,
        barangay,
        subdivisionVillage,
        streetName,
        buildingFloor,
        priority,
        createdById: req.user.id,
        complainantId: req.user.id,
      },
    });

    // UPLOAD ATTACHMENTS
    logger.info(
      {
        hasPrisma: !!prisma,
        hasComplaintAttachment: !!prisma?.complaintAttachment,
        filesCount: req.files?.length ?? 0,
      },
      "debug before createMany",
    );
    console.log(
      "prisma?",
      !!prisma,
      "complaintAttachment?",
      !!prisma?.complaintAttachment,
    );
    console.log("Has attachments?", "attachments" in prisma.complaint);
    console.log("complaintAttachment type:", typeof prisma.complaintAttachment);
    if (req.files && req.files.length > 0) {
      await prisma.complaintAttachment.createMany({
        data: req.files.map((file) => ({
          complaintId: complaint.id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        })),
      });
    }

    await notifyComplaintCreated({
      complaint,
      user: req.user,
    });

    // Set toast in cookie
    addToast(req, res, {
      type: "success",
      title: "Success",
      message: "Complaint submitted successfully.",
    });

    // PRG: Redirect with reference in URL
    return res.redirect(`/complaints/success?ref=${complaint.referenceNo}`);
  } catch (error) {
    logger.error({ error: error.message }, "Complaint creation failed");
    addToast(req, res, {
      type: "error",
      title: "Server error",
      message: "Unable to submit complaint",
    });
    return res.redirect("/complaints/new");
  }
}

export async function myComplaints(req, res) {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { createdById: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: { select: { id: true, name: true, fullname: true } },
        assignedDepartment: { select: { id: true, name: true } },
        // attachments: true  // Uncomment ONLY if template uses attachments
      },
    });

    res.render("complaints/list", {
      complaints,
      user: req.user,
      toast: req.cookies.toast ? JSON.parse(req.cookies.toast) : null,
    });
    res.clearCookie("toast");
  } catch (error) {
    logger.error(
      { userId: req.user?.id, error: error.message },
      "Fetch complaints failed",
    );
    res.cookie(
      "toast",
      JSON.stringify({
        type: "error",
        title: "Error",
        message: "Failed to load your complaints",
      }),
      { httpOnly: true, maxAge: 1000 },
    );
    res.redirect("/dashboard");
  }
}

export async function viewComplaint(req, res) {
  try {
    const complaint = await prisma.complaint.findFirst({
      where: { id: Number(req.params.id) },

      include: {
        attachments: true,
        assignedTo: {
          select: { id: true, name: true, fullname: true, department: true },
        },
        assignedDepartment: true,
        complainant: {
          select: { id: true, name: true, fullname: true, email: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          select: { id: true, type: true, remarks: true, createdAt: true },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
          select: { id: true, toStatus: true, remarks: true, createdAt: true },
        },
      },
    });

    const isDeleted = complaint.deletedAt ?? false;

    console.log(JSON.stringify(complaint, null, 2));

    if (!complaint) {
      // toast: SYSTEM_MESSAGES.COMPLAINT.NOT_FOUND,
      addToast(req, res, {
        type: "error",
        title: "Not Found",
        message: "Complaint not found.",
      });

      return res.redirect("/complaints/new");
    }

    const hasPermission =
      complaint.createdById === req.user.id ||
      complaint.assignedToId === req.user.id ||
      req.user.role === "ADMIN" ||
      req.user.role === "SUPERADMIN";

    if (!hasPermission) {
      return res.status(403).render("error", {
        toast: {
          type: "error",
          title: "Unauthorized",
          message: "You do not have permission to view this complaint",
        },
      });
    }

    const departments = await prisma.department.findMany({
      where: { isActive: true },
    });

    // ONLY preload staff for assigned department (no duplication)
    let staff = [];
    if (complaint.assignedDepartmentId) {
      staff = await prisma.user.findMany({
        where: {
          role: "STAFF",
          departmentId: complaint.assignedDepartmentId,
          isActive: true,
        },
        select: {
          id: true,
          fullname: true,
          name: true,
        },
      });
    }

    return res.render("complaints/view", {
      complaint,
      isDeleted,
      user: req.user,
      categories: Object.values(ComplaintCategory),
      priorities: Object.values(ComplaintPriority),
      statuses: Object.values(ComplaintStatus),
      departments,
      allStaff: staff,
    });
  } catch (error) {
    logger.error(
      { userId: req.user?.id, error: error.message },
      "Failed to fetch complaint",
    );

    return res.status(500).render("error", {
      toast: SYSTEM_MESSAGES.GENERIC.SERVER_ERROR,
    });
  }
}

export async function updateComplaint(req, res) {
  try {
    const complaintId = Number(req.params.id);
    const user = req.user;

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        createdBy: true,
        assignedTo: true,
        assignedDepartment: true,
      },
    });

    if (!complaint) {
      return res.status(404).render("error", {
        message: "Complaint not found",
        user: req.user,
      });
    }

    const data = {};
    const changes = [];
    const oldStatus = complaint.status;
    const oldPriority = complaint.priority;

    // =========================
    // ADMIN / SUPERADMIN ACTIONS
    // =========================
    if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
      // Priority change
      if (req.body.priority && req.body.priority !== complaint.priority) {
        data.priority = req.body.priority;
        changes.push({
          type: "priority",
          old: oldPriority,
          new: req.body.priority,
        });

        await notifyComplaintPriorityChange({
          complaint,
          actorId: user.id,
          newPriority: req.body.priority,
          oldPriority: oldPriority,
        });
      }

      // Status change
      if (req.body.status && req.body.status !== complaint.status) {
        data.status = req.body.status;
        changes.push({ type: "status", old: oldStatus, new: req.body.status });

        // Trigger status change notification
        await notifyComplaintStatusChange({
          complaint,
          actorId: user.id,
          newStatus: req.body.status,
          oldStatus: oldStatus,
        });
      }

      // Assignment changes
      const newDept = req.body.assignedDepartmentId
        ? Number(req.body.assignedDepartmentId)
        : null;

      const newStaff = req.body.assignedToId
        ? Number(req.body.assignedToId)
        : null;

      if (newDept && newDept !== complaint.assignedDepartmentId) {
        data.assignedDepartmentId = newDept;
        changes.push({ type: "department", value: newDept });
      }

      if (newStaff && newStaff !== complaint.assignedToId) {
        data.assignedToId = newStaff;
        data.assignedAt = new Date();
        data.assignedById = user.id;
        changes.push({ type: "assignment", staff: newStaff });

        // Trigger assignment notification
        await notifyComplaintAssignment({
          complaint,
          actorId: user.id,
          assignedToId: newStaff,
          assignedDepartmentId: newDept,
        });
      }

      // Resolution
      if (req.body.status === "RESOLVED" && req.body.resolutionNotes) {
        data.resolutionNotes = req.body.resolutionNotes;
        data.resolvedAt = new Date();

        await notifyComplaintResolved({
          complaint,
          actorId: user.id,
          resolutionNotes: req.body.resolutionNotes,
        });
      }

      // Rejection
      if (req.body.status === "REJECTED" && req.body.rejectionReason) {
        data.rejectionNotes = req.body.rejectionReason;

        await notifyComplaintRejected({
          complaint,
          actorId: user.id,
          reason: req.body.rejectionReason,
        });
      }
    }

    // =========================
    // STAFF ACTIONS
    // =========================
    if (user.role === "STAFF") {
      // Status change (limited)
      const allowedStatuses = ["IN_PROGRESS", "RESOLVED", "REJECTED"];
      if (
        req.body.status &&
        allowedStatuses.includes(req.body.status) &&
        req.body.status !== complaint.status
      ) {
        data.status = req.body.status;
        changes.push({ type: "status", old: oldStatus, new: req.body.status });

        await notifyComplaintStatusChange({
          complaint,
          actorId: user.id,
          newStatus: req.body.status,
          oldStatus: oldStatus,
        });

        // Resolution handling
        if (req.body.status === "RESOLVED" && req.body.resolutionNotes) {
          data.resolutionNotes = req.body.resolutionNotes;
          data.resolvedAt = new Date();

          await notifyComplaintResolved({
            complaint,
            actorId: user.id,
            resolutionNotes: req.body.resolutionNotes,
          });
        }

        // Rejection handling
        if (req.body.status === "REJECTED" && req.body.rejectionReason) {
          data.rejectionNotes = req.body.rejectionReason;

          await notifyComplaintRejected({
            complaint,
            actorId: user.id,
            reason: req.body.rejectionReason,
          });
        }
      }

      // Priority change
      if (req.body.priority && req.body.priority !== complaint.priority) {
        data.priority = req.body.priority;
        changes.push({
          type: "priority",
          old: oldPriority,
          new: req.body.priority,
        });

        await notifyComplaintPriorityChange({
          complaint,
          actorId: user.id,
          newPriority: req.body.priority,
          oldPriority: oldPriority,
        });
      }
    }

    // =========================
    // NO CHANGES
    // =========================
    if (Object.keys(data).length === 0) {
      addToast(req, res, {
        type: "info",
        title: "No Changes",
        message: "No changes were detected.",
      });
      return res.redirect(`/complaints/${complaintId}`);
    }

    // Update complaint
    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data,
    });

    // Success feedback
    if (changes.length > 0) {
      changes.forEach((change) => {
        let message = "";
        switch (change.type) {
          case "status":
            message = `Status changed from ${change.old} to ${change.new}`;
            break;
          case "department":
            message = "Department assigned";
            break;
          case "assignment":
            message = "Assigned to staff";
            break;
          case "priority":
            message = `Priority changed from ${change.old} to ${change.new}`;
            break;
        }
        addToast(req, res, {
          type: "success",
          title: "Success",
          message,
        });
      });
    }

    return res.redirect(`/complaints/${complaintId}`);
  } catch (err) {
    logger.error({ err: err.message }, "Update failed");
    return res.status(500).render("error", {
      message: "Update failed",
      err,
    });
  }
}

export async function getStaffByDepartment(req, res) {
  try {
    const departmentId = Number(req.params.id);

    const staff = await prisma.user.findMany({
      where: {
        role: "STAFF",
        departmentId,
        isActive: true,
      },
      select: {
        id: true,
        fullname: true,
        name: true,
      },
    });

    const departments = await prisma.department.findMany({
      include: {
        users: {
          where: {
            role: "STAFF",
            isActive: true,
          },
          orderBy: {
            fullname: "asc",
          },
        },
      },
    });

    // DEBUG
    // console.log("departmentId:", departmentId);
    // console.log("staff:", staff);

    return res.json(staff);
  } catch (err) {
    return res.status(500).render("error", {
      message: "Failed to fetch staff",
    });
  }
}

export async function deleteComplaint(req, res) {
  try {
    const complaintId = Number(req.params.id);

    if (!complaintId) {
      return res.status(400).render("error", {
        toast: SYSTEM_MESSAGES.COMPLAINT.INVALID_ID,
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return res.status(404).render("error", {
        toast: SYSTEM_MESSAGES.COMPLAINT.NOT_FOUND,
      });
    }

    if (complaint.deletedAt) {
      return res.status(400).render("error", {
        toast: SYSTEM_MESSAGES.COMPLAINT.ALREADY_DELETED,
      });
    }

    const user = req.user;

    // Ownership Super/Admin check
    if (
      complaint.userId !== user.id &&
      user.role !== "ADMIN" &&
      user.role !== "SUPERADMIN"
    ) {
      return res.status(404).render("error", {
        toast: SYSTEM_MESSAGES.AUTH.UNAUTHORIZED_ACTION,
      });
    }

    await prisma.complaint.update({
      where: {
        id: complaintId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    addToast(req, res, {
      type: "success",
      title: "Success",
      message: `Complaint #${complaint.referenceNo} deleted successfully.`,
    });

    return res.redirect("/dashboard");
  } catch (error) {
    console.error("deleteComplaint:", error);

    addToast(req, res, {
      type: "error",
      title: "Error",
      message: "An error occured. Please try again later.",
    });

    return res.redirect("/dashboard");
  }
}

export async function restoreComplaint(req, res) {
  try {
    const complaintId = Number(req.params.id);

    if (!complaintId) {
      return res.status(400).render("error", {
        toast: SYSTEM_MESSAGES.COMPLAINT.INVALID_ID,
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return res.status(404).render("error", {
        toast: SYSTEM_MESSAGES.COMPLAINT.NOT_FOUND,
      });
    }

    if (!complaint.deletedAt) {
      return res.status(400).render("error", {
        toast: SYSTEM_MESSAGES.COMPLAINT.ALREADY_RESTORED,
      });
    }

    const user = req.user;

    if (
      complaint.userId !== user.id &&
      user.role !== "ADMIN" &&
      user.role !== "SUPERADMIN"
    ) {
      return res.status(404).render("error", {
        toast: SYSTEM_MESSAGES.AUTH.UNAUTHORIZED_ACTION,
      });
    }

    await prisma.complaint.update({
      where: {
        id: complaintId,
      },
      data: {
        deletedAt: null,
      },
    });

    addToast(req, res, {
      type: "success",
      title: "Success",
      message: `Complaint #${complaint.referenceNo} restored successfully.`,
    });

    return res.redirect("/dashboard");
  } catch (error) {
    console.error("restoreComplaint:", error);

    addToast(req, res, {
      type: "error",
      title: "Error",
      message: "An error occured. Please try again later.",
    });

    return res.status(500).render("error", {
      message: "Failed to restore complaint",
    });
  }
}

export async function hardDeleteComplaint(req, res) {
  try {
    const complaintId = Number(req.params.id);

    if (!complaintId) {
      return res.status(400).render("error", {
        toast: SYSTEM_MESSAGES.COMPLAINT.INVALID_ID,
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return res.status(404).render("error", {
        toast: SYSTEM_MESSAGES.COMPLAINT.NOT_FOUND,
      });
    }

    const user = req.user;

    // Optional ownership/admin check
    if (complaint.userId !== user.id && user.role !== "SUPERADMIN") {
      return res.status(404).render("error", {
        toast: SYSTEM_MESSAGES.AUTH.UNAUTHORIZED_ACTION,
      });
    }

    await prisma.complaint.delete({
      where: { id: complaintId },
    });

    addToast(req, res, {
      type: "success",
      title: "Success",
      message: `Complaint #${complaint.referenceNo} was deleted forever`,
    });

    return res.redirect("/dashboard");
  } catch (error) {
    console.error("hardDeleteComplaint:", error);

    addToast(req, res, {
      type: "error",
      title: "Error",
      message: "An error occured. Please try again later.",
    });

    return res.status(500).render("error", {
      message: "Failed to hard delete complaint",
    });
  }
}
