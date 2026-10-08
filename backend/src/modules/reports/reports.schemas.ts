import { z } from "zod";

export const reportsQuerySchema = z.object({
  preset: z.enum(["today", "this_week", "this_month", "this_year", "custom"]).default("this_month"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ReportsQuery = z.infer<typeof reportsQuerySchema>;

export function resolveReportRange(query: ReportsQuery) {
  const now = new Date();
  if (query.preset === "custom" && query.from && query.to) {
    return { from: query.from, to: query.to };
  }
  switch (query.preset) {
    case "today": {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from, to };
    }
    case "this_week": {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      return { from, to: now };
    }
    case "this_year": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from, to: now };
    }
    case "this_month":
    default: {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    }
  }
}
