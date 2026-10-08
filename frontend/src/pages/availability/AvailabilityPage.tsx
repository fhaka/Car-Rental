import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Car as CarIcon, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { availabilityApi } from "../../features/availability/api";
import { useCategories } from "../../features/categories/useCategories";
import { formatCurrency, toDateInputValue } from "../../lib/format";

function defaultDate(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return toDateInputValue(d);
}

export default function AvailabilityPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: categories } = useCategories({ pageSize: 50 });

  const [form, setForm] = useState({
    pickupDate: params.get("pickupDate") ?? defaultDate(0),
    pickupTime: params.get("pickupTime") ?? "10:00",
    returnDate: defaultDate(3),
    returnTime: "10:00",
    categoryId: "",
    transmission: "",
    fuelType: "",
    seats: "",
    maxPrice: "",
  });
  const [searched, setSearched] = useState(false);

  const pickupAt = `${form.pickupDate}T${form.pickupTime}`;
  const returnAt = `${form.returnDate}T${form.returnTime}`;

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["availability-search", form],
    queryFn: () =>
      availabilityApi.search({
        pickupAt,
        returnAt,
        categoryId: form.categoryId || undefined,
        transmission: form.transmission || undefined,
        fuelType: form.fuelType || undefined,
        seats: form.seats || undefined,
        maxPrice: form.maxPrice || undefined,
        pageSize: 24,
      }),
    enabled: false,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
    refetch();
  }

  return (
    <div>
      <PageHeader title="Vehicle Availability" description="Find vehicles that are genuinely free for a given date range" />

      <form onSubmit={handleSearch} className="card mb-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-1">
            <label className="label">Pickup date</label>
            <input type="date" className="input" value={form.pickupDate} onChange={(e) => setForm((f) => ({ ...f, pickupDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Pickup time</label>
            <input type="time" className="input" value={form.pickupTime} onChange={(e) => setForm((f) => ({ ...f, pickupTime: e.target.value }))} />
          </div>
          <div>
            <label className="label">Return date</label>
            <input type="date" className="input" value={form.returnDate} onChange={(e) => setForm((f) => ({ ...f, returnDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Return time</label>
            <input type="time" className="input" value={form.returnTime} onChange={(e) => setForm((f) => ({ ...f, returnTime: e.target.value }))} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Any</option>
              {categories?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Transmission</label>
            <select className="input" value={form.transmission} onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))}>
              <option value="">Any</option>
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>
          <div>
            <label className="label">Fuel type</label>
            <select className="input" value={form.fuelType} onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value }))}>
              <option value="">Any</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ELECTRIC">Electric</option>
              <option value="LPG">LPG</option>
            </select>
          </div>
          <div>
            <label className="label">Min seats</label>
            <input type="number" className="input" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} />
          </div>
          <div>
            <label className="label">Max daily price</label>
            <input type="number" className="input" value={form.maxPrice} onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" className="btn-primary">
            <Search size={16} /> Search Availability
          </button>
        </div>
      </form>

      {!searched && <EmptyState title="Search for available vehicles" description="Choose your dates and filters above, then search." icon={<CarIcon size={40} strokeWidth={1.5} />} />}

      {searched && isFetching && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      )}

      {searched && !isFetching && data && (
        <>
          <p className="mb-4 text-sm text-slate-500">{data.meta.total} vehicle(s) available for the selected period</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((v) => (
              <div key={v.id} className="card !p-0 overflow-hidden flex flex-col">
                <div className="flex h-40 items-center justify-center bg-slate-100">
                  {v.images[0] ? (
                    <img src={v.images[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CarIcon size={48} className="text-slate-300" strokeWidth={1.2} />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-semibold text-slate-800">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-xs text-slate-400">
                    {v.year} · {v.transmission} · {v.fuelType} · {v.seats} seats
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-brand-600">{formatCurrency(v.dailyRate)}</span>
                    <span className="text-xs text-slate-400">/ day</span>
                  </div>
                  <button
                    className="btn-primary mt-4 w-full"
                    onClick={() =>
                      navigate(
                        `/bookings/new?vehicleId=${v.id}&pickupAt=${encodeURIComponent(pickupAt)}&returnAt=${encodeURIComponent(returnAt)}`
                      )
                    }
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
          {data.data.length === 0 && <EmptyState title="No vehicles available" description="Try widening your dates or filters." icon={<CarIcon size={40} strokeWidth={1.5} />} />}
        </>
      )}
    </div>
  );
}
