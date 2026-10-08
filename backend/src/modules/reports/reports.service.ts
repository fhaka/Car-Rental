import { prisma } from "../../lib/prisma";
import { toNumber } from "../../utils/money";
import { ReportsQuery, resolveReportRange } from "./reports.schemas";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const reportsService = {
  async summary(query: ReportsQuery) {
    const { from, to } = resolveReportRange(query);

    const [transactions, bookings, rentals, vehicles, maintenanceRecords, customers] = await Promise.all([
      prisma.transaction.findMany({ where: { occurredAt: { gte: from, lte: to } } }),
      prisma.booking.findMany({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.rental.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: { vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } } },
      }),
      prisma.vehicle.findMany({ where: { isActive: true } }),
      prisma.maintenanceRecord.findMany({
        where: { serviceDate: { gte: from, lte: to } },
        include: { vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } } },
      }),
      prisma.customer.findMany({ include: { _count: { select: { rentals: true } } } }),
    ]);

    const totalRevenue = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + toNumber(t.amount), 0);
    const totalExpenses = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + toNumber(t.amount), 0);
    const grossProfit = Number((totalRevenue - totalExpenses).toFixed(2));

    const revenueByMonth = new Map<string, number>();
    const expensesByMonth = new Map<string, number>();
    for (const t of transactions) {
      const key = monthKey(t.occurredAt);
      if (t.type === "INCOME") revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + toNumber(t.amount));
      else expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + toNumber(t.amount));
    }

    const bookingsByMonth = new Map<string, number>();
    const bookingsByStatus = new Map<string, number>();
    for (const b of bookings) {
      const key = monthKey(b.createdAt);
      bookingsByMonth.set(key, (bookingsByMonth.get(key) ?? 0) + 1);
      bookingsByStatus.set(b.status, (bookingsByStatus.get(b.status) ?? 0) + 1);
    }
    const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;

    const rentalsByMonth = new Map<string, number>();
    const revenueByVehicle = new Map<string, { vehicle: string; plateNumber: string; revenue: number; rentalCount: number }>();
    for (const r of rentals) {
      const key = monthKey(r.createdAt);
      rentalsByMonth.set(key, (rentalsByMonth.get(key) ?? 0) + 1);
      const vKey = r.vehicleId;
      const entry = revenueByVehicle.get(vKey) ?? {
        vehicle: `${r.vehicle.brand} ${r.vehicle.model}`,
        plateNumber: r.vehicle.plateNumber,
        revenue: 0,
        rentalCount: 0,
      };
      entry.revenue += toNumber(r.finalAmount);
      entry.rentalCount += 1;
      revenueByVehicle.set(vKey, entry);
    }
    const overdueRentals = rentals.filter((r) => r.status === "OVERDUE").length;

    const rentalCountByVehicle = Array.from(revenueByVehicle.values()).sort((a, b) => b.rentalCount - a.rentalCount);
    const mostRented = rentalCountByVehicle.slice(0, 5);
    const leastRented = [...rentalCountByVehicle].sort((a, b) => a.rentalCount - b.rentalCount).slice(0, 5);

    const totalActiveVehicles = vehicles.length;
    const rentedNow = vehicles.filter((v) => v.status === "RENTED").length;
    const vehicleUtilization = totalActiveVehicles > 0 ? Number(((rentedNow / totalActiveVehicles) * 100).toFixed(1)) : 0;

    const maintenanceCostByVehicle = new Map<string, { vehicle: string; plateNumber: string; cost: number }>();
    for (const m of maintenanceRecords) {
      const entry = maintenanceCostByVehicle.get(m.vehicleId) ?? {
        vehicle: `${m.vehicle.brand} ${m.vehicle.model}`,
        plateNumber: m.vehicle.plateNumber,
        cost: 0,
      };
      entry.cost += toNumber(m.cost);
      maintenanceCostByVehicle.set(m.vehicleId, entry);
    }

    const customerRentalFrequency = customers
      .filter((c) => c._count.rentals > 0)
      .map((c) => ({ customerId: c.id, name: `${c.firstName} ${c.lastName}`, rentalCount: c._count.rentals }))
      .sort((a, b) => b.rentalCount - a.rentalCount)
      .slice(0, 10);

    const unpaidBookings = await prisma.booking.findMany({
      where: { remainingBalance: { gt: 0 }, status: { in: ["ACTIVE", "COMPLETED"] } },
      select: { id: true, bookingNumber: true, remainingBalance: true, customer: { select: { firstName: true, lastName: true } } },
    });

    return {
      range: { from, to },
      totals: { totalRevenue: Number(totalRevenue.toFixed(2)), totalExpenses: Number(totalExpenses.toFixed(2)), grossProfit },
      revenueByMonth: mapToSortedArray(revenueByMonth),
      expensesByMonth: mapToSortedArray(expensesByMonth),
      bookingsByMonth: mapToSortedArray(bookingsByMonth),
      rentalsByMonth: mapToSortedArray(rentalsByMonth),
      bookingsByStatus: Array.from(bookingsByStatus.entries()).map(([status, count]) => ({ status, count })),
      vehicleUtilization,
      mostRentedVehicles: mostRented,
      leastRentedVehicles: leastRented,
      revenueByVehicle: Array.from(revenueByVehicle.values()).sort((a, b) => b.revenue - a.revenue),
      maintenanceCostByVehicle: Array.from(maintenanceCostByVehicle.values()).sort((a, b) => b.cost - a.cost),
      customerRentalFrequency,
      overdueRentals,
      cancelledBookings,
      unpaidBalances: unpaidBookings.map((b) => ({
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        customer: `${b.customer.firstName} ${b.customer.lastName}`,
        amount: toNumber(b.remainingBalance),
      })),
    };
  },
};

function mapToSortedArray(m: Map<string, number>) {
  return Array.from(m.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([period, value]) => ({ period, value: Number(value.toFixed(2)) }));
}
