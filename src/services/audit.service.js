import { prisma } from "../config/prisma.js";

// console.log("Prisma client:", prisma); // Debug log

export async function createAuditLog({
  actorId,
  userId,
  action,
  entityType = "COMPLAINT",
  entityId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null,
}) {
  if (!prisma) {
    console.error("Prisma client is undefined!");
    throw new Error("Prisma client not initialized");
  }
  console.log("AUDIT LOGGED:", { userId, action, oldValue, newValue });

  // if (!userId) {
  //   console.warn("AUDIT NOT LOGGED: missing userId", {
  //     entityType,
  //     action,
  //   });
  //   return null;
  // }
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        actorId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
    return null;
  }
}

// Export audit logs as CSV with optional date filtering
export async function exportAuditLogsToCSV({ startDate, endDate }) {
  // Build date filter
  const where = {};
  if (startDate) where.createdAt = { gte: new Date(startDate) };
  if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

  // Fetch logs with user/actor details
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      actor: { select: { id: true, email: true, name: true } },
    },
  });

  // Convert to CSV
  return convertToCSV(logs);
}

// Convert audit logs to CSV format
function convertToCSV(logs) {
  const headers = [
    "ID",
    "Timestamp",
    "User Email",
    "User Name",
    "Actor Email",
    "Actor Name",
    "Action",
    "Entity Type",
    "Entity ID",
    "Old Value",
    "New Value",
    "IP Address",
    "User Agent",
  ];

  const rows = logs.map((log) =>
    [
      log.id,
      log.createdAt.toISOString(),
      log.user?.email || "N/A",
      log.user?.name || "N/A",
      log.actor?.email || "N/A",
      log.actor?.name || "N/A",
      log.action,
      log.entityType,
      log.entityId || "N/A",
      JSON.stringify(log.oldValue || {}),
      JSON.stringify(log.newValue || {}),
      log.ipAddress || "N/A",
      log.userAgent || "N/A",
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
