import { api } from "../../lib/api";

export interface GlobalSearchResult {
  vehicles: { id: string; plateNumber: string; brand: string; model: string; status: string }[];
  customers: { id: string; firstName: string; lastName: string; email: string; phone: string }[];
  bookings: { id: string; bookingNumber: string; status: string; pickupAt: string; returnAt: string }[];
  rentals: { id: string; rentalNumber: string; status: string }[];
}

export const searchApi = {
  search: (q: string) => api.get<GlobalSearchResult>("/search", { params: { q } }).then((r) => r.data),
};
