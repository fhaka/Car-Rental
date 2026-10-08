import { CarFront } from "lucide-react";
import { API_ORIGIN, PublicVehicle } from "./publicApi";

/**
 * Vehicle visual. If the fleet has uploaded photos we show the primary one;
 * otherwise we render a clean, category-tinted gradient with the car icon and
 * name - so every card looks intentional even before photos are added.
 */
const CATEGORY_GRADIENT: Record<string, string> = {
  Economy: "from-emerald-400 via-teal-500 to-emerald-600",
  Compact: "from-sky-400 via-blue-500 to-indigo-600",
  SUV: "from-amber-400 via-orange-500 to-orange-600",
  Luxury: "from-slate-700 via-slate-800 to-slate-900",
  Van: "from-violet-400 via-purple-500 to-indigo-600",
  Sports: "from-rose-500 via-red-500 to-red-600",
};

const DEFAULT_GRADIENT = "from-brand-400 via-brand-500 to-brand-700";

export function CarImage({
  vehicle,
  className = "",
  rounded = "rounded-t-2xl",
  showLabel = true,
}: {
  vehicle: Pick<PublicVehicle, "brand" | "model" | "category" | "images">;
  className?: string;
  rounded?: string;
  showLabel?: boolean;
}) {
  const primary = vehicle.images?.find((i) => i.isPrimary) ?? vehicle.images?.[0];

  if (primary) {
    const src = primary.url.startsWith("http") ? primary.url : `${API_ORIGIN}${primary.url}`;
    return (
      <img
        src={src}
        alt={`${vehicle.brand} ${vehicle.model}`}
        className={`h-full w-full object-cover ${rounded} ${className}`}
        loading="lazy"
      />
    );
  }

  const gradient = CATEGORY_GRADIENT[vehicle.category?.name] ?? DEFAULT_GRADIENT;

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${rounded} ${className}`}
    >
      <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-black/10" />
      <div className="flex flex-col items-center gap-2 text-white">
        <CarFront className="drop-shadow-sm" size={56} strokeWidth={1.5} />
        {showLabel && (
          <span className="px-3 text-center text-sm font-semibold tracking-wide drop-shadow-sm">
            {vehicle.brand} {vehicle.model}
          </span>
        )}
      </div>
    </div>
  );
}
