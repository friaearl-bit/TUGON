import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
