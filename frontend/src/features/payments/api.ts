import { api } from "../../lib/api";
import { Paginated, Payment } from "../../types";

export const paymentsApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<Payment>>("/payments", { params }).then((r) => r.data),
  create: (input: Record<string, unknown>) => api.post<{ payment: Payment }>("/payments", input).then((r) => r.data.payment),
};
