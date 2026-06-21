import {
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
} from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Main dashboard handler - role-based
 */
export const showDashboard = async (req, res) => {
  try {
    // logger.debug({ userId: req.user?.id }, "Showing complaint form");
    logger.debug({ userId: req.user?.id }, "Showing dashboard id");
    logger.debug({ userRole: req.user?.role }, "Showing dashboard role");
    logger.debug({ user: req.user }, "Showing dashboard user");

    const { user } = req;
    const { search, status, priority, department, category, isDeleted } =
      req.query;

    // Build where clause
    // const where = { deletedAt: isDeleted === "true" ? undefined : null };
    const where =
      isDeleted === "true"
        ? { deletedAt: { not: null } } // only deleted
        : { deletedAt: null }; // only not deleted

    // Global filters
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { referenceNo: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    // Role-based filters
    if (user.role === "STAFF") {
      where.assignedToId = user.id;
    } else if (user.role === "CITIZEN") {
      where.complainantId = user.id;
    } else if (
      department &&
      (user.role === "ADMIN" || user.role === "SUPERADMIN")
    ) {
      where.assignedDepartmentId = Number(department);
    }

    // Single query for complaints
    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        complainant: true,
        assignedTo: true,
        assignedDepartment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get departments (for filters)
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // Stats by role
    let stats = {};
    if (user.role === "SUPERADMIN" || user.role === "ADMIN") {
      const [
        totalUsers,
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.complaint.count({
          where: { deletedAt: isDeleted === "true" ? undefined : null },
        }),
        prisma.complaint.count({
          where: {
            status: "PENDING",
            deletedAt: isDeleted === "true" ? undefined : null,
          },
        }),
        prisma.complaint.count({
          where: {
            status: "RESOLVED",
            deletedAt: isDeleted === "true" ? undefined : null,
          },
        }),
      ]);
      stats = {
        totalUsers,
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
      };
    }

    // Determine template by role
    const templateMap = {
      SUPERADMIN: "dashboard/superadmin",
      ADMIN: "dashboard/admin",
      STAFF: "dashboard/staff",
      CITIZEN: "dashboard/citizen",
    };

    res.render(templateMap[user.role] || "dashboard/citizen", {
      user,
      complaints,
      departments,
      stats,
      filters: {
        query: req.query,
        statuses: Object.values(ComplaintStatus),
        priorities: Object.values(ComplaintPriority),
        categories: Object.values(ComplaintCategory),
        isDeleted: isDeleted === "true",
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).render("error", {
      error: {
        type: "error",
        title: "Server Error",
        message: "Failed to load dashboard",
      },
    });
  }
};

export const exportDashboard = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN") {
      return res.status(403).send("Unauthorized");
    }

    const complaints = await prisma.complaint.findMany({
      where: {
        deletedAt: null,
      },

      include: {
        complainant: true,
        assignedTo: true,
        assignedDepartment: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const rows = complaints.map((c) => ({
      ID: c.id,
      ReferenceNo: c.referenceNo,
      Title: c.title,
      Category: c.category,
      Priority: c.priority,
      Status: c.status,
      Complainant: c.complainant?.fullname || c.complainant?.name || "",

      Department: c.assignedDepartment?.name || "",

      AssignedTo: c.assignedTo?.fullname || c.assignedTo?.name || "",

      CreatedAt: c.createdAt,
      ResolvedAt: c.resolvedAt,
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`complaints-${new Date().toISOString().split("T")[0]}.csv`);

    return res.send(csv);
  } catch (error) {
    console.error(error);

    return res.status(500).send("Export failed");
  }
};
