import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { CreditCard, KeyRound, Plus, Trash2, XCircle, CalendarClock } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { FormField } from "../../components/ui/FormField";
import { RecordPaymentModal } from "../../components/payments/RecordPaymentModal";
import { useCancelRental, useCheckinRental, useExtendRental, useRental } from "../../features/rentals/useRentals";
import { formatCurrency, formatDateTime, toDateTimeLocalValue } from "../../lib/format";

const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR"];

interface CheckinFormValues {
  returnMileage: number;
  returnFuelLevel: number;
  cleanliness: string;
  exteriorCondition: string;
  interiorCondition: string;
  tireCondition: string;
  windshieldCondition: string;
  additionalCharges: number;
  discount: number;
  requiresMaintenance: boolean;
  notes: string;
  newDamages: { description: string; location: string; estimatedRepairCost: number; customerResponsible: boolean }[];
}

export default function RentalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: rental, isLoading } = useRental(id);
  const checkin = useCheckinRental();
  const extend = useExtendRental();
  const cancelRental = useCancelRental();

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [newReturnAt, setNewReturnAt] = useState("");

  const { register, handleSubmit, control } = useForm<CheckinFormValues>({
    defaultValues: {
      returnMileage: rental?.startMileage ?? 0,
      returnFuelLevel: 100,
      cleanliness: "GOOD",
      exteriorCondition: "GOOD",
      interiorCondition: "GOOD",
      tireCondition: "GOOD",
      windshieldCondition: "GOOD",
      additionalCharges: 0,
      discount: 0,
      requiresMaintenance: false,
      notes: "",
      newDamages: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "newDamages" });

  if (isLoading || !rental) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const canCheckin = rental.status === "ACTIVE" || rental.status === "OVERDUE";
  const canExtend = canCheckin;
  const canCancel = rental.status === "ACTIVE";
  const outstanding = Math.max(0, Number(rental.finalAmount));

  function onCheckinSubmit(values: CheckinFormValues) {
    if (!id) return;
    checkin.mutate(
      {
        id,
        input: {
          returnMileage: values.returnMileage,
          returnFuelLevel: values.returnFuelLevel,
          condition: {
            cleanliness: values.cleanliness,
            exteriorCondition: values.exteriorCondition,
            interiorCondition: values.interiorCondition,
            tireCondition: values.tireCondition,
            windshieldCondition: values.windshieldCondition,
          },
          additionalCharges: values.additionalCharges,
          discount: values.discount,
          requiresMaintenance: values.requiresMaintenance,
          notes: values.notes,
          newDamages: values.newDamages,
        },
      },
      { onSuccess: () => setCheckinOpen(false) }
    );
  }

  return (
    <div>
      <PageHeader
        title={`Rental ${rental.rentalNumber}`}
        description={`${rental.customer?.firstName} ${rental.customer?.lastName} · ${rental.vehicle?.brand} ${rental.vehicle?.model}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={rental.status} />
            {canExtend && (
              <button className="btn-secondary" onClick={() => setExtendOpen(true)}>
                <CalendarClock size={16} /> Extend
              </button>
            )}
            {canCheckin && (
              <button className="btn-primary" onClick={() => setCheckinOpen(true)}>
                <KeyRound size={16} /> Check In
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
              <Info label="Checkout" value={formatDateTime(rental.checkoutAt)} />
              <Info label="Expected return" value={formatDateTime(rental.expectedReturnAt)} />
              <Info label="Actual return" value={rental.actualReturnAt ? formatDateTime(rental.actualReturnAt) : "—"} />
              <Info label="Starting mileage" value={`${rental.startMileage.toLocaleString()} km`} />
              <Info label="Return mileage" value={rental.returnMileage ? `${rental.returnMileage.toLocaleString()} km` : "—"} />
              <Info label="Starting fuel" value={`${rental.startFuelLevel}%`} />
              <Info label="Return fuel" value={rental.returnFuelLevel !== null && rental.returnFuelLevel !== undefined ? `${rental.returnFuelLevel}%` : "—"} />
              <Info label="Booking" value={rental.booking?.bookingNumber ?? "Walk-in"} />
            </dl>
            {rental.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{rental.notes}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Charges</h3>
              {rental.status === "COMPLETED" && outstanding > 0 && (
                <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => setPaymentOpen(true)}>
                  <CreditCard size={14} /> Record payment
                </button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Daily rate" value={formatCurrency(rental.dailyRate)} />
              <Row label="Late fee" value={formatCurrency(rental.lateFee)} />
              <Row label="Mileage fee" value={formatCurrency(rental.mileageFee)} />
              <Row label="Fuel fee" value={formatCurrency(rental.fuelFee)} />
              <Row label="Damage fee" value={formatCurrency(rental.damageFee)} />
              <Row label="Additional charges" value={formatCurrency(rental.additionalCharges)} />
              <Row label="Discount" value={`- ${formatCurrency(rental.discount)}`} />
              <Row label="Tax" value={formatCurrency(rental.tax)} />
              <div className="my-2 border-t border-slate-100" />
              <Row label="Final amount" value={formatCurrency(rental.finalAmount)} bold />
              <Row label="Payment status" value={rental.paymentStatus} />
              <Row label="Security deposit" value={formatCurrency(rental.securityDeposit)} />
            </div>
          </div>
        </div>
      </div>

      {/* Check-in modal */}
      <Modal
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        title="Vehicle Check-In"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCheckinOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit(onCheckinSubmit)} disabled={checkin.isPending}>
              Complete Check-In
            </button>
          </>
        }
      >
        <form className="space-y-5" onSubmit={handleSubmit(onCheckinSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Return mileage (km)" required>
              <input type="number" className="input" {...register("returnMileage", { required: true, valueAsNumber: true })} />
            </FormField>
            <FormField label="Return fuel level (%)" required>
              <input type="number" min={0} max={100} className="input" {...register("returnFuelLevel", { required: true, valueAsNumber: true })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(["cleanliness", "exteriorCondition", "interiorCondition", "tireCondition", "windshieldCondition"] as const).map((field) => (
              <FormField key={field} label={field.replace(/([A-Z])/g, " $1")}>
                <select className="input" {...register(field)}>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FormField>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Additional charges">
              <input type="number" step="0.01" className="input" {...register("additionalCharges", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Discount">
              <input type="number" step="0.01" className="input" {...register("discount", { valueAsNumber: true })} />
            </FormField>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...register("requiresMaintenance")} /> Needs maintenance
              </label>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label !mb-0">New damage reports</p>
              <button
                type="button"
                className="text-xs font-medium text-brand-600 hover:underline"
                onClick={() => append({ description: "", location: "", estimatedRepairCost: 0, customerResponsible: true })}
              >
                <Plus size={13} className="inline" /> Add damage
              </button>
            </div>
            {fields.length === 0 && <p className="text-xs text-slate-400">No new damage found during inspection.</p>}
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-5">
                  <input className="input sm:col-span-2" placeholder="Description" {...register(`newDamages.${idx}.description`)} />
                  <input className="input" placeholder="Location" {...register(`newDamages.${idx}.location`)} />
                  <input type="number" step="0.01" className="input" placeholder="Est. cost" {...register(`newDamages.${idx}.estimatedRepairCost`, { valueAsNumber: true })} />
                  <button type="button" className="btn-ghost text-red-500 justify-center" onClick={() => remove(idx)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <FormField label="Return inspection notes">
            <textarea className="input" rows={2} {...register("notes")} />
          </FormField>
        </form>
      </Modal>

      {/* Extend modal */}
      <Modal
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Extend Rental"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setExtendOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => id && newReturnAt && extend.mutate({ id, newExpectedReturnAt: new Date(newReturnAt).toISOString() }, { onSuccess: () => setExtendOpen(false) })}
              disabled={!newReturnAt || extend.isPending}
            >
              Extend
            </button>
          </>
        }
      >
        <FormField label="New expected return" required>
          <input
            type="datetime-local"
            className="input"
            defaultValue={toDateTimeLocalValue(new Date(rental.expectedReturnAt))}
            onChange={(e) => setNewReturnAt(e.target.value)}
          />
        </FormField>
      </Modal>

      <RecordPaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} customerId={rental.customerId} rentalId={rental.id} suggestedAmount={outstanding} />

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => id && cancelRental.mutate({ id }, { onSuccess: () => setConfirmCancel(false) })}
        title="Cancel rental"
        message="Only use this if the vehicle was checked out by mistake. The vehicle becomes available again."
        confirmLabel="Cancel rental"
        loading={cancelRental.isPending}
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "font-medium text-slate-800"}>{value}</span>
    </div>
  );
}
