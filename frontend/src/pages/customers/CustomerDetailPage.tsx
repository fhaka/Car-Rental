import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Mail, Phone, MapPin, ShieldOff } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/Modal";
import {
  useCustomer,
  useCustomerBookings,
  useCustomerPayments,
  useCustomerRentals,
  useDeactivateCustomer,
} from "../../features/customers/useCustomers";
import { formatCurrency, formatDate } from "../../lib/format";

const TABS = ["Overview", "Bookings", "Rentals", "Payments"] as const;

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useCustomer(id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const deactivate = useDeactivateCustomer();

  const bookings = useCustomerBookings(id, { pageSize: 20 });
  const rentals = useCustomerRentals(id, { pageSize: 20 });
  const payments = useCustomerPayments(id, { pageSize: 20 });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const { customer, summary } = data;

  return (
    <div>
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={customer.email}
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => navigate(`/customers/${id}/edit`)}>
              <Edit size={16} /> Edit
            </button>
            {customer.isActive && (
              <button className="btn-danger" onClick={() => setConfirmDeactivate(true)}>
                <ShieldOff size={16} /> Deactivate
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <MiniStat label="Total Bookings" value={String(summary.totalBookings)} />
        <MiniStat label="Total Rentals" value={String(summary.totalRentals)} />
        <MiniStat label="Total Paid" value={formatCurrency(summary.totalPaid)} />
        <MiniStat label="Outstanding" value={formatCurrency(summary.outstandingBalance)} highlight={summary.outstandingBalance > 0} />
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="card max-w-2xl">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow icon={<Mail size={15} />} label="Email" value={customer.email} />
            <InfoRow icon={<Phone size={15} />} label="Phone" value={customer.phone} />
            <InfoRow icon={<MapPin size={15} />} label="Address" value={[customer.address, customer.city, customer.country].filter(Boolean).join(", ") || "—"} />
            <InfoRow label="Date of birth" value={formatDate(customer.dateOfBirth)} />
            <InfoRow label="Driver's license" value={customer.driverLicenseNumber ?? "—"} />
            <InfoRow label="License expiry" value={formatDate(customer.driverLicenseExpiry)} />
            <InfoRow label="ID" value={customer.idNumber ? `${customer.idType ?? ""} ${customer.idNumber}` : "—"} />
            <InfoRow label="Emergency contact" value={customer.emergencyContactName ? `${customer.emergencyContactName} (${customer.emergencyContactPhone})` : "—"} />
          </dl>
          {customer.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{customer.notes}</p>}
        </div>
      )}

      {tab === "Bookings" && (
        <div className="card !p-0">
          <DataTable
            rowKey={(b) => b.id}
            isLoading={bookings.isLoading}
            data={bookings.data?.data ?? []}
            onRowClick={(b) => navigate(`/bookings/${b.id}`)}
            emptyTitle="No bookings yet"
            columns={[
              { header: "Booking #", accessor: (b) => b.bookingNumber },
              { header: "Vehicle", accessor: (b) => `${b.vehicle?.brand} ${b.vehicle?.model}` },
              { header: "Pickup", accessor: (b) => formatDate(b.pickupAt) },
              { header: "Return", accessor: (b) => formatDate(b.returnAt) },
              { header: "Total", accessor: (b) => formatCurrency(b.totalAmount) },
              { header: "Status", accessor: (b) => <StatusBadge status={b.status} /> },
            ]}
          />
        </div>
      )}

      {tab === "Rentals" && (
        <div className="card !p-0">
          <DataTable
            rowKey={(r) => r.id}
            isLoading={rentals.isLoading}
            data={rentals.data?.data ?? []}
            onRowClick={(r) => navigate(`/rentals/${r.id}`)}
            emptyTitle="No rentals yet"
            columns={[
              { header: "Rental #", accessor: (r) => r.rentalNumber },
              { header: "Vehicle", accessor: (r) => `${r.vehicle?.brand} ${r.vehicle?.model}` },
              { header: "Checkout", accessor: (r) => formatDate(r.checkoutAt) },
              { header: "Return", accessor: (r) => formatDate(r.actualReturnAt ?? r.expectedReturnAt) },
              { header: "Final Amount", accessor: (r) => formatCurrency(r.finalAmount) },
              { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </div>
      )}

      {tab === "Payments" && (
        <div className="card !p-0">
          <DataTable
            rowKey={(p) => p.id}
            isLoading={payments.isLoading}
            data={payments.data?.data ?? []}
            emptyTitle="No payments recorded"
            columns={[
              { header: "Payment #", accessor: (p) => p.paymentNumber },
              { header: "Date", accessor: (p) => formatDate(p.createdAt) },
              { header: "Type", accessor: (p) => p.type },
              { header: "Method", accessor: (p) => p.method },
              { header: "Amount", accessor: (p) => formatCurrency(p.amount) },
              { header: "Status", accessor: (p) => <StatusBadge status={p.status} /> },
            ]}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => id && deactivate.mutate(id, { onSuccess: () => setConfirmDeactivate(false) })}
        title="Deactivate customer"
        message="This customer will no longer be selectable for new bookings. Their history is preserved."
        confirmLabel="Deactivate"
        loading={deactivate.isPending}
      />
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1.5 text-lg font-bold ${highlight ? "text-red-500" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-700">{value}</dd>
    </div>
  );
}
