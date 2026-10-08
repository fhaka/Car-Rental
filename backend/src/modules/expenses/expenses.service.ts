import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from "./expenses.schemas";

const INCLUDE_DEFAULT = {
  vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ExpenseInclude;

export const expensesService = {
  async list(query: ListExpensesQuery) {
    const { page, pageSize, category, vehicleId, from, to, isArchived, sortBy, sortOrder, search } = query;
    const where: Prisma.ExpenseWhereInput = {
      isArchived: isArchived ?? false,
      ...(category ? { category } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      ...(search ? { description: { contains: search, mode: "insensitive" } } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where,
        include: INCLUDE_DEFAULT,
        orderBy: { [sortBy ?? "date"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.expense.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const expense = await prisma.expense.findUnique({ where: { id }, include: INCLUDE_DEFAULT });
    if (!expense) throw AppError.notFound("Expense not found");
    return expense;
  },

  async create(input: CreateExpenseInput, createdById: string) {
    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({ data: { ...input, createdById }, include: INCLUDE_DEFAULT });
      await tx.transaction.create({
        data: {
          type: "EXPENSE",
          category: input.category,
          amount: input.amount,
          description: input.description,
          occurredAt: input.date,
          relatedExpenseId: expense.id,
        },
      });
      return expense;
    });
  },

  async update(id: string, input: UpdateExpenseInput) {
    await this.get(id);
    return prisma.expense.update({ where: { id }, data: input, include: INCLUDE_DEFAULT });
  },

  async archive(id: string) {
    await this.get(id);
    return prisma.expense.update({ where: { id }, data: { isArchived: true }, include: INCLUDE_DEFAULT });
  },
};
