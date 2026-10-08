import { api } from "../../lib/api";
import { Paginated, Rental } from "../../types";

export const rentalsApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<Rental>>("/rentals", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ rental: Rental }>(`/rentals/${id}`).then((r) => r.data.rental),
  checkout: (input: Record<string, unknown>) => api.post<{ rental: Rental }>("/rentals/checkout", input).then((r) => r.data.rental),
  extend: (id: string, newExpectedReturnAt: string) =>
    api.patch<{ rental: Rental }>(`/rentals/${id}/extend`, { newExpectedReturnAt }).then((r) => r.data.rental),
  checkin: (id: string, input: Record<string, unknown>) => api.post<{ rental: Rental }>(`/rentals/${id}/checkin`, input).then((r) => r.data.rental),
  cancel: (id: string, reason?: string) => api.patch<{ rental: Rental }>(`/rentals/${id}/cancel`, { reason }).then((r) => r.data.rental),
};
