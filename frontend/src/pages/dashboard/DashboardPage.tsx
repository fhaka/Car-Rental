import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { DollarSign, TrendingDown, TrendingUp, KeyRound, Car, Wrench, Plus, UserPlus, CalendarPlus, Clock } from "lucide-react";
import { dashboardApi } from "../../features/dashboard/api";
import { StatCard } from "../../components/ui/StatCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatCurrency, formatDate, formatDateTime, toDateInputValue } from "../../lib/format";
import { useSettings } from "../../features/settings/useSettings";

const CHART_COLORS = { income: "#3563f0", expense: "#f97316", profit: "#22c55e" };
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3563f0",
  ACTIVE: "#22c55e",
  COMPLETED: "#64748b",
  CANCELLED: "#ef4444",
  NO_SHOW: "#ef4444",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const currency = settings?.currency ?? "USD";

  const [range, setRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return { from: toDateInputValue(from), to: toDateInputValue(to) };
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", range],
    queryFn: () => dashboardApi.summary({ from: range.from, to: range.to }),
  });

  const [checkForm, setCheckForm] = useState({ pickupAt: toDateInputValue(new Date()), pickupTime: "10:00" });

  const bookingStatusData = useMemo(
    () => (data?.charts.bookingStatusBreakdown ?? []).map((s) => ({ name: s.status, value: s.count })),
    [data]
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live overview of your fleet, bookings and revenue"
        actions={
          <div className="flex items-center gap-2">
            <input type="date" className="input !py-2 !w-auto" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" className="input !py-2 !w-auto" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          </div>
        }
      />

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => navigate("/bookings/new")}>
          <CalendarPlus size={16} /> New Booking
        </button>
        <button className="btn-secondary" onClick={() => navigate("/vehicles/new")}>
          <Plus size={16} /> Add Vehicle
        </button>
        <button className="btn-secondary" onClick={() => navigate("/customers/new")}>
          <UserPlus size={16} /> Add Customer
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6 mb-6">
        {isLoading || !data ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Today's Income"
              value={formatCurrency(data.stats.todayIncome, currency)}
              changePct={data.stats.todayIncomeChangePct}
              icon={<DollarSign size={18} />}
              tone="brand"
            />
            <StatCard
              label="Today's Expenses"
              value={formatCurrency(data.stats.todayExpenses, currency)}
              changePct={-data.stats.todayExpensesChangePct}
              icon={<TrendingDown size={18} />}
            />
            <StatCard label="Today's Profit" value={formatCurrency(data.stats.profit, currency)} icon={<TrendingUp size={18} />} />
            <StatCard label="Active Rentals" value={String(data.stats.activeRentals)} icon={<KeyRound size={18} />} />
            <StatCard label="Available Cars" value={String(data.stats.availableCars)} icon={<Car size={18} />} />
            <StatCard label="In Maintenance" value={String(data.stats.maintenanceCars)} icon={<Wrench size={18} />} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: availability check + live status */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Vehicle Availability</h3>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/availability?pickupDate=${checkForm.pickupAt}&pickupTime=${checkForm.pickupTime}`);
              }}
            >
              <div>
                <label className="label">Pickup date</label>
                <input
                  type="date"
                  className="input !w-40"
                  value={checkForm.pickupAt}
                  onChange={(e) => setCheckForm((f) => ({ ...f, pickupAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Pickup time</label>
                <input
                  type="time"
                  className="input !w-32"
                  value={checkForm.pickupTime}
                  onChange={(e) => setCheckForm((f) => ({ ...f, pickupTime: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn-primary">
                Check Availability
              </button>
            </form>
          </div>

          <div className="card !p-0">
            <div className="flex items-center justify-between px-5 pt-5">
              <h3 className="text-sm font-semibold text-slate-800">Live Car Status</h3>
              <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => navigate("/rentals")}>
                View all
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="px-5 py-2.5 font-medium">Car</th>
                    <th className="px-5 py-2.5 font-medium">Customer</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Due back</th>
                    <th className="px-5 py-2.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                        Loading…
                      </td>
                    </tr>
                  ) : (data?.liveCarStatus.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                        No active rentals right now
                      </td>
                    </tr>
                  ) : (
                    data!.liveCarStatus.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {r.vehicle.brand} {r.vehicle.model}
                          <span className="ml-1.5 text-xs text-slate-400">{r.vehicle.plateNumber}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {r.customer.firstName} {r.customer.lastName}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-3 text-slate-500">{formatDateTime(r.expectedReturnAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => navigate(`/rentals/${r.id}`)}>
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="h-2" />
          </div>

          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Earning Summary</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data?.charts.revenueExpenseProfitSeries ?? []}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.expense} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.expense} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => formatDate(v)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  labelFormatter={(v) => formatDate(v as string)}
                  contentStyle={{ borderRadius: 10, border: "1px solid #eef1f6", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="income" name="Revenue" stroke={CHART_COLORS.income} fill="url(#incomeGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke={CHART_COLORS.expense} fill="url(#expenseGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: booking status donut + recent activity */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Bookings by Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={bookingStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {bookingStatusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #eef1f6", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-2">
              {bookingStatusData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] ?? "#94a3b8" }} />
                    {s.name.replace(/_/g, " ")}
                  </span>
                  <span className="font-medium text-slate-700">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Recent Bookings</h3>
            <div className="space-y-3">
              {(data?.recentBookings ?? []).slice(0, 5).map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{b.customer.firstName} {b.customer.lastName}</p>
                    <p className="text-xs text-slate-400">
                      {b.vehicle.brand} {b.vehicle.model} · {b.bookingNumber}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </button>
              ))}
              {(data?.recentBookings ?? []).length === 0 && <p className="text-sm text-slate-400">No recent bookings</p>}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock size={15} className="text-slate-400" /> Upcoming Returns (48h)
            </h3>
            <div className="space-y-3">
              {(data?.upcomingReturns ?? []).slice(0, 5).map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/rentals/${r.id}`)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {r.vehicle.brand} {r.vehicle.model}
                    </p>
                    <p className="text-xs text-slate-400">{r.customer.firstName} {r.customer.lastName}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(r.expectedReturnAt)}</span>
                </button>
              ))}
              {(data?.upcomingReturns ?? []).length === 0 && <p className="text-sm text-slate-400">No returns due soon</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
