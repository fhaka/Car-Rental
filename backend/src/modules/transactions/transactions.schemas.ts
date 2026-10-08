import { z } from "zod";
import { TransactionType } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const listTransactionsQuerySchema = paginationQuerySchema.extend({
  type: z.nativeEnum(TransactionType).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
