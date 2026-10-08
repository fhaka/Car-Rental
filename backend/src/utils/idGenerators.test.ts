import { describe, expect, it } from "vitest";
import { generateBookingNumber, generatePaymentNumber, generateRentalNumber } from "./idGenerators";

describe("reference number generators", () => {
  it("prefixes booking numbers with BK-", () => {
    expect(generateBookingNumber()).toMatch(/^BK-\d{4}-\d{5}[A-Z0-9]{5}$/);
  });

  it("prefixes rental numbers with RT-", () => {
    expect(generateRentalNumber()).toMatch(/^RT-\d{4}-\d{5}[A-Z0-9]{5}$/);
  });

  it("prefixes payment numbers with PY-", () => {
    expect(generatePaymentNumber()).toMatch(/^PY-\d{4}-\d{5}[A-Z0-9]{5}$/);
  });

  it("generates a distinct value on each call (negligible collision risk)", () => {
    const values = new Set(Array.from({ length: 50 }, () => generateBookingNumber()));
    expect(values.size).toBe(50);
  });
});
