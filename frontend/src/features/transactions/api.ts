import { api } from "../../lib/api";
import { Paginated, Transaction } from "../../types";

export const transactionsApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<Transaction>>("/transactions", { params }).then((r) => r.data),
};
