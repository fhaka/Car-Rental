import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { API_ORIGIN, PublicVehicle } from "./publicApi";
import { CarImage } from "./CarImage";

function resolve(url: string) {
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

/**
 * Public car-detail gallery: a large main image with prev/next controls, a
 * thumbnail strip, and a click-to-zoom lightbox. Falls back to the gradient
 * placeholder when a vehicle has no photos, and hides the strip/controls when
 * it has only one.
 */
export function CarGallery({ vehicle }: { vehicle: PublicVehicle }) {
  const images = vehicle.images ?? [];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const count = images.length;
  const go = (delta: number) => setActive((i) => (i + delta + count) % count);

  // Keyboard controls while the lightbox is open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, count]);

  if (count === 0) {
    return (
      <div className="aspect-[16/10] overflow-hidden rounded-2xl shadow-card">
        <CarImage vehicle={vehicle} rounded="rounded-2xl" showLabel={false} />
      </div>
    );
  }

  const current = resolve(images[active].url);

  return (
    <div>
      <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 shadow-card">
        <img
          src={current}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full cursor-zoom-in object-cover"
          onClick={() => setLightbox(true)}
        />

        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute right-3 top-3 rounded-lg bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
          aria-label="View full size"
        >
          <Expand size={16} />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-800 shadow-sm transition hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-800 shadow-sm transition hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition ${
                i === active ? "ring-2 ring-brand-500 ring-offset-2" : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`Show photo ${i + 1}`}
            >
              <img src={resolve(img.url)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
            aria-label="Close"
          >
            <X size={22} />
          </button>

          <img
            src={current}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {count > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next photo"
              >
                <ChevronRight size={26} />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {active + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
