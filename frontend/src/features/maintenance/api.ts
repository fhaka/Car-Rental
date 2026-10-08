import { api } from "../../lib/api";
import { MaintenanceRecord, Paginated } from "../../types";

export const maintenanceApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<MaintenanceRecord>>("/maintenance", { params }).then((r) => r.data),
  create: (input: Record<string, unknown>) => api.post<{ record: MaintenanceRecord }>("/maintenance", input).then((r) => r.data.record),
  update: (id: string, input: Record<string, unknown>) => api.patch<{ record: MaintenanceRecord }>(`/maintenance/${id}`, input).then((r) => r.data.record),
};
