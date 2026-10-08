import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { ListTransactionsQuery } from "./transactions.schemas";

export const transactionsService = {
  async list(query: ListTransactionsQuery) {
    const { page, pageSize, type, from, to, sortBy, sortOrder } = query;
    const where: Prisma.TransactionWhereInput = {
      ...(type ? { type } : {}),
      ...(from || to
        ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: {
          relatedPayment: { select: { id: true, paymentNumber: true } },
          relatedExpense: { select: { id: true, description: true } },
        },
        orderBy: { [sortBy ?? "occurredAt"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.transaction.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },
};
