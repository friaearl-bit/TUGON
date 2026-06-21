import { prisma } from "../config/prisma.js";

export async function notify({
  userId,
  title,
  message,
  type = "INFO",
  actorId = null,
  complaintId = null,
  link = null,
}) {
  console.log("NOTIFY CALLED:", { userId, title, type });

  if (!userId) {
    console.warn("NOTIFY SKIPPED: missing userId", {
      title,
      message,
    });
    return null;
  }

  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        actorId,
        complaintId,
        link,
      },
    });
  } catch (err) {
    console.error("NOTIFY FAILED:", err);
    return null;
  }
}
