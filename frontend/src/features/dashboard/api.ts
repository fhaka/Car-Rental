import { api } from "../../lib/api";

export interface DashboardResponse {
  stats: {
    todayIncome: number;
    todayIncomeChangePct: number;
    todayExpenses: number;
    todayExpensesChangePct: number;
    profit: number;
    activeRentals: number;
    completedRentals: number;
    overdueRentals: number;
    cancelledBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    availableCars: number;
    reservedCars: number;
    rentedCars: number;
    maintenanceCars: number;
    totalActiveVehicles: number;
    vehicleUtilization: number;
  };
  charts: {
    revenueExpenseProfitSeries: { date: string; income: number; expense: number; profit: number }[];
    bookingStatusBreakdown: { status: string; count: number }[];
  };
  recentBookings: any[];
  recentPayments: any[];
  upcomingReturns: any[];
  liveCarStatus: any[];
}

export const dashboardApi = {
  summary: (params: Record<string, unknown> = {}) => api.get<DashboardResponse>("/dashboard", { params }).then((r) => r.data),
};
