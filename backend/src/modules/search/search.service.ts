import { prisma } from "../../lib/prisma";

export const searchService = {
  async search(q: string) {
    const [vehicles, customers, bookings, rentals] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          OR: [
            { plateNumber: { contains: q, mode: "insensitive" } },
            { vin: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, plateNumber: true, brand: true, model: true, status: true },
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      }),
      prisma.booking.findMany({
        where: { bookingNumber: { contains: q, mode: "insensitive" } },
        take: 5,
        select: { id: true, bookingNumber: true, status: true, pickupAt: true, returnAt: true },
      }),
      prisma.rental.findMany({
        where: { rentalNumber: { contains: q, mode: "insensitive" } },
        take: 5,
        select: { id: true, rentalNumber: true, status: true },
      }),
    ]);

    return { vehicles, customers, bookings, rentals };
  },
};
