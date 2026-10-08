import { useQuery } from "@tanstack/react-query";
import { activityApi } from "./api";

export function useActivityLog(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["activity", params], queryFn: () => activityApi.list(params) });
}
