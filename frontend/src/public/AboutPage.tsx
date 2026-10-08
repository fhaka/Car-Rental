import { Link } from "react-router-dom";
import { Award, Car, Heart, ShieldCheck, Users } from "lucide-react";
import { useCompany } from "./useCompany";

const STATS = [
  { label: "Vehicles in fleet", value: "12+" },
  { label: "Vehicle categories", value: "6" },
  { label: "Years on the road", value: "10+" },
  { label: "Happy customers", value: "5k+" },
];

const VALUES = [
  { icon: ShieldCheck, title: "Safety first", text: "Every car is regularly serviced, inspected and fully insured before it reaches you." },
  { icon: Heart, title: "Customer obsessed", text: "We measure success by your experience — clear communication and no surprises." },
  { icon: Award, title: "Quality fleet", text: "A carefully curated range of well-kept vehicles for every need and budget." },
];

export function AboutPage() {
  const { data: company } = useCompany();

  return (
    <div>
      <section className="border-b border-slate-100 bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <span className="badge bg-brand-50 text-brand-700">About us</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Driven by service, built on trust
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
            {company?.companyName || "V Car Rent"} makes renting a car effortless. Whether you need a compact for the
            city, an SUV for the mountains or a luxury sedan for business, we pair the right vehicle with honest pricing
            and friendly, reliable service.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-card">
              <p className="text-3xl font-extrabold text-brand-600">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-slate-100 bg-white p-7 shadow-card">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <v.icon size={24} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {company?.rentalTerms && (
        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Car size={18} className="text-brand-500" /> Rental terms
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{company.rentalTerms}</p>
            {company.cancellationPolicy && (
              <>
                <h3 className="mt-6 font-semibold text-slate-800">Cancellation policy</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{company.cancellationPolicy}</p>
              </>
            )}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-center shadow-xl sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <Users className="hidden text-brand-100 sm:block" size={40} />
            <div>
              <h2 className="text-2xl font-extrabold text-white">Join thousands of happy drivers</h2>
              <p className="mt-1 text-brand-50/90">Your next car is just a few clicks away.</p>
            </div>
          </div>
          <Link to="/fleet" className="shrink-0 rounded-lg bg-white px-7 py-3 text-sm font-semibold text-brand-700 shadow-sm transition-transform hover:scale-[1.02]">
            Browse the fleet
          </Link>
        </div>
      </section>
    </div>
  );
}
