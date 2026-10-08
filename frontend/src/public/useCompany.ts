import { useQuery } from "@tanstack/react-query";
import { publicApi, PublicCompany } from "./publicApi";

/** Shared company-settings query used by the public header, footer and content pages. */
export function useCompany() {
  return useQuery<PublicCompany>({
    queryKey: ["public", "company"],
    queryFn: publicApi.getCompany,
    staleTime: 5 * 60_000,
  });
}
