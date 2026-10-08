import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { useCustomers } from "../../features/customers/useCustomers";

export default function CustomersListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useCustomers({ page, pageSize: 10, search: search || undefined });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer profiles and rental history"
        actions={
          <button className="btn-primary" onClick={() => navigate("/customers/new")}>
            <Plus size={16} /> Add Customer
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input !pl-9"
            placeholder="Search name, email, phone or license…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(c) => c.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          emptyTitle="No customers found"
          columns={[
            {
              header: "Name",
              accessor: (c) => (
                <div>
                  <p className="font-medium text-slate-800">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{c.email}</p>
                </div>
              ),
            },
            { header: "Phone", accessor: (c) => c.phone },
            { header: "City", accessor: (c) => c.city ?? "—" },
            { header: "License", accessor: (c) => c.driverLicenseNumber ?? "—" },
            {
              header: "Status",
              accessor: (c) => (c.isActive ? <span className="badge bg-emerald-50 text-emerald-700">Active</span> : <span className="badge bg-slate-100 text-slate-500">Inactive</span>),
            },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
