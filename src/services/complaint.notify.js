import { notify } from "./notification.service.js";
import { ComplaintStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

/**
 * NOTIFICATION HELPERS
 */
const getComplaintLink = (complaintId) => `/complaints/${complaintId}`;
const getUserFullName = (user) => user?.fullname || user?.name || "Unknown";

/**
 * =============================================
 * CREATION NOTIFICATIONS
 * Trigger: When citizen submits new complaint
 * =============================================
 */
export async function notifyComplaintCreated({ complaint, user }) {
  const link = getComplaintLink(complaint.id);

  // 1. Confirm to citizen
  await notify({
    userId: complaint.createdById,
    actorId: user.id,
    title: "Complaint Submitted",
    message: `Your complaint #${complaint.referenceNo} has been received and is pending review.`,
    type: "COMPLAINT",
    complaintId: complaint.id,
    link,
  });

  // 2. Alert all ADMINs
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] }, isActive: true },
    select: { id: true },
  });

  for (const admin of admins) {
    await notify({
      userId: admin.id,
      actorId: user.id,
      title: "New Complaint Submitted",
      message: `New complaint #${complaint.referenceNo}: ${complaint.subject}`,
      type: "COMPLAINT",
      complaintId: complaint.id,
      link,
    });
  }
}

/**
 * =============================================
 * ASSIGNMENT NOTIFICATIONS
 * Trigger: When admin assigns complaint to department/staff
 * =============================================
 */
export async function notifyComplaintAssignment({
  complaint,
  actorId,
  assignedToId = null,
  assignedDepartmentId = null,
}) {
  const link = getComplaintLink(complaint.id);
  const actor = await prisma.user.findUnique({ where: { id: actorId } });

  // 1. Notify complainant (citizen)
  if (complaint.createdById) {
    await notify({
      userId: complaint.createdById,
      actorId,
      title: "Complaint Assigned",
      message: `Your complaint #${complaint.referenceNo} has been assigned for resolution.`,
      type: "COMPLAINT",
      complaintId: complaint.id,
      link,
    });
  }

  // 2. Notify assigned staff
  if (assignedToId) {
    const assignedStaff = await prisma.user.findUnique({
      where: { id: assignedToId },
    });
    await notify({
      userId: assignedToId,
      actorId,
      title: "New Task: Complaint Assigned",
      message: `You have been assigned complaint #${complaint.referenceNo}: ${complaint.subject}`,
      type: "TASK",
      complaintId: complaint.id,
      link,
    });
  }

  // 3. Notify department staff (if department assigned)
  if (assignedDepartmentId) {
    const deptStaff = await prisma.user.findMany({
      where: {
        departmentId: assignedDepartmentId,
        role: "STAFF",
        isActive: true,
      },
      select: { id: true, fullname: true },
    });

    for (const staff of deptStaff) {
      await notify({
        userId: staff.id,
        actorId,
        title: "New Complaint in Department",
        message: `Complaint #${complaint.referenceNo} assigned to your department: ${complaint.subject}`,
        type: "COMPLAINT",
        complaintId: complaint.id,
        link,
      });
    }
  }

  // 4. Notify all ADMINs/SUPERADMINs
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] }, isActive: true },
    select: { id: true },
  });

  for (const admin of admins) {
    await notify({
      userId: admin.id,
      actorId,
      title: "Complaint Assigned",
      message: `Complaint #${complaint.referenceNo} assigned to ${assignedToId ? getUserFullName(await prisma.user.findUnique({ where: { id: assignedToId } })) : "staff"}`,
      type: "SYSTEM",
      complaintId: complaint.id,
      link,
    });
  }
}

/**
 * =============================================
 * STATUS CHANGE NOTIFICATIONS
 * Trigger: When complaint status changes
 * =============================================
 */
export async function notifyComplaintStatusChange({
  complaint,
  actorId,
  newStatus,
  oldStatus,
}) {
  const link = getComplaintLink(complaint.id);
  const actor = await prisma.user.findUnique({ where: { id: actorId } });

  // 1. Always notify complainant
  if (complaint.createdById) {
    await notify({
      userId: complaint.createdById,
      actorId,
      title: `Complaint ${newStatus}`,
      message: `Your complaint #${complaint.referenceNo} status changed to: ${newStatus.replace("_", " ")}`,
      type: "COMPLAINT",
      complaintId: complaint.id,
      link,
    });
  }

  // 2. Notify assigned staff (if assigned)
  if (complaint.assignedToId) {
    await notify({
      userId: complaint.assignedToId,
      actorId,
      title: "Status Update",
      message: `Complaint #${complaint.referenceNo} status changed to ${newStatus.replace("_", " ")}`,
      type: "TASK",
      complaintId: complaint.id,
      link,
    });
  }

  // 3. Notify department staff
  if (complaint.assignedDepartmentId) {
    const deptStaff = await prisma.user.findMany({
      where: {
        departmentId: complaint.assignedDepartmentId,
        role: "STAFF",
        isActive: true,
      },
      select: { id: true },
    });

    for (const staff of deptStaff) {
      await notify({
        userId: staff.id,
        actorId,
        title: "Status Update in Department",
        message: `Complaint #${complaint.referenceNo} status: ${oldStatus} → ${newStatus}`,
        type: "COMPLAINT",
        complaintId: complaint.id,
        link,
      });
    }
  }

  // 4. Notify ADMINs/SUPERADMINs
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] }, isActive: true },
    select: { id: true },
  });

  for (const admin of admins) {
    await notify({
      userId: admin.id,
      actorId,
      title: "Status Change",
      message: `Complaint #${complaint.referenceNo}: ${oldStatus} → ${newStatus}`,
      type: "SYSTEM",
      complaintId: complaint.id,
      link,
    });
  }
}

/**
 * =============================================
 * PRIORITY CHANGE NOTIFICATIONS
 * Trigger: When complaint priority changes
 * =============================================
 */
export async function notifyComplaintPriorityChange({
  complaint,
  actorId,
  newPriority,
  oldPriority,
}) {
  const link = getComplaintLink(complaint.id);

  // 1. Notify assigned staff
  if (complaint.assignedToId) {
    await notify({
      userId: complaint.assignedToId,
      actorId,
      title: "Priority Updated",
      message: `Complaint #${complaint.referenceNo} priority changed: ${oldPriority} → ${newPriority}`,
      type: "TASK",
      complaintId: complaint.id,
      link,
    });
  }

  // 2. Notify ADMINs/SUPERADMINs
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] }, isActive: true },
    select: { id: true },
  });

  for (const admin of admins) {
    await notify({
      userId: admin.id,
      actorId,
      title: "Priority Change",
      message: `Complaint #${complaint.referenceNo} priority: ${oldPriority} → ${newPriority}`,
      type: "SYSTEM",
      complaintId: complaint.id,
      link,
    });
  }
}

/**
 * =============================================
 * RESOLUTION NOTIFICATIONS
 * Trigger: When complaint is resolved
 * =============================================
 */
export async function notifyComplaintResolved({
  complaint,
  actorId,
  resolutionNotes,
}) {
  const link = getComplaintLink(complaint.id);

  // 1. Notify complainant
  if (complaint.createdById) {
    await notify({
      userId: complaint.createdById,
      actorId,
      title: "Complaint Resolved ✓",
      message: `Your complaint #${complaint.referenceNo} has been resolved. ${resolutionNotes ? "Notes: " + resolutionNotes.substring(0, 100) : ""}`,
      type: "COMPLAINT",
      complaintId: complaint.id,
      link,
    });
  }

  // 2. Notify assigned staff
  if (complaint.assignedToId) {
    await notify({
      userId: complaint.assignedToId,
      actorId,
      title: "Complaint Resolved",
      message: `Complaint #${complaint.referenceNo} marked as resolved.`,
      type: "TASK",
      complaintId: complaint.id,
      link,
    });
  }

  // 3. Notify ADMINs/SUPERADMINs
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] }, isActive: true },
    select: { id: true },
  });

  for (const admin of admins) {
    await notify({
      userId: admin.id,
      actorId,
      title: "Complaint Resolved",
      message: `Complaint #${complaint.referenceNo} resolved by ${getUserFullName(await prisma.user.findUnique({ where: { id: actorId } }))}`,
      type: "SYSTEM",
      complaintId: complaint.id,
      link,
    });
  }
}

/**
 * =============================================
 * REJECTION NOTIFICATIONS
 * Trigger: When complaint is rejected
 * =============================================
 */
export async function notifyComplaintRejected({ complaint, actorId, reason }) {
  const link = getComplaintLink(complaint.id);

  // 1. Notify complainant
  if (complaint.createdById) {
    await notify({
      userId: complaint.createdById,
      actorId,
      title: "Complaint Rejected",
      message: `Your complaint #${complaint.referenceNo} was rejected. Reason: ${reason}`,
      type: "COMPLAINT",
      complaintId: complaint.id,
      link,
    });
  }

  // 2. Notify ADMINs/SUPERADMINs
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] }, isActive: true },
    select: { id: true },
  });

  for (const admin of admins) {
    await notify({
      userId: admin.id,
      actorId,
      title: "Complaint Rejected",
      message: `Complaint #${complaint.referenceNo} rejected. Reason: ${reason}`,
      type: "SYSTEM",
      complaintId: complaint.id,
      link,
    });
  }
}
