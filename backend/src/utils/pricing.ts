import { round2 } from "./money";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Rental days are whole calendar days, rounded up, minimum 1 - a 6-hour rental still bills as 1 day. */
export function computeRentalDays(pickupAt: Date, returnAt: Date): number {
  const diffMs = returnAt.getTime() - pickupAt.getTime();
  return Math.max(1, Math.ceil(diffMs / MS_PER_DAY));
}

export interface BookingTotalsInput {
  dailyRate: number;
  rentalDays: number;
  taxPercentage: number;
  discount: number;
  additionalFees: number;
}

export interface BookingTotals {
  subtotal: number;
  tax: number;
  totalAmount: number;
}

/**
 * The single authoritative place booking/rental charges are computed.
 * Always derived server-side from the vehicle's current rate and company
 * settings - a client-supplied total is never trusted.
 */
export function computeBookingTotals(input: BookingTotalsInput): BookingTotals {
  const subtotal = round2(input.dailyRate * input.rentalDays);
  const taxableBase = Math.max(0, subtotal + input.additionalFees - input.discount);
  const tax = round2((taxableBase * input.taxPercentage) / 100);
  const totalAmount = round2(taxableBase + tax);
  return { subtotal, tax, totalAmount };
}

export interface ReturnChargesInput {
  expectedReturnAt: Date;
  actualReturnAt: Date;
  startMileage: number;
  returnMileage: number;
  startFuelLevel: number; // 0-100
  returnFuelLevel: number; // 0-100
  plannedRentalDays: number;
  lateFeePerDay: number;
  freeMileagePerDay: number;
  mileageFeePerUnit: number;
  fuelChargePerUnit: number; // cost per 1% of fuel missing
}

export interface ReturnCharges {
  lateDays: number;
  lateFee: number;
  excessMileage: number;
  mileageFee: number;
  fuelMissingPercent: number;
  fuelFee: number;
}

/** Server-side computation of late/mileage/fuel charges at rental check-in. Never trusts client totals. */
export function computeReturnCharges(input: ReturnChargesInput): ReturnCharges {
  const lateMs = input.actualReturnAt.getTime() - input.expectedReturnAt.getTime();
  const lateDays = lateMs > 0 ? Math.ceil(lateMs / MS_PER_DAY) : 0;
  const lateFee = round2(lateDays * input.lateFeePerDay);

  const milesUsed = Math.max(0, input.returnMileage - input.startMileage);
  const freeMileageAllowed = input.freeMileagePerDay * input.plannedRentalDays;
  const excessMileage = Math.max(0, milesUsed - freeMileageAllowed);
  const mileageFee = round2(excessMileage * input.mileageFeePerUnit);

  const fuelMissingPercent = Math.max(0, input.startFuelLevel - input.returnFuelLevel);
  const fuelFee = round2(fuelMissingPercent * input.fuelChargePerUnit);

  return { lateDays, lateFee, excessMileage, mileageFee, fuelMissingPercent, fuelFee };
}
