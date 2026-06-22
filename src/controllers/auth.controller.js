// src/controllers/auth.controller.js

import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { generateSessionId } from "../utils/session.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { logger } from "../utils/logger.js";
import { createAuditLog } from "../services/audit.service.js";
import { addToast, addFlash } from "../utils/toast.js";

import bcrypt from "bcrypt";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      addFlash(req, res, [{ message: "Missing fields" }]);
      await createAuditLog({
        actorId: null,
        userId: null, // Sentinel value for "no user"
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        entityId: null, // Sentinel value for "no entity"
        newValue: {
          attemptedEmail: req.body.email,
          // ipAddress: req.ip,
          // userAgent: req.get("User-Agent"),
          reason: "Missing fields",
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return res.redirect("/auth/login");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      addFlash(req, res, [{ message: "Invalid email or password" }]);
      await createAuditLog({
        actorId: null,
        userId: null, // Sentinel value for "no user"
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        entityId: null, // Sentinel value for "no entity"
        newValue: {
          attemptedEmail: req.body.email,
          // ipAddress: req.ip,
          // userAgent: req.get("User-Agent"),
          reason: "Invalid email or password",
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return res.redirect("/auth/login");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      addFlash(req, res, [{ message: "Invalid credentials" }]);
      await createAuditLog({
        actorId: null,
        userId: null, // Sentinel value for "no user"
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        entityId: null, // Sentinel value for "no entity"
        newValue: {
          attemptedEmail: req.body.email,
          // ipAddress: req.ip,
          // userAgent: req.get("User-Agent"),
          reason: "Invalid credentials",
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return res.redirect("/auth/login");
    }

    const sessionId = generateSessionId();
    const now = new Date();
    const expiresAt = new Date(Date.now() + env.SESSION_TTL * 1000);
    // const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h TTL

    await prisma.session.create({
      data: {
        sessionId,
        userId: user.id,
        createdAt: now,
        lastActivity: now,
        expiresAt,

        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      sameSite: "lax", // DEVELOPMENT ONLY
      maxAge: env.SESSION_TTL * 1000,
    });

    await createAuditLog({
      actorId: user.id, // Who logged in
      userId: user.id, // Same as actor for login
      action: "LOGIN",
      entityType: "AUTH",
      entityId: null, // No specific entity
      newValue: {
        // ipAddress: req.ip,
        // userAgent: req.get("User-Agent"),
        sessionId: req.sessionID,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
    logger.info({ userId: user.id }, "User logged in");
    addToast(req, res, {
      type: "success",
      title: "Success",
      message: "Successfully logged in.",
    });
    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
}

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).send("Missing fields");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // return res.status(400).send("Email already exists");
    addFlash(req, res, [{ message: "Email already exists" }]);
    logger.error({ existing }, "Email already exists");

    return res.redirect("/auth/register");
  }

  // SUCCESSFULLY REGISTERED
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  logger.info({ user }, "New user registered.");
  addToast(req, res, {
    type: "success",
    title: "Success",
    message: "Registration completed successfully.",
  });
  await createAuditLog({
    actorId: user.id, // Self-registration
    userId: user.id, // Same as actor
    action: "USER_CREATE",
    entityType: "USER",
    entityId: user.id,
    newValue: {
      email: user.email,
      role: user.role,
      // departmentId: createdUser.departmentId,
    },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  return res.redirect("/auth/login");
  // res.status(201).send({ id: user.id, name: user.name, email: user.email });
}

export async function logout(req, res) {
  if (!req.session) return res.status(401).send("No session");

  await createAuditLog({
    actorId: req.user.id, // Who logged out
    userId: req.user.id, // Same as actor
    action: "LOGOUT",
    entityType: "AUTH",
    entityId: null,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  await prisma.session.delete({ where: { id: req.session.id } });
  logger.info({ userId: req.user.id }, "User logged out");
  res.clearCookie("session_id");
  // res.send({ message: "Logged out" });
  return res.redirect("/");
}

export async function me(req, res) {
  if (!req.user) return res.status(401).send("Unauthorized");

  res.send({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,

    // FIELDS FOR FORM PRE-FILL
    surname: req.user.surname || req.user.lastName || "",
    givenName: req.user.givenName || req.user.firstName || "",
    middleName: req.user.middleName || "",
    suffix: req.user.suffix || "",
    contactNo: req.user.contactNumber || req.user.phone || "",
    emailAddress: req.user.email || "", // Alias for form compatibility
  });
}
