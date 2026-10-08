import { api } from "../../lib/api";
import { Booking, Customer, Paginated, Payment, Rental } from "../../types";

export const customersApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<Customer>>("/customers", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ customer: Customer; summary: { totalBookings: number; totalRentals: number; totalPaid: number; outstandingBalance: number } }>(`/customers/${id}`).then((r) => r.data),
  create: (input: Record<string, unknown>) => api.post<{ customer: Customer }>("/customers", input).then((r) => r.data.customer),
  update: (id: string, input: Record<string, unknown>) => api.patch<{ customer: Customer }>(`/customers/${id}`, input).then((r) => r.data.customer),
  deactivate: (id: string) => api.post<{ customer: Customer }>(`/customers/${id}/deactivate`).then((r) => r.data.customer),
  bookings: (id: string, params: Record<string, unknown> = {}) => api.get<Paginated<Booking>>(`/customers/${id}/bookings`, { params }).then((r) => r.data),
  rentals: (id: string, params: Record<string, unknown> = {}) => api.get<Paginated<Rental>>(`/customers/${id}/rentals`, { params }).then((r) => r.data),
  payments: (id: string, params: Record<string, unknown> = {}) => api.get<Paginated<Payment>>(`/customers/${id}/payments`, { params }).then((r) => r.data),
};
