import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/** General API rate limiter - generous, protects against runaway clients. */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests, please try again later", code: "RATE_LIMITED" } },
});

/** Stricter limiter for auth endpoints (login, forgot-password) to slow brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many attempts, please try again later", code: "RATE_LIMITED" } },
});
