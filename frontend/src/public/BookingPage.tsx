import { useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { formatCurrency, formatDateTime, toDateTimeLocalValue } from "../lib/format";
import { BookingConfirmation, publicApi } from "./publicApi";
import { useCompany } from "./useCompany";
import { CarImage } from "./CarImage";

const schema = z.object({
  pickupAt: z.string().min(1, "Required"),
  returnAt: z.string().min(1, "Required"),
  pickupLocation: z.string().min(1, "Required"),
  returnLocation: z.string().min(1, "Required"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(3, "Required"),
  driverLicenseNumber: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function defaultDate(offsetDays: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return toDateTimeLocalValue(d);
}

function isoOrDefault(iso: string | null, fallback: string) {
  if (!iso) return fallback;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? fallback : toDateTimeLocalValue(d);
}

function rentalDaysBetween(pickup: string, ret: string) {
  const p = new Date(pickup).getTime();
  const r = new Date(ret).getTime();
  if (!Number.isFinite(p) || !Number.isFinite(r) || r <= p) return 0;
  return Math.max(1, Math.ceil((r - p) / (24 * 60 * 60 * 1000)));
}

export function BookingPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [params] = useSearchParams();
  const { data: company } = useCompany();
  const currency = company?.currency ?? "USD";
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const vehicleQuery = useQuery({
    queryKey: ["public", "vehicle", vehicleId],
    queryFn: () => publicApi.getVehicle(vehicleId!),
    enabled: Boolean(vehicleId),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pickupAt: isoOrDefault(params.get("pickupAt"), defaultDate(1, 10)),
      returnAt: isoOrDefault(params.get("returnAt"), defaultDate(4, 10)),
      pickupLocation: company?.address ?? "Main office",
      returnLocation: company?.address ?? "Main office",
    },
  });

  const pickupAt = watch("pickupAt");
  const returnAt = watch("returnAt");
  const days = useMemo(() => rentalDaysBetween(pickupAt, returnAt), [pickupAt, returnAt]);
  const dailyRate = vehicleQuery.data?.dailyRate ?? 0;
  const estSubtotal = days * dailyRate;

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      publicApi.createBooking({
        vehicleId: vehicleId!,
        pickupAt: new Date(values.pickupAt).toISOString(),
        returnAt: new Date(values.returnAt).toISOString(),
        pickupLocation: values.pickupLocation,
        returnLocation: values.returnLocation,
        notes: values.notes || undefined,
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          driverLicenseNumber: values.driverLicenseNumber || undefined,
          city: values.city || undefined,
          country: values.country || undefined,
        },
      }),
    onSuccess: (data) => {
      setConfirmation(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  if (!vehicleId) return <Navigate to="/fleet" replace />;

  const errorMessage =
    mutation.isError &&
    (((mutation.error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message) ||
      "Something went wrong. Please try again.");

  // ---- Confirmation view ----
  if (confirmation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto text-emerald-500" size={56} />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Booking request received!</h1>
          <p className="mt-2 text-slate-500">
            Thanks, {confirmation.customer.firstName}. We've sent your request to our team and will confirm shortly at{" "}
            <span className="font-medium text-slate-700">{confirmation.customer.email}</span>.
          </p>

          <div className="mt-6 rounded-xl bg-surface p-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-sm text-slate-500">Booking number</span>
              <span className="font-mono font-bold text-slate-900">{confirmation.bookingNumber}</span>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Vehicle" value={`${confirmation.vehicle.brand} ${confirmation.vehicle.model} (${confirmation.vehicle.year})`} />
              <Row label="Pick-up" value={formatDateTime(confirmation.pickupAt)} />
              <Row label="Return" value={formatDateTime(confirmation.returnAt)} />
              <Row label={`Rate × ${confirmation.rentalDays} day${confirmation.rentalDays === 1 ? "" : "s"}`} value={formatCurrency(confirmation.subtotal, currency)} />
              <Row label="Tax" value={formatCurrency(confirmation.tax, currency)} />
              <Row label="Security deposit" value={formatCurrency(confirmation.securityDeposit, currency)} />
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <dt className="font-semibold text-slate-800">Total</dt>
                <dd className="font-extrabold text-brand-600">{formatCurrency(confirmation.totalAmount, currency)}</dd>
              </div>
            </dl>
          </div>

          <p className="mt-5 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Status: Pending confirmation
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/fleet" className="btn-secondary">
              Browse more cars
            </Link>
            <Link to="/" className="btn-primary">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Booking form view ----
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to={`/fleet/${vehicleId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Back to car details
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Complete your booking</h1>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Form fields */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
            <h2 className="font-bold text-slate-900">Trip details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Pick-up date & time" error={errors.pickupAt?.message}>
                <input type="datetime-local" className="input" {...register("pickupAt")} />
              </Field>
              <Field label="Return date & time" error={errors.returnAt?.message}>
                <input type="datetime-local" className="input" min={pickupAt} {...register("returnAt")} />
              </Field>
              <Field label="Pick-up location" error={errors.pickupLocation?.message}>
                <input className="input" placeholder="Where you'll collect the car" {...register("pickupLocation")} />
              </Field>
              <Field label="Return location" error={errors.returnLocation?.message}>
                <input className="input" placeholder="Where you'll return the car" {...register("returnLocation")} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
            <h2 className="font-bold text-slate-900">Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={errors.firstName?.message}>
                <input className="input" {...register("firstName")} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <input className="input" {...register("lastName")} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input type="email" className="input" {...register("email")} />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <input className="input" {...register("phone")} />
              </Field>
              <Field label="Driver's license no. (optional)">
                <input className="input" {...register("driverLicenseNumber")} />
              </Field>
              <Field label="City (optional)">
                <input className="input" {...register("city")} />
              </Field>
              <Field label="Country (optional)" className="sm:col-span-2">
                <input className="input" {...register("country")} />
              </Field>
              <Field label="Notes for our team (optional)" className="sm:col-span-2">
                <textarea className="input min-h-[90px] resize-y" placeholder="Child seat, additional driver, flight number…" {...register("notes")} />
              </Field>
            </div>
          </section>
        </div>

        {/* Summary */}
        <div>
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
              {vehicleQuery.data && (
                <div className="aspect-[16/10]">
                  <CarImage vehicle={vehicleQuery.data} showLabel={false} />
                </div>
              )}
              <div className="p-6">
                <h3 className="font-bold text-slate-900">
                  {vehicleQuery.data ? `${vehicleQuery.data.brand} ${vehicleQuery.data.model}` : "Loading…"}
                </h3>
                <p className="text-sm text-slate-500">{vehicleQuery.data?.category.name}</p>

                <dl className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm">
                  <Row label="Daily rate" value={formatCurrency(dailyRate, currency)} />
                  <Row label="Rental length" value={`${days} day${days === 1 ? "" : "s"}`} />
                  <Row label="Estimated subtotal" value={formatCurrency(estSubtotal, currency)} />
                  {vehicleQuery.data && (
                    <Row label="Security deposit" value={formatCurrency(vehicleQuery.data.securityDeposit, currency)} />
                  )}
                </dl>
                <p className="mt-3 text-xs text-slate-400">
                  Taxes and the final total are calculated and confirmed when you submit.
                </p>

                {errorMessage && (
                  <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
                )}

                <button type="submit" disabled={mutation.isPending || days === 0} className="btn-primary mt-5 w-full py-3 text-base">
                  {mutation.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Request booking"
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">No payment required now.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
