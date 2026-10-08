import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const createExpenseSchema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number().positive(),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1),
  vendor: z.string().optional(),
  vehicleId: z.string().uuid().optional(),
  receiptRef: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const listExpensesQuerySchema = paginationQuerySchema.extend({
  category: z.nativeEnum(ExpenseCategory).optional(),
  vehicleId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  isArchived: z.coerce.boolean().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
