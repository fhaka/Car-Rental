import { ReactNode, useState } from "react";
import { BarChart3, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { useReportsSummary } from "../../features/reports/useReports";
import { formatCurrency, toDateInputValue } from "../../lib/format";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3563f0",
  ACTIVE: "#22c55e",
  COMPLETED: "#94a3b8",
  CANCELLED: "#ef4444",
  NO_SHOW: "#ef4444",
};

export default function ReportsPage() {
  const [preset, setPreset] = useState("this_month");
  const [from, setFrom] = useState(toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(toDateInputValue(new Date()));

  const { data, isLoading } = useReportsSummary({
    preset,
    ...(preset === "custom" ? { from: new Date(from).toISOString(), to: new Date(to).toISOString() } : {}),
  });

  return (
    <div>
      <PageHeader title="Analytics & Reports" description="Revenue, fleet utilization and operational performance for the selected period" />

      <div className="card mb-6 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className="input !w-48" value={preset} onChange={(e) => setPreset(e.target.value)}>
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {preset === "custom" && (
            <>
              <input type="date" className="input !w-44" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="text-sm text-slate-400">to</span>
              <input type="date" className="input !w-44" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          )}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <StatCard label="Total revenue" value={formatCurrency(data.totals.totalRevenue)} icon={<TrendingUp size={18} />} tone="brand" />
            <StatCard label="Total expenses" value={formatCurrency(data.totals.totalExpenses)} icon={<TrendingDown size={18} />} />
            <StatCard label="Gross profit" value={formatCurrency(data.totals.grossProfit)} icon={<Wallet size={18} />} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
            <div className="card lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">Revenue vs expenses by month</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mergeSeries(data.revenueByMonth, data.expensesByMonth)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 10, border: "1px solid #eef1f6", fontSize: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#3563f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">Bookings by status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.bookingsByStatus} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {data.bookingsByStatus.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #eef1f6", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {data.bookingsByStatus.map((s) => (
                  <div key={s.status} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#94a3b8" }} />
                    {s.status.replace(/_/g, " ")} ({s.count})
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">Fleet utilization</span>
                <span className="font-semibold text-slate-800">{data.vehicleUtilization}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
            <ReportTable
              title="Most rented vehicles"
              rows={data.mostRentedVehicles}
              cols={[
                { header: "Vehicle", render: (r) => `${r.vehicle} (${r.plateNumber})` },
                { header: "Rentals", render: (r) => r.rentalCount },
                { header: "Revenue", render: (r) => formatCurrency(r.revenue) },
              ]}
            />
            <ReportTable
              title="Revenue by vehicle"
              rows={data.revenueByVehicle.slice(0, 8)}
              cols={[
                { header: "Vehicle", render: (r) => `${r.vehicle} (${r.plateNumber})` },
                { header: "Rentals", render: (r) => r.rentalCount },
                { header: "Revenue", render: (r) => formatCurrency(r.revenue) },
              ]}
            />
            <ReportTable
              title="Maintenance cost by vehicle"
              rows={data.maintenanceCostByVehicle}
              cols={[
                { header: "Vehicle", render: (r) => `${r.vehicle} (${r.plateNumber})` },
                { header: "Cost", render: (r) => formatCurrency(r.cost) },
              ]}
            />
            <ReportTable
              title="Top customers by rentals"
              rows={data.customerRentalFrequency}
              cols={[
                { header: "Customer", render: (r) => r.name },
                { header: "Rentals", render: (r) => r.rentalCount },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-1 text-sm font-semibold text-slate-800">Operational flags</h3>
              <p className="mb-4 text-xs text-slate-400">Issues worth reviewing for the selected period</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-red-50 p-4">
                  <div className="text-2xl font-bold text-red-600">{data.overdueRentals}</div>
                  <div className="text-xs text-red-500">Overdue rentals</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <div className="text-2xl font-bold text-amber-600">{data.cancelledBookings}</div>
                  <div className="text-xs text-amber-500">Cancelled bookings</div>
                </div>
              </div>
            </div>
            <ReportTable
              title="Unpaid balances"
              rows={data.unpaidBalances}
              cols={[
                { header: "Booking #", render: (r) => r.bookingNumber },
                { header: "Customer", render: (r) => r.customer },
                { header: "Amount due", render: (r) => formatCurrency(r.amount) },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}

function mergeSeries(revenue: { period: string; value: number }[], expense: { period: string; value: number }[]) {
  const map = new Map<string, { period: string; revenue: number; expense: number }>();
  for (const r of revenue) map.set(r.period, { period: r.period, revenue: r.value, expense: 0 });
  for (const e of expense) {
    const existing = map.get(e.period) ?? { period: e.period, revenue: 0, expense: 0 };
    existing.expense = e.value;
    map.set(e.period, existing);
  }
  return Array.from(map.values()).sort((a, b) => (a.period < b.period ? -1 : 1));
}

function ReportTable<T>({ title, rows, cols }: { title: string; rows: T[]; cols: { header: string; render: (row: T) => ReactNode }[] }) {
  return (
    <div className="card !p-0">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <BarChart3 size={28} strokeWidth={1.5} />
          <p className="mt-2 text-sm">No data for this period</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              {cols.map((c, i) => (
                <th key={i} className="px-5 py-2.5 font-medium text-slate-500">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t border-slate-50">
                {cols.map((c, ci) => (
                  <td key={ci} className="px-5 py-2.5 text-slate-700">
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
