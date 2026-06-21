import { prisma } from "../config/prisma.js";

export async function getNotifications(req, res) {
  const userId = req.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(notifications);
}

export async function markAsRead(req, res) {
  await prisma.notification.update({
    where: { id: Number(req.params.id) },
    data: { read: true },
  });

  res.json({ success: true });
}
