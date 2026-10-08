import { Link } from "react-router-dom";
import { Fuel, Gauge, Users } from "lucide-react";
import { formatCurrency } from "../lib/format";
import { CarImage } from "./CarImage";
import { PublicVehicle, VehicleStatus, fuelLabel, transmissionLabel } from "./publicApi";

/**
 * Availability shown on the card. When the customer has searched a date window,
 * the API only returns cars that are free for it, so every card is available
 * "for your dates". Otherwise we reflect the vehicle's current real-world status.
 */
export function availabilityBadge(status: VehicleStatus, hasDates: boolean, available?: boolean) {
  if (hasDates) {
    return available === false
      ? { label: "Unavailable for your dates", dot: "bg-rose-500", text: "text-rose-600", live: false }
      : { label: "Available for your dates", dot: "bg-emerald-500", text: "text-emerald-700", live: true };
  }
  switch (status) {
    case "AVAILABLE":
      return { label: "Available now", dot: "bg-emerald-500", text: "text-emerald-700", live: true };
    case "RESERVED":
      return { label: "Reserved", dot: "bg-amber-500", text: "text-amber-700", live: false };
    case "RENTED":
      return { label: "Rented out", dot: "bg-slate-400", text: "text-slate-600", live: false };
    default:
      return { label: "Available", dot: "bg-emerald-500", text: "text-emerald-700", live: true };
  }
}

export function VehicleCard({
  vehicle,
  currency = "USD",
  dates,
}: {
  vehicle: PublicVehicle;
  currency?: string;
  dates?: { pickupAt?: string; returnAt?: string };
}) {
  const bookParams = new URLSearchParams();
  if (dates?.pickupAt) bookParams.set("pickupAt", dates.pickupAt);
  if (dates?.returnAt) bookParams.set("returnAt", dates.returnAt);
  const query = bookParams.toString() ? `?${bookParams.toString()}` : "";

  const hasDates = Boolean(dates?.pickupAt && dates?.returnAt);
  const unavailable = hasDates && vehicle.available === false;
  const badge = availabilityBadge(vehicle.status, hasDates, vehicle.available);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/fleet/${vehicle.id}${query}`} className="relative block aspect-[16/10] overflow-hidden">
        <CarImage
          vehicle={vehicle}
          className={`transition-transform duration-500 group-hover:scale-105 ${unavailable ? "opacity-50 grayscale" : ""}`}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          {vehicle.category.name}
        </span>
        <span className="absolute right-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur">
          <span className="relative flex h-2 w-2 shrink-0">
            {badge.live && (
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${badge.dot} opacity-75`} />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${badge.dot}`} />
          </span>
          <span className={`truncate ${badge.text}`}>{badge.label}</span>
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-slate-500">{vehicle.year}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-brand-600">{formatCurrency(vehicle.dailyRate, currency)}</p>
            <p className="-mt-0.5 text-xs text-slate-400">per day</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Users size={15} className="text-slate-400" /> {vehicle.seats} seats
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Gauge size={15} className="text-slate-400" /> {transmissionLabel(vehicle.transmission)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Fuel size={15} className="text-slate-400" /> {fuelLabel(vehicle.fuelType)}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
          <Link to={`/fleet/${vehicle.id}${query}`} className="btn-secondary flex-1">
            Details
          </Link>
          {unavailable ? (
            <button type="button" disabled className="btn-primary flex-1" title="Not available for your selected dates">
              Unavailable
            </button>
          ) : (
            <Link to={`/book/${vehicle.id}${query}`} className="btn-primary flex-1">
              Book
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
