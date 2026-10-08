import { Prisma } from "@prisma/client";

/** Coerces a Prisma Decimal / string / number into a plain JS number for arithmetic. */
export function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

/** Rounds to 2 decimal places to avoid floating point drift in money math. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
