import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../lib/logger";
import { isProduction } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: "ROUTE_NOT_FOUND" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // AppError: our own, well-shaped errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.originalUrl }, err.message);
    }
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, ...(err.details ? { details: err.details } : {}) },
    });
  }

  // Zod validation errors that escaped the validate() middleware
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.flatten(),
      },
    });
  }

  // Prisma known request errors (unique constraint, FK violation, not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return res.status(409).json({
        error: { message: `A record with this ${target} already exists`, code: "DUPLICATE_ENTRY" },
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: { message: "Record not found", code: "NOT_FOUND" } });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        error: { message: "This action violates a data relationship constraint", code: "FK_CONSTRAINT" },
      });
    }
    logger.error({ err, path: req.originalUrl }, "Prisma known request error");
    return res.status(400).json({ error: { message: "Database request error", code: "DB_ERROR" } });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error({ err, path: req.originalUrl }, "Prisma validation error");
    return res.status(400).json({ error: { message: "Invalid data supplied to the database layer", code: "DB_VALIDATION_ERROR" } });
  }

  // Unknown/unexpected errors - never leak internals
  logger.error({ err, path: req.originalUrl }, "Unhandled error");
  return res.status(500).json({
    error: {
      message: isProduction ? "An unexpected error occurred" : (err as Error)?.message || "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    },
  });
}
