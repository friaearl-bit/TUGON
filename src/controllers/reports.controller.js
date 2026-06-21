import { prisma } from "../config/prisma.js";

// export async function myDashboard(req, res) {

//   const recentComplaints = await prisma.complaint.findMany({
//     where: {
//       createdById: req.user.id,
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//     take: 5,
//   });

//   res.render("dashboard/citizen", {
//     pending,
//     assigned,
//     inProgress,
//     resolved,
//     rejected,
//     recentComplaints,
//   });
// }

export const getReportsData = async (req, res) => {
  try {
    const user = req.user;

    // ============ EXECUTIVE SUMMARY ============
    const [
      totalComplaints,
      pendingComplaints,
      assignedComplaints,
      inProgressComplaints,
      resolvedComplaints,
      closedComplaints,
      rejectedComplaints,
      activeDepartments,
      totalStaff,
      totalCitizens,
    ] = await Promise.all([
      prisma.complaint.count({ where: { deletedAt: null } }),
      prisma.complaint.count({ where: { deletedAt: null, status: "PENDING" } }),
      prisma.complaint.count({
        where: { deletedAt: null, status: "ASSIGNED" },
      }),
      prisma.complaint.count({
        where: { deletedAt: null, status: "IN_PROGRESS" },
      }),
      prisma.complaint.count({
        where: { deletedAt: null, status: "RESOLVED" },
      }),
      prisma.complaint.count({ where: { deletedAt: null, status: "CLOSED" } }),
      prisma.complaint.count({
        where: { deletedAt: null, status: "REJECTED" },
      }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "STAFF", isActive: true } }),
      prisma.user.count({ where: { role: "CITIZEN", isActive: true } }),
    ]);

    // Resolution rate calculation
    const resolutionRate =
      totalComplaints > 0
        ? Math.round((resolvedComplaints / totalComplaints) * 100)
        : 0;

    // ============ COMPLAINTS BY STATUS ============
    const statusStats = await prisma.complaint.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const statusData = {
      labels: [
        "Pending",
        "Assigned",
        "In Progress",
        "Resolved",
        "Rejected",
        "Closed",
      ],
      data: [0, 0, 0, 0, 0, 0],
    };

    statusStats.forEach((s) => {
      const index = statusData.labels.findIndex(
        (l) => l.toLowerCase() === s.status.toLowerCase(),
      );
      if (index !== -1) statusData.data[index] = s._count.id;
    });

    // ============ COMPLAINTS BY PRIORITY ============
    const priorityStats = await prisma.complaint.groupBy({
      by: ["priority"],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const priorityData = {
      labels: priorityStats.map((p) => p.priority),
      data: priorityStats.map((p) => p._count.id),
    };

    // ============ COMPLAINTS BY DEPARTMENT ============
    const departmentStats = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: { select: { assignedComplaints: true } },
      },
    });

    const departmentData = {
      labels: departmentStats.map((d) => d.name),
      data: departmentStats.map((d) => d._count.assignedComplaints),
    };

    // ============ COMPLAINTS BY CATEGORY ============
    const categoryStats = await prisma.complaint.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const categoryData = {
      labels: categoryStats.map((c) => c.category.replace("_", " ")),
      data: categoryStats.map((c) => c._count.id),
    };

    // ============ MONTHLY TREND ============
    const monthlyTrend = await prisma.$queryRaw`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM "Complaint"
      WHERE "deletedAt" IS NULL
      GROUP BY month
      ORDER BY month
    `;

    const monthlyData = {
      labels: monthlyTrend.map((m) => m.month),
      data: monthlyTrend.map((m) => m.count),
    };

    // ============ STAFF PERFORMANCE ============
    const staffPerformance = await prisma.user.findMany({
      where: { role: "STAFF", isActive: true },
      select: {
        fullname: true,
        _count: { select: { assignedComplaints: true } },
      },
    });

    const staffData = {
      labels: staffPerformance.map((s) => s.fullname),
      data: staffPerformance.map((s) => s._count.assignedComplaints),
    };

    // ============ RESOLUTION TIME ANALYSIS ============
    const resolvedComplaintsWithDates = await prisma.complaint.findMany({
      where: {
        status: "RESOLVED",
        resolvedAt: { not: null },
        deletedAt: null,
      },
      select: { createdAt: true, resolvedAt: true },
    });

    const resolutionTimes = resolvedComplaintsWithDates.map((c) => {
      const created = new Date(c.createdAt);
      const resolved = new Date(c.resolvedAt);
      return (resolved - created) / (1000 * 60 * 60); // hours
    });

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? (
            resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          ).toFixed(1)
        : 0;

    const resolutionTimeData = {
      averageHours: parseFloat(avgResolutionTime),
      totalResolved: resolvedComplaintsWithDates.length,
      fastest:
        resolutionTimes.length > 0
          ? Math.min(...resolutionTimes).toFixed(1)
          : 0,
      slowest:
        resolutionTimes.length > 0
          ? Math.max(...resolutionTimes).toFixed(1)
          : 0,
    };

    // ============ RESPONSE ============
    res.json({
      success: true,
      summary: {
        totalComplaints,
        pendingComplaints,
        assignedComplaints,
        inProgressComplaints,
        resolvedComplaints,
        closedComplaints,
        rejectedComplaints,
        activeDepartments,
        totalStaff,
        totalCitizens,
        resolutionRate,
      },
      statusDistribution: statusData,
      priorityDistribution: priorityData,
      departmentDistribution: departmentData,
      categoryDistribution: categoryData,
      monthlyTrend: monthlyData,
      staffPerformance: staffData,
      resolutionMetrics: resolutionTimeData,
    });
  } catch (error) {
    console.error("Reports error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Render reports dashboard page
 */
export const showReportsDashboard = async (req, res) => {
  const [pending, assigned, inProgress, resolved, rejected] = await Promise.all(
    [
      prisma.complaint.count({ where: { status: "PENDING" } }),
      prisma.complaint.count({ where: { status: "ASSIGNED" } }),
      prisma.complaint.count({ where: { status: "IN_PROGRESS" } }),
      prisma.complaint.count({ where: { status: "RESOLVED" } }),
      prisma.complaint.count({ where: { status: "REJECTED" } }),
    ],
  );
  res.render("admin/reports", {
    user: req.user,
    title: "Analytics Dashboard",
    userRole: req.user?.role || null,
    pending,
    assigned,
    inProgress,
    resolved,
    rejected,
  });
};

export default { getReportsData, showReportsDashboard };
