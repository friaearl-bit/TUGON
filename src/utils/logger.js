import pino from "pino"; // For logger instance
// import pinoHttp from "pino-http"; // For Express middleware
// Usage: import { logger } from "../utils/logger.js";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  // level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty" }
      : undefined,
});

// export const logger = pino({
//   transport: { target: "pino-pretty" },
//   level: process.env.NODE_ENV === "production" ? "info" : "debug",
// });
