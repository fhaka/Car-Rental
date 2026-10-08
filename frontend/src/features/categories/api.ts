import { api } from "../../lib/api";
import { Paginated, VehicleCategory } from "../../types";

export const categoriesApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<VehicleCategory>>("/vehicle-categories", { params }).then((r) => r.data),
  create: (input: { name: string; description?: string }) =>
    api.post<{ category: VehicleCategory }>("/vehicle-categories", input).then((r) => r.data.category),
  update: (id: string, input: Partial<{ name: string; description: string; isActive: boolean }>) =>
    api.patch<{ category: VehicleCategory }>(`/vehicle-categories/${id}`, input).then((r) => r.data.category),
  archive: (id: string) => api.delete<{ category: VehicleCategory }>(`/vehicle-categories/${id}`).then((r) => r.data.category),
};
