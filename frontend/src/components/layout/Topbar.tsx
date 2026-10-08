import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Search, User as UserIcon, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "../../features/notifications/useNotifications";
import { searchApi } from "../../features/search/api";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../features/auth/useAuth";
import { formatRelativeToNow } from "../../lib/format";

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useClickOutside(() => setNotifOpen(false));
  const profileRef = useClickOutside(() => setProfileOpen(false));
  const searchRef = useClickOutside(() => setSearchOpen(false));

  const { data: notifData } = useNotifications({ pageSize: 6 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const { data: searchResults } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => searchApi.search(query),
    enabled: query.trim().length >= 2,
  });

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-100 bg-white/80 px-4 py-3.5 backdrop-blur sm:px-6">
      <button className="text-slate-500 hover:text-slate-700 lg:hidden" onClick={onOpenMobileMenu}>
        <Menu size={22} />
      </button>

      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input !pl-9"
          placeholder="Search vehicles, customers, bookings…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
        />
        {searchOpen && query.trim().length >= 2 && searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
            {searchResults.vehicles.length === 0 &&
            searchResults.customers.length === 0 &&
            searchResults.bookings.length === 0 &&
            searchResults.rentals.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-400">No results found</p>
            ) : (
              <>
                {searchResults.vehicles.length > 0 && (
                  <SearchGroup title="Vehicles">
                    {searchResults.vehicles.map((v) => (
                      <SearchResultRow
                        key={v.id}
                        label={`${v.brand} ${v.model} — ${v.plateNumber}`}
                        onClick={() => {
                          navigate(`/vehicles/${v.id}`);
                          setSearchOpen(false);
                        }}
                      />
                    ))}
                  </SearchGroup>
                )}
                {searchResults.customers.length > 0 && (
                  <SearchGroup title="Customers">
                    {searchResults.customers.map((c) => (
                      <SearchResultRow
                        key={c.id}
                        label={`${c.firstName} ${c.lastName} — ${c.email}`}
                        onClick={() => {
                          navigate(`/customers/${c.id}`);
                          setSearchOpen(false);
                        }}
                      />
                    ))}
                  </SearchGroup>
                )}
                {searchResults.bookings.length > 0 && (
                  <SearchGroup title="Bookings">
                    {searchResults.bookings.map((b) => (
                      <SearchResultRow
                        key={b.id}
                        label={`${b.bookingNumber} — ${b.status}`}
                        onClick={() => {
                          navigate(`/bookings/${b.id}`);
                          setSearchOpen(false);
                        }}
                      />
                    ))}
                  </SearchGroup>
                )}
                {searchResults.rentals.length > 0 && (
                  <SearchGroup title="Rentals">
                    {searchResults.rentals.map((r) => (
                      <SearchResultRow
                        key={r.id}
                        label={`${r.rentalNumber} — ${r.status}`}
                        onClick={() => {
                          navigate(`/rentals/${r.id}`);
                          setSearchOpen(false);
                        }}
                      />
                    ))}
                  </SearchGroup>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button
            className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Bell size={20} />
            {(notifData?.unreadCount ?? 0) > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-100 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Notifications</p>
                <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => markAllRead.mutate()}>
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifData?.data.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">You're all caught up</p>}
                {notifData?.data.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead.mutate(n.id)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50 ${
                      !n.isRead ? "bg-brand-50/40" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-slate-500">{n.message}</p>
                    <p className="text-[11px] text-slate-400">{formatRelativeToNow(n.createdAt)}</p>
                  </button>
                ))}
              </div>
              <button
                className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-xs font-medium text-brand-600 hover:bg-slate-50"
                onClick={() => {
                  navigate("/notifications");
                  setNotifOpen(false);
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            className="flex items-center gap-2 rounded-lg p-1.5 pr-2.5 hover:bg-slate-100"
            onClick={() => setProfileOpen((v) => !v)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
            </div>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  navigate("/profile");
                  setProfileOpen(false);
                }}
              >
                <UserIcon size={16} /> My Profile
              </button>
              {user?.role === "ADMIN" && (
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    navigate("/settings");
                    setProfileOpen(false);
                  }}
                >
                  <SettingsIcon size={16} /> Settings
                </button>
              )}
              <button
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                onClick={() => logout.mutate()}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function SearchResultRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
      {label}
    </button>
  );
}
