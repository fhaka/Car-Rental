import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "./api";

export function useTransactions(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["transactions", params], queryFn: () => transactionsApi.list(params) });
}
