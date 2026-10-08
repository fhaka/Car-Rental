import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useRentals } from "../../features/rentals/useRentals";
import { formatCurrency, formatDateTime } from "../../lib/format";

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "COMPLETED", "OVERDUE", "CANCELLED"];

export default function RentalsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useRentals({ page, pageSize: 10, search: search || undefined, status: status || undefined });

  return (
    <div>
      <PageHeader
        title="Rentals"
        description="Active and historical vehicle rentals"
        actions={
          <button className="btn-primary" onClick={() => navigate("/rentals/checkout")}>
            <KeyRound size={16} /> Walk-in Checkout
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder="Search rental #, customer or plate…"
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
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(r) => r.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          onRowClick={(r) => navigate(`/rentals/${r.id}`)}
          emptyTitle="No rentals found"
          columns={[
            { header: "Rental #", accessor: (r) => <span className="font-medium text-slate-800">{r.rentalNumber}</span> },
            { header: "Customer", accessor: (r) => `${r.customer?.firstName} ${r.customer?.lastName}` },
            { header: "Vehicle", accessor: (r) => `${r.vehicle?.brand} ${r.vehicle?.model} (${r.vehicle?.plateNumber})` },
            { header: "Checkout", accessor: (r) => formatDateTime(r.checkoutAt) },
            { header: "Due back", accessor: (r) => formatDateTime(r.expectedReturnAt) },
            { header: "Final amount", accessor: (r) => (Number(r.finalAmount) > 0 ? formatCurrency(r.finalAmount) : "—") },
            { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
