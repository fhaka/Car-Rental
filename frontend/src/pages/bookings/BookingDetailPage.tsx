import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, CreditCard, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/Modal";
import { RecordPaymentModal } from "../../components/payments/RecordPaymentModal";
import { useBooking, useChangeBookingStatus } from "../../features/bookings/useBookings";
import { formatCurrency, formatDateTime } from "../../lib/format";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBooking(id);
  const changeStatus = useChangeBookingStatus();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading || !booking) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const canEdit = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canConfirm = booking.status === "PENDING";
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canCheckout = booking.status === "CONFIRMED";

  return (
    <div>
      <PageHeader
        title={`Booking ${booking.bookingNumber}`}
        description={`Created for ${booking.customer?.firstName} ${booking.customer?.lastName}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} />
            {canEdit && (
              <button className="btn-secondary" onClick={() => navigate(`/bookings/${id}/edit`)}>
                <Edit size={16} /> Edit
              </button>
            )}
            {canConfirm && (
              <button className="btn-primary" onClick={() => id && changeStatus.mutate({ id, status: "CONFIRMED" })}>
                <CheckCircle2 size={16} /> Confirm
              </button>
            )}
            {canCheckout && (
              <button className="btn-primary" onClick={() => navigate(`/rentals/checkout?bookingId=${id}`)}>
                <KeyRound size={16} /> Check Out Vehicle
              </button>
            )}
            {canCancel && (
              <button className="btn-danger" onClick={() => setConfirmCancel(true)}>
                <XCircle size={16} /> Cancel
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Rental Details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Info label="Customer" value={`${booking.customer?.firstName} ${booking.customer?.lastName}`} />
              <Info label="Vehicle" value={`${booking.vehicle?.brand} ${booking.vehicle?.model} (${booking.vehicle?.plateNumber})`} />
              <Info label="Rental days" value={String(booking.rentalDays)} />
              <Info label="Pickup" value={formatDateTime(booking.pickupAt)} />
              <Info label="Return" value={formatDateTime(booking.returnAt)} />
              <Info label="Pickup location" value={booking.pickupLocation} />
              <Info label="Return location" value={booking.returnLocation} />
            </dl>
            {booking.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{booking.notes}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Payment Summary</h3>
              {Number(booking.remainingBalance) > 0 && (
                <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => setPaymentModalOpen(true)}>
                  <CreditCard size={14} /> Record payment
                </button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Daily rate" value={formatCurrency(booking.dailyRate)} />
              <Row label="Subtotal" value={formatCurrency(booking.subtotal)} />
              <Row label="Tax" value={formatCurrency(booking.tax)} />
              <Row label="Additional fees" value={formatCurrency(booking.additionalFees)} />
              <Row label="Discount" value={`- ${formatCurrency(booking.discount)}`} />
              <Row label="Security deposit" value={formatCurrency(booking.securityDeposit)} />
              <div className="my-2 border-t border-slate-100" />
              <Row label="Total amount" value={formatCurrency(booking.totalAmount)} bold />
              <Row label="Amount paid" value={formatCurrency(booking.amountPaid)} />
              <Row
                label="Remaining balance"
                value={formatCurrency(booking.remainingBalance)}
                bold
                accent={Number(booking.remainingBalance) > 0}
              />
            </div>
          </div>
        </div>
      </div>

      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        customerId={booking.customerId}
        bookingId={booking.id}
        suggestedAmount={Number(booking.remainingBalance)}
      />

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => id && changeStatus.mutate({ id, status: "CANCELLED" }, { onSuccess: () => setConfirmCancel(false) })}
        title="Cancel booking"
        message="This releases the vehicle's availability for the requested dates. This cannot be undone."
        confirmLabel="Cancel booking"
        loading={changeStatus.isPending}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${accent ? "text-red-500" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}
