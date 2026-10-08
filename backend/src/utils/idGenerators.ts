/**
 * Human-friendly sequential-looking reference numbers for bookings, rentals,
 * payments, etc. Not guaranteed globally unique on their own (timestamp +
 * random suffix keeps collision risk negligible), backed by a unique DB
 * constraint on the column as the real guarantee.
 */
function withPrefix(prefix: string) {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const ts = now.getTime().toString().slice(-5);
  return `${prefix}-${y}${m}-${ts}${rand}`;
}

export const generateBookingNumber = () => withPrefix("BK");
export const generateRentalNumber = () => withPrefix("RT");
export const generatePaymentNumber = () => withPrefix("PY");
