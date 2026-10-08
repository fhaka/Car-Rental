import { describe, expect, it, vi } from "vitest";

// availability.service.ts imports the shared `prisma` singleton (../../lib/prisma)
// purely so `availabilityService.search()` can use it - findConflictingVehicleIds
// itself always takes its db client as a parameter. Mock the singleton so this
// unit test never constructs a real PrismaClient (which requires a generated
// client + a reachable database) just to import the module under test.
vi.mock("../../lib/prisma", () => ({ prisma: {} }));

const { findConflictingVehicleIds } = await import("./availability.service");

/**
 * findConflictingVehicleIds is the single source of truth the whole app relies
 * on to enforce "no overlapping bookings" server-side (see bookings.service and
 * rentals.service, which both call it inside a Serializable transaction before
 * committing a new booking/rental). These tests exercise it against a minimal
 * fake Prisma client so the overlap window logic and query shape are verified
 * without needing a live database.
 */
function fakeClient(bookings: { vehicleId: string }[], rentals: { vehicleId: string }[] = []) {
  return {
    booking: { findMany: vi.fn().mockResolvedValue(bookings) },
    rental: { findMany: vi.fn().mockResolvedValue(rentals) },
  } as any;
}

describe("findConflictingVehicleIds", () => {
  it("returns an empty set when nothing overlaps", async () => {
    const client = fakeClient([], []);
    const result = await findConflictingVehicleIds(client, new Date("2026-02-01"), new Date("2026-02-05"));
    expect(result.size).toBe(0);
  });

  it("includes vehicles with an overlapping CONFIRMED/ACTIVE booking", async () => {
    const client = fakeClient([{ vehicleId: "veh-1" }]);
    const result = await findConflictingVehicleIds(client, new Date("2026-02-01"), new Date("2026-02-05"));
    expect(result.has("veh-1")).toBe(true);
  });

  it("includes vehicles with an overlapping PENDING/ACTIVE/OVERDUE rental", async () => {
    const client = fakeClient([], [{ vehicleId: "veh-2" }]);
    const result = await findConflictingVehicleIds(client, new Date("2026-02-01"), new Date("2026-02-05"));
    expect(result.has("veh-2")).toBe(true);
  });

  it("only queries booking statuses that actually block availability", async () => {
    const client = fakeClient([]);
    await findConflictingVehicleIds(client, new Date("2026-02-01"), new Date("2026-02-05"));
    const where = client.booking.findMany.mock.calls[0][0].where;
    expect(where.status.in).toEqual(["CONFIRMED", "ACTIVE"]);
  });

  it("only queries rental statuses that actually block availability", async () => {
    const client = fakeClient([]);
    await findConflictingVehicleIds(client, new Date("2026-02-01"), new Date("2026-02-05"));
    const where = client.rental.findMany.mock.calls[0][0].where;
    expect(where.status.in).toEqual(["PENDING", "ACTIVE", "OVERDUE"]);
  });

  it("uses a strict half-open interval overlap test (pickup < existing.return AND return > existing.pickup)", async () => {
    const client = fakeClient([]);
    const pickup = new Date("2026-02-01T10:00:00Z");
    const ret = new Date("2026-02-05T10:00:00Z");
    await findConflictingVehicleIds(client, pickup, ret);
    const where = client.booking.findMany.mock.calls[0][0].where;
    // A back-to-back booking starting exactly when this one ends should NOT conflict:
    // pickupAt < returnAt(new) AND returnAt > pickupAt(new)
    expect(where.pickupAt.lt).toEqual(ret);
    expect(where.returnAt.gt).toEqual(pickup);
  });

  it("excludes the booking being edited so a booking does not conflict with itself", async () => {
    const client = fakeClient([]);
    await findConflictingVehicleIds(client, new Date("2026-02-01"), new Date("2026-02-05"), { excludeBookingId: "bk-1" });
    const where = client.booking.findMany.mock.calls[0][0].where;
    expect(where.id).toEqual({ not: "bk-1" });
  });

  it("excludes the rental being edited (e.g. during an extend) so it does not conflict with itself", async () => {
    const client = fakeClient([]);
    await findConflictingVehicleIds(client, new Date("2026-02-01"), new Date("2026-02-05"), { excludeRentalId: "rt-1" });
    const where = client.rental.findMany.mock.calls[0][0].where;
    expect(where.id).toEqual({ not: "rt-1" });
  });

  it("deduplicates a vehicle id that conflicts via both a booking and a rental", async () => {
    const client = fakeClient([{ vehicleId: "veh-3" }], [{ vehicleId: "veh-3" }]);
    const result = await findConflictingVehicleIds(client, new Date("2026-02-01"), new Date("2026-02-05"));
    expect(result.size).toBe(1);
    expect(result.has("veh-3")).toBe(true);
  });
});
