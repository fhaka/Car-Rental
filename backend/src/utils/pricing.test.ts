import { describe, expect, it } from "vitest";
import { computeBookingTotals, computeRentalDays, computeReturnCharges } from "./pricing";

describe("computeRentalDays", () => {
  it("rounds a partial day up to a full day", () => {
    const pickup = new Date("2026-01-01T09:00:00Z");
    const ret = new Date("2026-01-01T15:00:00Z"); // 6 hours
    expect(computeRentalDays(pickup, ret)).toBe(1);
  });

  it("counts exactly one 24h span as 1 day", () => {
    const pickup = new Date("2026-01-01T09:00:00Z");
    const ret = new Date("2026-01-02T09:00:00Z");
    expect(computeRentalDays(pickup, ret)).toBe(1);
  });

  it("rounds a 25-hour span up to 2 days", () => {
    const pickup = new Date("2026-01-01T09:00:00Z");
    const ret = new Date("2026-01-02T10:00:00Z");
    expect(computeRentalDays(pickup, ret)).toBe(2);
  });

  it("never returns less than 1 day, even for a same-instant or negative span", () => {
    const pickup = new Date("2026-01-01T09:00:00Z");
    expect(computeRentalDays(pickup, pickup)).toBe(1);
    expect(computeRentalDays(pickup, new Date("2025-12-31T09:00:00Z"))).toBe(1);
  });

  it("computes a full multi-day week correctly", () => {
    const pickup = new Date("2026-03-01T00:00:00Z");
    const ret = new Date("2026-03-08T00:00:00Z");
    expect(computeRentalDays(pickup, ret)).toBe(7);
  });
});

describe("computeBookingTotals", () => {
  it("computes subtotal, tax and total for a standard multi-day booking", () => {
    const totals = computeBookingTotals({ dailyRate: 50, rentalDays: 4, taxPercentage: 10, discount: 0, additionalFees: 0 });
    expect(totals.subtotal).toBe(200);
    expect(totals.tax).toBe(20);
    expect(totals.totalAmount).toBe(220);
  });

  it("applies a discount before computing tax", () => {
    const totals = computeBookingTotals({ dailyRate: 100, rentalDays: 2, taxPercentage: 10, discount: 50, additionalFees: 0 });
    // subtotal 200, taxable base 150, tax 15, total 165
    expect(totals.subtotal).toBe(200);
    expect(totals.tax).toBe(15);
    expect(totals.totalAmount).toBe(165);
  });

  it("includes additional fees in the taxable base", () => {
    const totals = computeBookingTotals({ dailyRate: 100, rentalDays: 1, taxPercentage: 0, discount: 0, additionalFees: 25 });
    expect(totals.subtotal).toBe(100);
    expect(totals.totalAmount).toBe(125);
  });

  it("never lets a large discount push the taxable base or total below zero", () => {
    const totals = computeBookingTotals({ dailyRate: 50, rentalDays: 1, taxPercentage: 10, discount: 999, additionalFees: 0 });
    expect(totals.tax).toBe(0);
    expect(totals.totalAmount).toBe(0);
  });

  it("rounds to 2 decimal places to avoid floating point drift", () => {
    const totals = computeBookingTotals({ dailyRate: 33.33, rentalDays: 3, taxPercentage: 7.5, discount: 0, additionalFees: 0 });
    expect(totals.subtotal).toBe(99.99);
    expect(Number.isInteger(totals.tax * 100)).toBe(true);
    expect(Number.isInteger(totals.totalAmount * 100)).toBe(true);
  });
});

describe("computeReturnCharges", () => {
  const baseInput = {
    expectedReturnAt: new Date("2026-01-05T10:00:00Z"),
    startMileage: 10_000,
    returnMileage: 10_000,
    startFuelLevel: 100,
    returnFuelLevel: 100,
    plannedRentalDays: 4,
    lateFeePerDay: 25,
    freeMileagePerDay: 200,
    mileageFeePerUnit: 0.5,
    fuelChargePerUnit: 2,
  };

  it("charges nothing when the vehicle is returned on time, within mileage, and full of fuel", () => {
    const charges = computeReturnCharges({ ...baseInput, actualReturnAt: new Date("2026-01-05T09:00:00Z") });
    expect(charges).toEqual({ lateDays: 0, lateFee: 0, excessMileage: 0, mileageFee: 0, fuelMissingPercent: 0, fuelFee: 0 });
  });

  it("charges a late fee per day for a late return, rounding partial days up", () => {
    const charges = computeReturnCharges({ ...baseInput, actualReturnAt: new Date("2026-01-07T11:00:00Z") }); // 2 days + 1h late
    expect(charges.lateDays).toBe(3);
    expect(charges.lateFee).toBe(75);
  });

  it("charges for mileage beyond the free allowance for the planned rental length", () => {
    // 4 planned days * 200 free miles/day = 800 free miles
    const charges = computeReturnCharges({
      ...baseInput,
      actualReturnAt: new Date("2026-01-05T09:00:00Z"),
      returnMileage: 10_000 + 950, // 950 miles used
    });
    expect(charges.excessMileage).toBe(150);
    expect(charges.mileageFee).toBe(75);
  });

  it("never charges mileage fees when usage is within the free allowance", () => {
    const charges = computeReturnCharges({ ...baseInput, actualReturnAt: new Date("2026-01-05T09:00:00Z"), returnMileage: 10_000 + 500 });
    expect(charges.excessMileage).toBe(0);
    expect(charges.mileageFee).toBe(0);
  });

  it("charges for missing fuel based on the percentage gap", () => {
    const charges = computeReturnCharges({ ...baseInput, actualReturnAt: new Date("2026-01-05T09:00:00Z"), returnFuelLevel: 70 });
    expect(charges.fuelMissingPercent).toBe(30);
    expect(charges.fuelFee).toBe(60);
  });

  it("never produces a negative fuel charge when the tank is returned fuller than it started", () => {
    const charges = computeReturnCharges({ ...baseInput, actualReturnAt: new Date("2026-01-05T09:00:00Z"), startFuelLevel: 50, returnFuelLevel: 100 });
    expect(charges.fuelMissingPercent).toBe(0);
    expect(charges.fuelFee).toBe(0);
  });

  it("combines late, mileage and fuel charges independently", () => {
    const charges = computeReturnCharges({
      ...baseInput,
      actualReturnAt: new Date("2026-01-06T10:00:00Z"), // exactly 1 day late
      returnMileage: 10_000 + 1000, // 200 miles over the 800 free allowance
      returnFuelLevel: 80, // 20% missing
    });
    expect(charges.lateDays).toBe(1);
    expect(charges.lateFee).toBe(25);
    expect(charges.excessMileage).toBe(200);
    expect(charges.mileageFee).toBe(100);
    expect(charges.fuelMissingPercent).toBe(20);
    expect(charges.fuelFee).toBe(40);
  });
});
