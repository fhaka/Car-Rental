import { api } from "../../lib/api";
import { Expense, Paginated } from "../../types";

export const expensesApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<Expense>>("/expenses", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ expense: Expense }>(`/expenses/${id}`).then((r) => r.data.expense),
  create: (input: Record<string, unknown>) => api.post<{ expense: Expense }>("/expenses", input).then((r) => r.data.expense),
  update: (id: string, input: Record<string, unknown>) => api.patch<{ expense: Expense }>(`/expenses/${id}`, input).then((r) => r.data.expense),
  archive: (id: string) => api.post<{ expense: Expense }>(`/expenses/${id}/archive`).then((r) => r.data.expense),
};
