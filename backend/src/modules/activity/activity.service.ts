import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { ListActivityQuery } from "./activity.schemas";

export const activityService = {
  async list(query: ListActivityQuery) {
    const { page, pageSize, userId, entityType, from, to } = query;
    const where: Prisma.ActivityLogWhereInput = {
      ...(userId ? { userId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.activityLog.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },
};
