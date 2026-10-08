import { Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

interface LogActivityParams {
  req?: Request;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Records an audit trail entry. Never throws - a logging failure must not
 * break the primary business operation it's describing.
 */
export async function logActivity({ req, userId, action, entityType, entityId, metadata }: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId ?? req?.user?.sub ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: req?.ip ?? null,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to write activity log entry");
  }
}
