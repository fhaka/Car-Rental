import { z } from "zod";

export const globalSearchSchema = z.object({
  q: z.string().min(1),
});

export type GlobalSearchInput = z.infer<typeof globalSearchSchema>;
