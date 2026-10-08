import { api } from "../../lib/api";
import { Booking, Paginated } from "../../types";

export const bookingsApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<Booking>>("/bookings", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ booking: Booking }>(`/bookings/${id}`).then((r) => r.data.booking),
  create: (input: Record<string, unknown>) => api.post<{ booking: Booking }>("/bookings", input).then((r) => r.data.booking),
  update: (id: string, input: Record<string, unknown>) => api.patch<{ booking: Booking }>(`/bookings/${id}`, input).then((r) => r.data.booking),
  changeStatus: (id: string, status: string, reason?: string) =>
    api.patch<{ booking: Booking }>(`/bookings/${id}/status`, { status, reason }).then((r) => r.data.booking),
};
