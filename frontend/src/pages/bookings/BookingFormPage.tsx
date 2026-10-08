import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { useBooking, useCreateBooking, useUpdateBooking } from "../../features/bookings/useBookings";
import { useCustomers } from "../../features/customers/useCustomers";
import { useVehicles } from "../../features/vehicles/useVehicles";
import { useSettings } from "../../features/settings/useSettings";
import { formatCurrency, toDateTimeLocalValue } from "../../lib/format";

interface FormValues {
  customerId: string;
  vehicleId: string;
  pickupAt: string;
  returnAt: string;
  pickupLocation: string;
  returnLocation: string;
  discount: number;
  additionalFees: number;
  notes: string;
  status: "PENDING" | "CONFIRMED";
}

export default function BookingFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: existing } = useBooking(id);
  const { data: customers } = useCustomers({ pageSize: 100, isActive: true });
  const { data: vehicles } = useVehicles({ pageSize: 100, isActive: true });
  const { data: settings } = useSettings();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();

  const { register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      customerId: "",
      vehicleId: params.get("vehicleId") ?? "",
      pickupAt: params.get("pickupAt") ? toDateTimeLocalValue(new Date(params.get("pickupAt")!)) : toDateTimeLocalValue(new Date()),
      returnAt: params.get("returnAt")
        ? toDateTimeLocalValue(new Date(params.get("returnAt")!))
        : toDateTimeLocalValue(new Date(Date.now() + 3 * 86400000)),
      pickupLocation: "Main Office",
      returnLocation: "Main Office",
      discount: 0,
      additionalFees: 0,
      notes: "",
      status: "PENDING",
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        customerId: existing.customerId,
        vehicleId: existing.vehicleId,
        pickupAt: toDateTimeLocalValue(new Date(existing.pickupAt)),
        returnAt: toDateTimeLocalValue(new Date(existing.returnAt)),
        pickupLocation: existing.pickupLocation,
        returnLocation: existing.returnLocation,
        discount: Number(existing.discount),
        additionalFees: Number(existing.additionalFees),
        notes: existing.notes ?? "",
        status: existing.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
      });
    }
  }, [existing, reset]);

  const watched = watch();
  const selectedVehicle = vehicles?.data.find((v) => v.id === watched.vehicleId);

  const estimate = useMemo(() => {
    if (!selectedVehicle || !watched.pickupAt || !watched.returnAt) return null;
    const pickup = new Date(watched.pickupAt);
    const ret = new Date(watched.returnAt);
    if (ret <= pickup) return null;
    const days = Math.max(1, Math.ceil((ret.getTime() - pickup.getTime()) / 86400000));
    const dailyRate = Number(selectedVehicle.dailyRate);
    const subtotal = dailyRate * days;
    const taxPct = settings ? Number(settings.taxPercentage) : 0;
    const discount = Number(watched.discount) || 0;
    const fees = Number(watched.additionalFees) || 0;
    const taxable = Math.max(0, subtotal + fees - discount);
    const tax = (taxable * taxPct) / 100;
    const total = taxable + tax;
    return { days, subtotal, tax, total, dailyRate };
  }, [selectedVehicle, watched.pickupAt, watched.returnAt, watched.discount, watched.additionalFees, settings]);

  function onSubmit(values: FormValues) {
    const payload = { ...values, pickupAt: new Date(values.pickupAt).toISOString(), returnAt: new Date(values.returnAt).toISOString() };
    if (isEdit && id) {
      const { status, ...rest } = payload;
      updateBooking.mutate({ id, input: rest }, { onSuccess: () => navigate(`/bookings/${id}`) });
    } else {
      createBooking.mutate(payload, { onSuccess: (b) => navigate(`/bookings/${b.id}`) });
    }
  }

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Booking" : "New Booking"} description="Availability is re-verified on the server before the booking is confirmed" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Customer & Vehicle</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Customer" required>
                <select className="input" {...register("customerId", { required: true })}>
                  <option value="">Select customer</option>
                  {customers?.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} — {c.phone}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Vehicle" required>
                <select className="input" {...register("vehicleId", { required: true })}>
                  <option value="">Select vehicle</option>
                  {vehicles?.data.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.plateNumber}) — {formatCurrency(v.dailyRate)}/day
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Pickup & Return</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Pickup date & time" required>
                <input type="datetime-local" className="input" {...register("pickupAt", { required: true })} />
              </FormField>
              <FormField label="Return date & time" required>
                <input type="datetime-local" className="input" {...register("returnAt", { required: true })} />
              </FormField>
              <FormField label="Pickup location" required>
                <input className="input" {...register("pickupLocation", { required: true })} />
              </FormField>
              <FormField label="Return location" required>
                <input className="input" {...register("returnLocation", { required: true })} />
              </FormField>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Charges & Notes</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Discount">
                <input type="number" step="0.01" className="input" {...register("discount")} />
              </FormField>
              <FormField label="Additional fees">
                <input type="number" step="0.01" className="input" {...register("additionalFees")} />
              </FormField>
              {!isEdit && (
                <FormField label="Initial status">
                  <select className="input" {...register("status")}>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                  </select>
                </FormField>
              )}
            </div>
            <div className="mt-4">
              <FormField label="Notes">
                <textarea className="input" rows={3} {...register("notes")} />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createBooking.isPending || updateBooking.isPending}>
              {isEdit ? "Save changes" : "Create booking"}
            </button>
          </div>
        </form>

        <div>
          <div className="card sticky top-20">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Estimate</h3>
            {!selectedVehicle ? (
              <p className="text-sm text-slate-400">Select a vehicle and dates to see a price estimate.</p>
            ) : !estimate ? (
              <p className="text-sm text-red-500">Return date must be after pickup date.</p>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {formatCurrency(estimate.dailyRate)} × {estimate.days} day{estimate.days > 1 ? "s" : ""}
                  </span>
                  <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-medium">{formatCurrency(estimate.tax)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2.5 text-base font-bold text-slate-900">
                  <span>Estimated total</span>
                  <span>{formatCurrency(estimate.total)}</span>
                </div>
                <p className="pt-1 text-xs text-slate-400">Final totals are always calculated and verified by the server.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
