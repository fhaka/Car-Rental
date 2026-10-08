import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CarFront, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { useCompany } from "./useCompany";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/fleet", label: "Fleet" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function Brand({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-sm">
        <CarFront size={20} className="text-white" />
      </div>
      <span className={`text-lg font-extrabold tracking-tight ${onDark ? "text-white" : "text-slate-900"}`}>
        V Car Rent
      </span>
    </Link>
  );
}

export function PublicLayout() {
  const { data: company } = useCompany();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-brand-600" : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800">
              Staff login
            </Link>
            <Link to="/fleet" className="btn-primary">
              Book now
            </Link>
          </div>
          <button
            type="button"
            className="btn-ghost -mr-2 p-2 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? "bg-brand-50 text-brand-600" : "text-slate-700 hover:bg-slate-50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 flex items-center gap-3 border-t border-slate-100 pt-3">
                <Link to="/login" className="btn-secondary flex-1" onClick={() => setMobileOpen(false)}>
                  Staff login
                </Link>
                <Link to="/fleet" className="btn-primary flex-1" onClick={() => setMobileOpen(false)}>
                  Book now
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1" key={location.pathname}>
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-800 bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Brand onDark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Premium car rental made simple. Transparent pricing, a well-maintained fleet, and friendly service for
              every journey across {company?.address?.split(",").slice(-1)[0]?.trim() || "the region"}.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Explore</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-slate-400 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Get in touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {company?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={16} className="shrink-0 text-brand-400" />
                  <a href={`tel:${company.phone}`} className="hover:text-white">
                    {company.phone}
                  </a>
                </li>
              )}
              {company?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail size={16} className="shrink-0 text-brand-400" />
                  <a href={`mailto:${company.email}`} className="hover:text-white">
                    {company.email}
                  </a>
                </li>
              )}
              {company?.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand-400" />
                  <span>{company.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {company?.companyName || "V Car Rent"}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
