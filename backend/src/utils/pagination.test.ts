import { describe, expect, it } from "vitest";
import { buildPaginationMeta, paginationQuerySchema, paginationSkipTake } from "./pagination";

describe("paginationQuerySchema", () => {
  it("applies sensible defaults when nothing is provided", () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed).toEqual({ page: 1, pageSize: 20, sortOrder: "desc" });
  });

  it("coerces string query params into numbers", () => {
    const parsed = paginationQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(50);
  });

  it("rejects a pageSize above the max of 100", () => {
    expect(() => paginationQuerySchema.parse({ pageSize: "500" })).toThrow();
  });

  it("rejects a page below 1", () => {
    expect(() => paginationQuerySchema.parse({ page: "0" })).toThrow();
  });
});

describe("buildPaginationMeta", () => {
  it("computes total pages, rounding up", () => {
    expect(buildPaginationMeta(1, 10, 25)).toEqual({ page: 1, pageSize: 10, total: 25, totalPages: 3 });
  });

  it("never reports fewer than 1 total page, even with zero results", () => {
    expect(buildPaginationMeta(1, 10, 0)).toEqual({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  });

  it("handles an exact multiple with no remainder", () => {
    expect(buildPaginationMeta(2, 10, 20).totalPages).toBe(2);
  });
});

describe("paginationSkipTake", () => {
  it("computes skip/take for the first page", () => {
    expect(paginationSkipTake(1, 20)).toEqual({ skip: 0, take: 20 });
  });

  it("computes skip/take for a later page", () => {
    expect(paginationSkipTake(3, 10)).toEqual({ skip: 20, take: 10 });
  });
});
