import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useBookings } from "../../features/bookings/useBookings";
import { formatCurrency, formatDate } from "../../lib/format";

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "NO_SHOW"];

export default function BookingsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useBookings({ page, pageSize: 10, search: search || undefined, status: status || undefined });

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Manage reservations from request to confirmation"
        actions={
          <button className="btn-primary" onClick={() => navigate("/bookings/new")}>
            <Plus size={16} /> New Booking
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder="Search booking #, customer or plate…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select className="input !w-44" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(b) => b.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          onRowClick={(b) => navigate(`/bookings/${b.id}`)}
          emptyTitle="No bookings found"
          columns={[
            { header: "Booking #", accessor: (b) => <span className="font-medium text-slate-800">{b.bookingNumber}</span> },
            { header: "Customer", accessor: (b) => `${b.customer?.firstName} ${b.customer?.lastName}` },
            { header: "Vehicle", accessor: (b) => `${b.vehicle?.brand} ${b.vehicle?.model}` },
            { header: "Pickup", accessor: (b) => formatDate(b.pickupAt) },
            { header: "Return", accessor: (b) => formatDate(b.returnAt) },
            { header: "Total", accessor: (b) => formatCurrency(b.totalAmount) },
            { header: "Balance", accessor: (b) => (Number(b.remainingBalance) > 0 ? <span className="text-red-500 font-medium">{formatCurrency(b.remainingBalance)}</span> : formatCurrency(0)) },
            { header: "Status", accessor: (b) => <StatusBadge status={b.status} /> },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
