import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { CarFront, LogOut, X } from "lucide-react";
import { NAV_GROUPS } from "./navConfig";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../features/auth/useAuth";

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <CarFront size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">V Car Rent</span>
          </div>
          <button className="text-slate-400 hover:text-white lg:hidden" onClick={onCloseMobile}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group, gi) => {
            const visibleItems = group.items.filter((item) => !item.roles || (user && item.roles.includes(user.role)));
            if (visibleItems.length === 0) return null;
            return (
              <div key={gi} className="mb-4">
                {group.label && <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.label}</p>}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive ? "bg-brand-500 text-white shadow-sm" : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                        )
                      }
                    >
                      <item.icon size={18} strokeWidth={2} />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-slate-400 capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-sidebar-hover hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
