import { prisma } from "../../lib/prisma";
import { toNumber } from "../../utils/money";
import { DashboardQuery, endOfDay, resolveDashboardRange, startOfDay } from "./dashboard.schemas";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const dashboardService = {
  async getSummary(query: DashboardQuery) {
    const { from, to } = resolveDashboardRange(query);
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const yesterdayStart = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
    const yesterdayEnd = endOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));

    const [
      todayIncomeAgg,
      yesterdayIncomeAgg,
      todayExpenseAgg,
      yesterdayExpenseAgg,
      activeRentals,
      completedRentals,
      overdueRentals,
      cancelledBookings,
      pendingBookings,
      confirmedBookings,
      availableCars,
      reservedCars,
      rentedCars,
      maintenanceCars,
      totalActiveVehicles,
      recentBookings,
      recentPayments,
      upcomingReturns,
      bookingsByStatus,
      transactionsInRange,
      liveRentals,
    ] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: "INCOME", occurredAt: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "INCOME", occurredAt: { gte: yesterdayStart, lte: yesterdayEnd } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "EXPENSE", occurredAt: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "EXPENSE", occurredAt: { gte: yesterdayStart, lte: yesterdayEnd } }, _sum: { amount: true } }),
      prisma.rental.count({ where: { status: "ACTIVE" } }),
      prisma.rental.count({ where: { status: "COMPLETED", actualReturnAt: { gte: from, lte: to } } }),
      prisma.rental.count({ where: { status: "OVERDUE" } }),
      prisma.booking.count({ where: { status: "CANCELLED", createdAt: { gte: from, lte: to } } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.vehicle.count({ where: { status: "AVAILABLE", isActive: true } }),
      prisma.vehicle.count({ where: { status: "RESERVED", isActive: true } }),
      prisma.vehicle.count({ where: { status: "RENTED", isActive: true } }),
      prisma.vehicle.count({ where: { status: "MAINTENANCE", isActive: true } }),
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.booking.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { firstName: true, lastName: true } }, vehicle: { select: { plateNumber: true, brand: true, model: true } } },
      }),
      prisma.payment.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { firstName: true, lastName: true } } },
      }),
      prisma.rental.findMany({
        where: { status: "ACTIVE", expectedReturnAt: { gte: today, lte: new Date(today.getTime() + 48 * 60 * 60 * 1000) } },
        include: { customer: { select: { firstName: true, lastName: true } }, vehicle: { select: { plateNumber: true, brand: true, model: true } } },
        orderBy: { expectedReturnAt: "asc" },
        take: 10,
      }),
      prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.transaction.findMany({ where: { occurredAt: { gte: from, lte: to } }, select: { type: true, amount: true, occurredAt: true } }),
      prisma.rental.findMany({
        where: { status: { in: ["ACTIVE", "OVERDUE"] } },
        include: { customer: { select: { firstName: true, lastName: true } }, vehicle: { select: { plateNumber: true, brand: true, model: true } } },
        orderBy: { checkoutAt: "desc" },
        take: 10,
      }),
    ]);

    const todayIncome = toNumber(todayIncomeAgg._sum.amount);
    const yesterdayIncome = toNumber(yesterdayIncomeAgg._sum.amount);
    const todayExpenses = toNumber(todayExpenseAgg._sum.amount);
    const yesterdayExpenses = toNumber(yesterdayExpenseAgg._sum.amount);

    const pctChange = (curr: number, prev: number) => (prev === 0 ? (curr > 0 ? 100 : 0) : Number((((curr - prev) / prev) * 100).toFixed(1)));

    // Build a day-by-day revenue/expense/profit series across the requested range.
    const seriesMap = new Map<string, { income: number; expense: number }>();
    for (const tx of transactionsInRange) {
      const key = dateKey(tx.occurredAt);
      const entry = seriesMap.get(key) ?? { income: 0, expense: 0 };
      if (tx.type === "INCOME") entry.income += toNumber(tx.amount);
      else entry.expense += toNumber(tx.amount);
      seriesMap.set(key, entry);
    }
    const series = Array.from(seriesMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({ date, income: v.income, expense: v.expense, profit: Number((v.income - v.expense).toFixed(2)) }));

    const vehicleUtilization = totalActiveVehicles > 0 ? Number(((rentedCars / totalActiveVehicles) * 100).toFixed(1)) : 0;

    return {
      stats: {
        todayIncome,
        todayIncomeChangePct: pctChange(todayIncome, yesterdayIncome),
        todayExpenses,
        todayExpensesChangePct: pctChange(todayExpenses, yesterdayExpenses),
        profit: Number((todayIncome - todayExpenses).toFixed(2)),
        activeRentals,
        completedRentals,
        overdueRentals,
        cancelledBookings,
        pendingBookings,
        confirmedBookings,
        availableCars,
        reservedCars,
        rentedCars,
        maintenanceCars,
        totalActiveVehicles,
        vehicleUtilization,
      },
      charts: {
        revenueExpenseProfitSeries: series,
        bookingStatusBreakdown: bookingsByStatus.map((b) => ({ status: b.status, count: b._count._all })),
      },
      recentBookings,
      recentPayments,
      upcomingReturns,
      liveCarStatus: liveRentals,
    };
  },
};
