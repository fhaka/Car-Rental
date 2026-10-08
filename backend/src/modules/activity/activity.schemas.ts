import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const listActivityQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;
