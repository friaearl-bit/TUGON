// src/middlewares/auth.middleware.js

import { prisma } from "../config/prisma.js";
import { logger } from "../utils/logger.js";
import { addToast, addFlash } from "../utils/toast.js";

export function requireRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      addToast(req, res, {
        type: "error",
        title: "Unauthorized",
        message: "You do not have permission to access this page",
      });
      return res.redirect("/dashboard");
    }
    next();
  };
}

export async function requireAuth(req, res, next) {
  try {
    const sessionId = req.cookies.session_id;

    // No session cookie
    if (!sessionId) {
      addToast(req, res, {
        type: "error",
        title: "Unauthorized",
        message: "Please log in to continue",
      });
      return res.redirect("/auth/login");
    }

    // Session exists in DB?
    const session = await prisma.session.findUnique({
      where: { sessionId },
      include: { user: true },
    });

    // Session not found or expired
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      res.clearCookie("session_id");
      addToast(req, res, {
        type: "error",
        type: "Error",
        message: "Session expired. Please log in again.",
      });
      return res.redirect("/auth/login");
    }

    // Valid session - update last activity (sliding expiration)
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    // Attach user to request
    req.user = session.user;
    req.session = session;
    next();
  } catch (err) {
    // Any other error - redirect to login
    logger.error({ err }, "Authentication middleware error");
    res.clearCookie("session_id");
    addToast(req, res, {
      type: "error",
      type: "Unauthorized",
      message: "Authentication error. Please log in.",
    });
    res.redirect("/auth/login");
  }
}

export async function checkSession(req, res, next) {
  const sessionId = req.cookies.session_id;

  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { sessionId },
      include: { user: true },
    });
    req.user = session?.user || null;
  } else {
    req.user = null;
  }
  next();
}
