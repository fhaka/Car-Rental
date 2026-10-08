import { api } from "../../lib/api";
import { Paginated, Vehicle } from "../../types";

export const vehiclesApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<Vehicle>>("/vehicles", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ vehicle: Vehicle }>(`/vehicles/${id}`).then((r) => r.data.vehicle),
  create: (input: Record<string, unknown>) => api.post<{ vehicle: Vehicle }>("/vehicles", input).then((r) => r.data.vehicle),
  update: (id: string, input: Record<string, unknown>) => api.patch<{ vehicle: Vehicle }>(`/vehicles/${id}`, input).then((r) => r.data.vehicle),
  changeStatus: (id: string, status: string, notes?: string) =>
    api.patch<{ vehicle: Vehicle }>(`/vehicles/${id}/status`, { status, notes }).then((r) => r.data.vehicle),
  archive: (id: string) => api.post<{ vehicle: Vehicle }>(`/vehicles/${id}/archive`).then((r) => r.data.vehicle),
  remove: (id: string) => api.delete(`/vehicles/${id}`),
  uploadImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    return api.post<{ vehicle: Vehicle }>(`/vehicles/${id}/images`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data.vehicle);
  },
  removeImage: (id: string, imageId: string) => api.delete<{ vehicle: Vehicle }>(`/vehicles/${id}/images/${imageId}`).then((r) => r.data.vehicle),
  setPrimaryImage: (id: string, imageId: string) =>
    api.patch<{ vehicle: Vehicle }>(`/vehicles/${id}/images/${imageId}/primary`).then((r) => r.data.vehicle),
};
