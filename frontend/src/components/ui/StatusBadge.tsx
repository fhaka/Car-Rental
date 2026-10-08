import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  // Vehicle
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  RESERVED: "bg-amber-50 text-amber-700",
  RENTED: "bg-blue-50 text-blue-700",
  MAINTENANCE: "bg-orange-50 text-orange-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  // Booking / Rental
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-50 text-red-600",
  NO_SHOW: "bg-red-50 text-red-600",
  OVERDUE: "bg-red-50 text-red-600",
  // Payment
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-purple-50 text-purple-700",
  PARTIALLY_REFUNDED: "bg-purple-50 text-purple-700",
  // Damage
  REPORTED: "bg-amber-50 text-amber-700",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  REPAIR_SCHEDULED: "bg-orange-50 text-orange-700",
  REPAIRED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-500",
  // Maintenance
  SCHEDULED: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-orange-50 text-orange-700",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  return <span className={clsx("badge", style)}>{status.replace(/_/g, " ")}</span>;
}
