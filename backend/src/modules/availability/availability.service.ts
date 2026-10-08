import { Prisma, PrismaClient, VehicleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { AvailabilitySearchInput } from "./availability.schemas";

type TxClient = PrismaClient | Prisma.TransactionClient;

/**
 * Returns the vehicle ids that are NOT available for the given [pickupAt, returnAt)
 * window because of an overlapping confirmed/active booking or an overlapping
 * pending/active/overdue rental. This is the single source of truth for
 * "is this vehicle free" and is used both by the public availability search
 * and by booking/rental creation to enforce the no-double-booking rule
 * server-side (never trust the frontend for this).
 */
export async function findConflictingVehicleIds(
  client: TxClient,
  pickupAt: Date,
  returnAt: Date,
  opts: { excludeBookingId?: string; excludeRentalId?: string } = {}
): Promise<Set<string>> {
  const conflictingBookings = await client.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "ACTIVE"] },
      pickupAt: { lt: returnAt },
      returnAt: { gt: pickupAt },
      ...(opts.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
    },
    select: { vehicleId: true },
  });

  const conflictingRentals = await client.rental.findMany({
    where: {
      status: { in: ["PENDING", "ACTIVE", "OVERDUE"] },
      checkoutAt: { lt: returnAt },
      expectedReturnAt: { gt: pickupAt },
      ...(opts.excludeRentalId ? { id: { not: opts.excludeRentalId } } : {}),
    },
    select: { vehicleId: true },
  });

  const ids = new Set<string>();
  conflictingBookings.forEach((b) => ids.add(b.vehicleId));
  conflictingRentals.forEach((r) => ids.add(r.vehicleId));
  return ids;
}

export const availabilityService = {
  async search(input: AvailabilitySearchInput) {
    const conflictingIds = await findConflictingVehicleIds(prisma, input.pickupAt, input.returnAt, {
      excludeBookingId: input.excludeBookingId,
      excludeRentalId: input.excludeRentalId,
    });

    const where: Prisma.VehicleWhereInput = {
      isActive: true,
      status: { notIn: [VehicleStatus.MAINTENANCE, VehicleStatus.INACTIVE] },
      id: { notIn: Array.from(conflictingIds) },
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.brand ? { brand: { equals: input.brand, mode: "insensitive" } } : {}),
      ...(input.model ? { model: { equals: input.model, mode: "insensitive" } } : {}),
      ...(input.transmission ? { transmission: input.transmission } : {}),
      ...(input.fuelType ? { fuelType: input.fuelType } : {}),
      ...(input.seats ? { seats: { gte: input.seats } } : {}),
      ...(input.minPrice || input.maxPrice
        ? {
            dailyRate: {
              ...(input.minPrice ? { gte: input.minPrice } : {}),
              ...(input.maxPrice ? { lte: input.maxPrice } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.vehicle.findMany({
        where,
        include: { category: true, images: { orderBy: { isPrimary: "desc" } } },
        orderBy: { dailyRate: "asc" },
        ...paginationSkipTake(input.page, input.pageSize),
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(input.page, input.pageSize, total) };
  },

  /** True if the given vehicle is free for the whole requested window. */
  async isVehicleAvailable(
    client: TxClient,
    vehicleId: string,
    pickupAt: Date,
    returnAt: Date,
    opts: { excludeBookingId?: string; excludeRentalId?: string } = {}
  ): Promise<boolean> {
    const conflicting = await findConflictingVehicleIds(client, pickupAt, returnAt, opts);
    return !conflicting.has(vehicleId);
  },
};
