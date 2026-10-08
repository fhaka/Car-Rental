import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../../features/notifications/useNotifications";
import { formatRelativeToNow } from "../../lib/format";
import { AppNotification } from "../../types";

const TYPE_STYLES: Record<string, string> = {
  BOOKING_PENDING: "bg-amber-50 text-amber-600",
  RENTAL_OVERDUE: "bg-red-50 text-red-600",
  UPCOMING_RETURN: "bg-blue-50 text-blue-600",
  UNPAID_BALANCE: "bg-red-50 text-red-600",
  INSURANCE_EXPIRING: "bg-orange-50 text-orange-600",
  REGISTRATION_EXPIRING: "bg-orange-50 text-orange-600",
  MAINTENANCE_DUE: "bg-orange-50 text-orange-600",
  VEHICLE_UNAVAILABLE: "bg-slate-100 text-slate-600",
  DAMAGE_REPORTED: "bg-red-50 text-red-600",
  SYSTEM: "bg-blue-50 text-blue-600",
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"" | "unread">("");
  const { data, isLoading } = useNotifications({ page, pageSize: 15, isRead: filter === "unread" ? false : undefined });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={data ? `${data.unreadCount} unread notification${data.unreadCount === 1 ? "" : "s"}` : "System and business-rule alerts"}
        actions={
          <button className="btn-secondary" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending || !data?.unreadCount}>
            <CheckCheck size={16} /> Mark all as read
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <div className="flex gap-2">
          <button className={clsx("btn-secondary !py-1.5", filter === "" && "!bg-brand-50 !text-brand-600 !border-brand-200")} onClick={() => setFilter("")}>
            All
          </button>
          <button className={clsx("btn-secondary !py-1.5", filter === "unread" && "!bg-brand-50 !text-brand-600 !border-brand-200")} onClick={() => setFilter("unread")}>
            Unread
          </button>
        </div>
      </div>

      <div className="card !p-0">
        {isLoading ? (
          <TableSkeleton rows={8} cols={1} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up." icon={<Bell size={40} strokeWidth={1.5} />} />
        ) : (
          <div className="divide-y divide-slate-50">
            {data.data.map((n: AppNotification) => (
              <div
                key={n.id}
                className={clsx("flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50", !n.isRead && "bg-brand-50/30")}
                onClick={() => !n.isRead && markRead.mutate(n.id)}
              >
                <span className={clsx("mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", TYPE_STYLES[n.type] ?? "bg-slate-100 text-slate-600")}>
                  {n.type.replace(/_/g, " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm", n.isRead ? "text-slate-600" : "font-semibold text-slate-800")}>{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatRelativeToNow(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />}
              </div>
            ))}
          </div>
        )}
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
