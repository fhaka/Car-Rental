import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const listCategoriesQuerySchema = paginationQuerySchema.extend({
  isActive: z.coerce.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
