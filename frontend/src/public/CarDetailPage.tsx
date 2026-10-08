import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, DoorOpen, Fuel, Gauge, Palette, ShieldCheck, Users, Calendar } from "lucide-react";
import { formatCurrency } from "../lib/format";
import { publicApi, fuelLabel, transmissionLabel } from "./publicApi";
import { useCompany } from "./useCompany";
import { CarGallery } from "./CarGallery";

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { data: company } = useCompany();
  const currency = company?.currency ?? "USD";

  const pickupAt = params.get("pickupAt") ?? undefined;
  const returnAt = params.get("returnAt") ?? undefined;
  const bookQuery = new URLSearchParams();
  if (pickupAt) bookQuery.set("pickupAt", pickupAt);
  if (returnAt) bookQuery.set("returnAt", returnAt);
  const bookHref = `/book/${id}${bookQuery.toString() ? `?${bookQuery.toString()}` : ""}`;

  const vehicleQuery = useQuery({
    queryKey: ["public", "vehicle", id, pickupAt, returnAt],
    queryFn: () => publicApi.getVehicle(id!, { pickupAt, returnAt }),
    enabled: Boolean(id),
  });

  if (vehicleQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-slate-200/60" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
      </div>
    );
  }

  if (vehicleQuery.isError || !vehicleQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Vehicle not found</h1>
        <p className="mt-2 text-slate-500">This car may no longer be available.</p>
        <Link to="/fleet" className="btn-primary mt-6 inline-flex">
          Back to fleet
        </Link>
      </div>
    );
  }

  const v = vehicleQuery.data;
  const specs = [
    { icon: Users, label: "Seats", value: `${v.seats}` },
    { icon: DoorOpen, label: "Doors", value: `${v.doors}` },
    { icon: Gauge, label: "Transmission", value: transmissionLabel(v.transmission) },
    { icon: Fuel, label: "Fuel", value: fuelLabel(v.fuelType) },
    { icon: Palette, label: "Color", value: v.color },
    { icon: Calendar, label: "Year", value: `${v.year}` },
  ];

  const includes = [
    "Comprehensive insurance",
    "24/7 roadside assistance",
    "Free cancellation up to 24h before pickup",
    "Unlimited customer support",
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/fleet" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Back to fleet
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: gallery + specs */}
        <div>
          <CarGallery vehicle={v} />

          <div className="mt-6">
            <span className="badge bg-brand-50 text-brand-700">{v.category.name}</span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              {v.brand} {v.model}
            </h1>
            {v.category.description && <p className="mt-2 text-slate-500">{v.category.description}</p>}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specs.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <s.icon size={18} />
                </span>
                <div>
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="text-sm font-semibold text-slate-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck size={18} className="text-brand-500" /> What's included
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {includes.map((inc) => (
                <li key={inc} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {inc}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: pricing / booking card */}
        <div>
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500">Daily rate</span>
                <span className="text-3xl font-extrabold text-brand-600">{formatCurrency(v.dailyRate, currency)}</span>
              </div>

              <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                {v.weeklyRate != null && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Weekly rate</dt>
                    <dd className="font-semibold text-slate-800">{formatCurrency(v.weeklyRate, currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Security deposit</dt>
                  <dd className="font-semibold text-slate-800">{formatCurrency(v.securityDeposit, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-semibold text-slate-800">{v.category.name}</dd>
                </div>
              </dl>

              {pickupAt && returnAt && v.available === false ? (
                <>
                  <div className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">
                    Not available for your selected dates.
                  </div>
                  <button type="button" disabled className="btn-primary mt-3 w-full py-3 text-base">
                    Unavailable for these dates
                  </button>
                  <Link to="/fleet" className="mt-3 block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
                    Try different dates →
                  </Link>
                </>
              ) : (
                <>
                  <Link to={bookHref} className="btn-primary mt-6 w-full py-3 text-base">
                    Book this car
                  </Link>
                  <p className="mt-3 text-center text-xs text-slate-400">
                    You won't be charged yet — we confirm your booking first.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
