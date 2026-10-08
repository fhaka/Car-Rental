import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { CalendarRange, SlidersHorizontal, X } from "lucide-react";
import { formatDate } from "../lib/format";
import { publicApi, VehicleQuery } from "./publicApi";
import { useCompany } from "./useCompany";
import { VehicleCard } from "./VehicleCard";

const TRANSMISSIONS = ["AUTOMATIC", "MANUAL"] as const;
const FUELS = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"] as const;

export function FleetPage() {
  const [params, setParams] = useSearchParams();
  const { data: company } = useCompany();
  const currency = company?.currency ?? "USD";

  const categoriesQuery = useQuery({ queryKey: ["public", "categories"], queryFn: publicApi.getCategories, staleTime: 5 * 60_000 });

  const pickupAt = params.get("pickupAt") ?? undefined;
  const returnAt = params.get("returnAt") ?? undefined;
  const page = Number(params.get("page") ?? "1");

  const query: VehicleQuery = useMemo(
    () => ({
      pickupAt,
      returnAt,
      categoryId: params.get("categoryId") ?? undefined,
      transmission: (params.get("transmission") as VehicleQuery["transmission"]) ?? undefined,
      fuelType: (params.get("fuelType") as VehicleQuery["fuelType"]) ?? undefined,
      seats: params.get("seats") ? Number(params.get("seats")) : undefined,
      maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
      search: params.get("search") ?? undefined,
      sort: (params.get("sort") as VehicleQuery["sort"]) ?? "price_asc",
      page,
      pageSize: 9,
    }),
    [params, pickupAt, returnAt, page]
  );

  const vehiclesQuery = useQuery({
    queryKey: ["public", "vehicles", query],
    queryFn: () => publicApi.listVehicles(query),
    placeholderData: keepPreviousData,
    // Keep the availability badges current: refetch periodically and whenever
    // the visitor returns to the tab.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  function setFilter(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  }

  const activeFilterCount = ["categoryId", "transmission", "fuelType", "seats", "maxPrice", "search"].filter((k) =>
    params.get(k)
  ).length;

  const result = vehiclesQuery.data;
  const vehicles = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Our fleet</h1>
          <p className="mt-1.5 text-slate-500">
            {meta ? `${meta.total} vehicle${meta.total === 1 ? "" : "s"} available` : "Loading vehicles…"}
            {pickupAt && returnAt && (
              <span className="ml-1 text-slate-400">
                · {formatDate(pickupAt)} → {formatDate(returnAt)}
              </span>
            )}
          </p>
        </div>
        <select className="input w-full sm:w-52" value={query.sort} onChange={(e) => setFilter("sort", e.target.value)}>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="h-max rounded-2xl border border-slate-100 bg-white p-5 shadow-card lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <SlidersHorizontal size={18} className="text-brand-500" /> Filters
            </h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => setParams(pickupAt && returnAt ? { pickupAt, returnAt } : {}, { replace: true })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <label className="label">Search</label>
              <input
                className="input"
                placeholder="Brand or model"
                defaultValue={params.get("search") ?? ""}
                onChange={(e) => setFilter("search", e.target.value || undefined)}
              />
            </div>

            <div>
              <label className="label">Category</label>
              <select className="input" value={params.get("categoryId") ?? ""} onChange={(e) => setFilter("categoryId", e.target.value || undefined)}>
                <option value="">All categories</option>
                {(categoriesQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Transmission</label>
              <select className="input" value={params.get("transmission") ?? ""} onChange={(e) => setFilter("transmission", e.target.value || undefined)}>
                <option value="">Any</option>
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Fuel type</label>
              <select className="input" value={params.get("fuelType") ?? ""} onChange={(e) => setFilter("fuelType", e.target.value || undefined)}>
                <option value="">Any</option>
                {FUELS.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Minimum seats</label>
              <select className="input" value={params.get("seats") ?? ""} onChange={(e) => setFilter("seats", e.target.value || undefined)}>
                <option value="">Any</option>
                {[2, 4, 5, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    {s}+ seats
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Max price / day</label>
              <select className="input" value={params.get("maxPrice") ?? ""} onChange={(e) => setFilter("maxPrice", e.target.value || undefined)}>
                <option value="">No limit</option>
                {[40, 60, 80, 120, 200].map((p) => (
                  <option key={p} value={p}>
                    Up to {p} {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          {vehiclesQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
              <CalendarRange className="mx-auto text-slate-300" size={40} />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">No vehicles match your filters</h3>
              <p className="mt-1.5 text-sm text-slate-500">Try widening your search or clearing a filter.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} currency={currency} dates={{ pickupAt, returnAt }} />
                ))}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setFilter("page", String(page - 1))}
                  >
                    Previous
                  </button>
                  <span className="px-3 text-sm text-slate-600">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={page >= meta.totalPages}
                    onClick={() => setFilter("page", String(page + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
