import { useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { useActivityLog } from "../../features/activity/useActivity";
import { useUsersList } from "../../features/users/useUsers";
import { formatDateTime } from "../../lib/format";

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const { data, isLoading } = useActivityLog({ page, pageSize: 15, userId: userId || undefined });
  const { data: users } = useUsersList({ pageSize: 100 });

  return (
    <div>
      <PageHeader title="Activity Log" description="Full audit trail of user actions across the system" />

      <div className="card mb-4 !p-4">
        <select className="input !w-64" value={userId} onChange={(e) => (setUserId(e.target.value), setPage(1))}>
          <option value="">All users</option>
          {users?.data.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(a) => a.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          emptyTitle="No activity recorded"
          columns={[
            { header: "Date", accessor: (a) => formatDateTime(a.createdAt) },
            { header: "User", accessor: (a) => (a.user ? `${a.user.firstName} ${a.user.lastName}` : "System") },
            { header: "Action", accessor: (a) => <span className="font-medium text-slate-700">{a.action.replace(/_/g, " ")}</span> },
            { header: "Entity", accessor: (a) => a.entityType },
            { header: "IP address", accessor: (a) => a.ipAddress ?? "—" },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
