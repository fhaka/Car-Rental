import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";

export function useReportsSummary(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["reports", "summary", params], queryFn: () => reportsApi.summary(params) });
}
