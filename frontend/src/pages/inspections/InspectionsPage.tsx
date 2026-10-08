import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { inspectionsApi } from "../../features/inspections/api";
import { formatDateTime } from "../../lib/format";

export default function InspectionsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["inspections", page, type],
    queryFn: () => inspectionsApi.list({ page, pageSize: 10, type: type || undefined }),
  });

  return (
    <div>
      <PageHeader title="Vehicle Inspections" description="Pre-rental and post-rental condition checks, recorded automatically at checkout and check-in" />

      <div className="card mb-4 !p-4">
        <select className="input !w-52" value={type} onChange={(e) => (setType(e.target.value), setPage(1))}>
          <option value="">All types</option>
          <option value="PRE_RENTAL">Pre-rental</option>
          <option value="POST_RENTAL">Post-rental</option>
        </select>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(i) => i.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          emptyTitle="No inspections recorded yet"
          emptyDescription="Inspections are created automatically during rental checkout and check-in."
          columns={[
            { header: "Vehicle", accessor: (i) => `${i.vehicle?.brand} ${i.vehicle?.model} (${i.vehicle?.plateNumber})` },
            { header: "Type", accessor: (i) => (i.type === "PRE_RENTAL" ? "Pre-rental" : "Post-rental") },
            { header: "Date", accessor: (i) => formatDateTime(i.inspectionDate) },
            { header: "Mileage", accessor: (i) => `${i.mileage.toLocaleString()} km` },
            { header: "Fuel", accessor: (i) => `${i.fuelLevel}%` },
            { header: "Exterior", accessor: (i) => i.exteriorCondition },
            { header: "Interior", accessor: (i) => i.interiorCondition },
            { header: "Inspector", accessor: (i) => (i.inspector ? `${i.inspector.firstName} ${i.inspector.lastName}` : "—") },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
