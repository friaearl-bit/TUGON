// src/controllers/admin.controller.js

import { prisma } from "../config/prisma.js";
import { logger } from "../utils/logger.js";
import { SYSTEM_MESSAGES } from "../config/messages.js";
import { addToast, addFlash } from "../utils/toast.js";
import { exportAuditLogsToCSV } from "../services/audit.service.js";

function parseMaybeJson(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function formatChange(oldValue, newValue) {
  const a = parseMaybeJson(oldValue);
  const b = parseMaybeJson(newValue);

  if (
    !a ||
    !b ||
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) ||
    Array.isArray(b)
  ) {
    return `${String(oldValue)} → ${String(newValue)}`;
  }

  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const parts = [];

  for (const k of keys) {
    const oldV = a[k];
    const newV = b[k];
    if (oldV === newV) continue;
    parts.push(`${k}: ${String(oldV)} → ${String(newV)}`);
  }

  return parts.length ? parts.join(", ") : "";
}

export const listAuditLogs = async (req, res) => {
  try {
    const user = req.user;

    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: true, // relation mapped to userId
        actor: true, // relation mapped to actorId
      },
    });
    auditLogs.length = await prisma.auditLog.count(); // change model name

    auditLogs.forEach((l) => {
      l.changeText = formatChange(l.oldValue, l.newValue);
    });

    res.render("admin/logs", {
      user: user,
      auditLogs,
    });
  } catch (error) {
    console.error("List logs error:", error);
    res.status(500).render("error", {
      //   message: "Failed to load logs",
      message: error.message,
    });
  }
};

export async function exportAuditLogs(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const csv = await exportAuditLogsToCSV({ startDate, endDate });

    // Set CSV download headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-logs.csv"',
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// model AuditLog {
// 	id         Int      @id @default(autoincrement())
// 	userId     Int
// 	actorId    Int? // Who performed the action (can differ from userId for admin actions)
// 	action     String // CREATE | UPDATE | DELETE | ASSIGN | STATUS_CHANGE | RESOLVE | REJECT
// 	entityType String // COMPLAINT | USER | DEPARTMENT
// 	entityId   Int // ID of the affected entity
// 	oldValue   Json? // Previous state (for updates)
// 	newValue   Json? // New state (for updates)
// 	ipAddress  String? // Client IP
// 	userAgent  String? // Browser info
// 	metadata   Json? // Additional context (e.g., { reason: "Duplicate complaint" })
// 	createdAt  DateTime @default(now())

// 	// Relations
// 	user  User  @relation("AuditLogUser", fields: [userId], references: [id])
// 	actor User? @relation("AuditLogActor", fields: [actorId], references: [id])

// 	@@index([entityType, entityId])
// 	@@index([userId])
// 	@@index([createdAt])
//   }
