import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pino from "pino";
import pinoHttp from "pino-http";

import { checkSession } from "./middlewares/auth.middleware.js";

// Initialize
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer
// destination(req, file, cb) {
//   cb(null, uploadDir);
// }

// Logger Setup
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty" }
      : undefined,
});

// Use pino-http middleware (adds req.log)
// app.use(pinoHttp({ logger }));

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5001",
    ],
    credentials: true,
  }),
);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// My
// set intermediate data inside of middleware on req?.locals

app.use(checkSession);
app.use((req, res, next) => {
  let items = [];

  try {
    items = JSON.parse(req.cookies.toast || "[]");
  } catch {}

  res.locals.toasts = items.filter((t) => t.scope !== "flash");
  res.locals.flashes = items.filter((t) => t.scope === "flash");

  res.cookie("toast", "[]", {
    httpOnly: true,
    maxAge: 1,
  });

  res.locals.userRole = req.user?.role ?? "GUEST";
  res.locals.appName = "My App";
  res.locals.backUrl = req.get("Referrer") || "/";
  res.locals.activePath = req.originalUrl.split("?")[0];

  next();
});

// Static Files & Views
app.use("/uploads", express.static(uploadDir)); // IMPORTANT FOR ATTACHMENTS
app.use(express.static("public"));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));
app.set("trust proxy", process.env.TRUST_PROXY === "true");

// Route Imports
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import reportsRouter from "./routes/reports.routes.js";

import { StatusCodes } from "http-status-codes";
import adminRoutes from "./routes/admin.routes.js";
// import staffRoutes from "./routes/staff.routes.js";

// Routes
app.get("/", checkSession, (req, res) => {
  res.render("index", { user: req.user });
});

app.get("/help", checkSession, (req, res) => {
  res.render("help", { user: req.user });
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/complaints", complaintRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/notifications", notificationRoutes);
app.use("/upload", uploadRoutes);
app.use("/admin/reports", reportsRouter);
app.use("/admin", adminRoutes);
// app.use("/staff", staffRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render("error", { message: "Page Not Found" });
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error({ err });
  res.status(err.status || 500).render("error", {
    message:
      process.env.NODE_ENV === "development" ? err.message : "Server Error",
    backUrl: req.get("referer") || req.headers.referer || "/dashboard",
    statusCode: err.status,
  });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`✅ MCRS Lite running on http://localhost:${PORT}`);
});

export default app;
