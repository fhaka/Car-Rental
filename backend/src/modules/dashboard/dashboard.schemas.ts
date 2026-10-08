import { z } from "zod";

export const dashboardQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export function resolveDashboardRange(query: DashboardQuery) {
  const to = query.to ?? new Date();
  const from = query.from ?? new Date(to.getFullYear(), to.getMonth(), to.getDate() - 29);
  return { from, to };
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
