import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Car as CarIcon } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useVehicles } from "../../features/vehicles/useVehicles";
import { useCategories } from "../../features/categories/useCategories";
import { formatCurrency } from "../../lib/format";

const STATUS_OPTIONS = ["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "INACTIVE"];

export default function VehiclesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const { data: categories } = useCategories({ pageSize: 50 });
  const { data, isLoading } = useVehicles({ page, pageSize: 10, search: search || undefined, status: status || undefined, categoryId: categoryId || undefined });

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Manage your fleet inventory"
        actions={
          <button className="btn-primary" onClick={() => navigate("/vehicles/new")}>
            <Plus size={16} /> Add Vehicle
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder="Search plate, VIN, brand or model…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select className="input !w-40" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="input !w-44" value={categoryId} onChange={(e) => (setCategoryId(e.target.value), setPage(1))}>
            <option value="">All categories</option>
            {categories?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(v) => v.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          onRowClick={(v) => navigate(`/vehicles/${v.id}`)}
          emptyTitle="No vehicles found"
          emptyDescription="Try adjusting your filters, or add your first vehicle."
          columns={[
            {
              header: "Vehicle",
              accessor: (v) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {v.images[0] ? (
                      <img src={v.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CarIcon size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-xs text-slate-400">
                      {v.year} · {v.plateNumber}
                    </p>
                  </div>
                </div>
              ),
            },
            { header: "Category", accessor: (v) => v.category?.name ?? "—" },
            { header: "Transmission", accessor: (v) => v.transmission },
            { header: "Fuel", accessor: (v) => v.fuelType },
            { header: "Daily Rate", accessor: (v) => formatCurrency(v.dailyRate) },
            { header: "Status", accessor: (v) => <StatusBadge status={v.status} /> },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
