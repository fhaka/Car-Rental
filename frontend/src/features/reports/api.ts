import { api } from "../../lib/api";

export interface ReportsSummary {
  range: { from: string; to: string };
  totals: { totalRevenue: number; totalExpenses: number; grossProfit: number };
  revenueByMonth: { period: string; value: number }[];
  expensesByMonth: { period: string; value: number }[];
  bookingsByMonth: { period: string; value: number }[];
  rentalsByMonth: { period: string; value: number }[];
  bookingsByStatus: { status: string; count: number }[];
  vehicleUtilization: number;
  mostRentedVehicles: { vehicle: string; plateNumber: string; revenue: number; rentalCount: number }[];
  leastRentedVehicles: { vehicle: string; plateNumber: string; revenue: number; rentalCount: number }[];
  revenueByVehicle: { vehicle: string; plateNumber: string; revenue: number; rentalCount: number }[];
  maintenanceCostByVehicle: { vehicle: string; plateNumber: string; cost: number }[];
  customerRentalFrequency: { customerId: string; name: string; rentalCount: number }[];
  overdueRentals: number;
  cancelledBookings: number;
  unpaidBalances: { bookingId: string; bookingNumber: string; customer: string; amount: number }[];
}

export const reportsApi = {
  summary: (params: Record<string, unknown> = {}) => api.get<ReportsSummary>("/reports/summary", { params }).then((r) => r.data),
};
