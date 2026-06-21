import express from "express";
import { prisma } from "../config/prisma.js";
import { getNotifications } from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  res.json(notifications);
});

router.post("/read/:id", requireAuth, async (req, res) => {
  await prisma.notification.update({
    where: { id: Number(req.params.id) },
    data: { read: true },
  });

  res.json({ success: true });
});

router.get("/unread-count", requireAuth, async (req, res) => {
  const count = await prisma.notification.count({
    where: {
      userId: req.user.id,
      read: false,
    },
  });

  res.json({ count });
});

export default router;
