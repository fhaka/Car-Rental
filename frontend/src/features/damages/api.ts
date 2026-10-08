import { api } from "../../lib/api";
import { DamageReport, Paginated } from "../../types";

export const damagesApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<DamageReport>>("/damages", { params }).then((r) => r.data),
  create: (input: Record<string, unknown>) => api.post<{ damage: DamageReport }>("/damages", input).then((r) => r.data.damage),
  update: (id: string, input: Record<string, unknown>) => api.patch<{ damage: DamageReport }>(`/damages/${id}`, input).then((r) => r.data.damage),
};
