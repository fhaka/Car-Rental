import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, CarFront, Clock, MapPin, ShieldCheck, Sparkles, Tag, Wallet } from "lucide-react";
import { toDateTimeLocalValue } from "../lib/format";
import { publicApi } from "./publicApi";
import { useCompany } from "./useCompany";
import { VehicleCard } from "./VehicleCard";

function defaultDates() {
  const pickup = new Date();
  pickup.setDate(pickup.getDate() + 1);
  pickup.setHours(10, 0, 0, 0);
  const ret = new Date(pickup);
  ret.setDate(ret.getDate() + 3);
  return { pickup: toDateTimeLocalValue(pickup), ret: toDateTimeLocalValue(ret) };
}

const FEATURES = [
  { icon: Wallet, title: "Transparent pricing", text: "The price you see is the price you pay. No hidden fees, ever." },
  { icon: ShieldCheck, title: "Fully insured fleet", text: "Every vehicle is maintained, inspected and insured for your safety." },
  { icon: Clock, title: "Fast, easy booking", text: "Reserve in under two minutes and collect your keys on arrival." },
  { icon: Sparkles, title: "Spotless vehicles", text: "Cleaned and sanitised before every single rental." },
];

export function HomePage() {
  const navigate = useNavigate();
  const { data: company } = useCompany();
  const currency = company?.currency ?? "USD";
  const [dates] = useState(defaultDates);
  const [pickupAt, setPickupAt] = useState(dates.pickup);
  const [returnAt, setReturnAt] = useState(dates.ret);
  const [location, setLocation] = useState("");

  const categoriesQuery = useQuery({ queryKey: ["public", "categories"], queryFn: publicApi.getCategories, staleTime: 5 * 60_000 });
  const featuredQuery = useQuery({
    queryKey: ["public", "vehicles", "featured"],
    queryFn: () => publicApi.listVehicles({ pageSize: 6, sort: "price_asc" }),
    staleTime: 60_000,
  });

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickupAt) params.set("pickupAt", new Date(pickupAt).toISOString());
    if (returnAt) params.set("returnAt", new Date(returnAt).toISOString());
    if (location) params.set("location", location);
    navigate(`/fleet?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-slate-900" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-400/20 blur-2xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-20 sm:px-6 lg:pt-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
              <Sparkles size={14} /> Premium cars, everyday prices
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Rent the right car for every&nbsp;journey
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-50/90">
              From city compacts to luxury sedans and spacious vans — book a well-maintained vehicle in minutes and hit
              the road with confidence.
            </p>
          </div>

          {/* Search widget */}
          <form
            onSubmit={handleSearch}
            className="mt-10 grid gap-4 rounded-2xl bg-white p-5 shadow-xl sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end"
          >
            <div>
              <label className="label flex items-center gap-1.5">
                <MapPin size={14} className="text-brand-500" /> Pick-up location
              </label>
              <input
                className="input"
                placeholder="City, airport or office"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <CalendarRange size={14} className="text-brand-500" /> Pick-up
              </label>
              <input type="datetime-local" className="input" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <CalendarRange size={14} className="text-brand-500" /> Return
              </label>
              <input type="datetime-local" className="input" value={returnAt} min={pickupAt} onChange={(e) => setReturnAt(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary h-[46px] w-full lg:w-auto lg:px-7">
              Search cars
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Browse by category</h2>
            <p className="mt-2 text-slate-500">Find the perfect class for your trip.</p>
          </div>
          <Link to="/fleet" className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(categoriesQuery.data ?? []).map((c) => (
            <Link
              key={c.id}
              to={`/fleet?categoryId=${c.id}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <CarFront size={24} />
              </span>
              <span className="text-sm font-semibold text-slate-800">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured fleet */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Popular vehicles</h2>
              <p className="mt-2 text-slate-500">Hand-picked cars loved by our customers.</p>
            </div>
            <Link to="/fleet" className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block">
              See full fleet →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredQuery.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
                ))
              : (featuredQuery.data?.data ?? []).map((v) => <VehicleCard key={v.id} vehicle={v} currency={currency} />)}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <f.icon size={22} />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center shadow-xl sm:px-12">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="relative">
            <Tag className="mx-auto text-brand-100" size={32} />
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Ready to hit the road?</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-50/90">
              Browse the full fleet, pick your dates and reserve online. Collect your keys and go.
            </p>
            <Link to="/fleet" className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-transform hover:scale-[1.02]">
              Explore the fleet
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
