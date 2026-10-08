import { describe, expect, it } from "vitest";
import { round2, toNumber } from "./money";

describe("toNumber", () => {
  it("returns 0 for null or undefined", () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  it("passes a plain number through unchanged", () => {
    expect(toNumber(42.5)).toBe(42.5);
  });

  it("parses a numeric string", () => {
    expect(toNumber("19.99")).toBe(19.99);
  });

  it("coerces a Prisma Decimal-like value via its toString()", () => {
    // toNumber() only relies on the value exposing toString() - the same
    // duck-typed contract Prisma.Decimal satisfies - so a lightweight fake
    // stands in here and keeps this test independent of a generated client.
    const decimalLike = { toString: () => "123.45" } as unknown as Parameters<typeof toNumber>[0];
    expect(toNumber(decimalLike)).toBe(123.45);
  });
});

describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(10.1249)).toBe(10.12);
    expect(round2(10.005)).toBe(10.01);
  });

  it("avoids classic floating point drift for simple sums", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it("leaves already-clean values unchanged", () => {
    expect(round2(100)).toBe(100);
    expect(round2(19.99)).toBe(19.99);
  });
});
