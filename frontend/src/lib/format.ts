const currencyCache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number | string, currency = "USD"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  let formatter = currencyCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
    currencyCache.set(currency, formatter);
  }
  return formatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(date: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", ...opts }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, { hour: "numeric", minute: "2-digit" });
}

export function formatRelativeToNow(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  return rtf.format(diffDay, "day");
}

export function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
