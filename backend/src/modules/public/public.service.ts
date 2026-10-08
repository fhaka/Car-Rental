import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { toNumber } from "../../utils/money";
import { hashPassword } from "../../lib/password";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { findConflictingVehicleIds } from "../availability/availability.service";
import { bookingsService } from "../bookings/bookings.service";
import { settingsService } from "../settings/settings.service";
import { sendBookingReceivedEmail } from "../../lib/emails";
import { ListPublicVehiclesQuery, CreatePublicBookingInput } from "./public.schemas";

/**
 * The public site shows only presentation-safe vehicle fields - never the
 * plate, VIN, mileage, insurance/registration dates, internal notes, etc.
 */
const PUBLIC_VEHICLE_SELECT = {
  id: true,
  brand: true,
  model: true,
  year: true,
  color: true,
  transmission: true,
  fuelType: true,
  seats: true,
  doors: true,
  dailyRate: true,
  weeklyRate: true,
  securityDeposit: true,
  status: true,
  category: { select: { id: true, name: true, description: true } },
  images: { select: { id: true, url: true, isPrimary: true }, orderBy: { isPrimary: "desc" as const } },
} satisfies Prisma.VehicleSelect;

type RawPublicVehicle = Prisma.VehicleGetPayload<{ select: typeof PUBLIC_VEHICLE_SELECT }>;

function serializeVehicle(v: RawPublicVehicle) {
  return {
    id: v.id,
    brand: v.brand,
    model: v.model,
    year: v.year,
    color: v.color,
    transmission: v.transmission,
    fuelType: v.fuelType,
    seats: v.seats,
    doors: v.doors,
    dailyRate: toNumber(v.dailyRate),
    weeklyRate: v.weeklyRate == null ? null : toNumber(v.weeklyRate),
    securityDeposit: toNumber(v.securityDeposit),
    status: v.status,
    category: v.category,
    images: v.images,
  };
}

// The email used for the synthetic "Online Booking" account that owns every
// web-originated booking, so staff can tell at a glance it came from the site.
const SYSTEM_BOOKING_EMAIL = "online@vcarrent.al";

async function getSystemBookingUserId(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: SYSTEM_BOOKING_EMAIL }, select: { id: true } });
  if (existing) return existing.id;
  // Created inactive with a random password: it can never be logged into, it
  // only exists to satisfy the Booking.createdBy relation for online bookings.
  const user = await prisma.user.create({
    data: {
      email: SYSTEM_BOOKING_EMAIL,
      passwordHash: await hashPassword(`online-${Math.random().toString(36).slice(2)}${Date.now()}`),
      firstName: "Online",
      lastName: "Booking",
      role: "EMPLOYEE",
      isActive: false,
    },
    select: { id: true },
  });
  return user.id;
}

export const publicService = {
  async getCompany() {
    const s = await settingsService.getSettings();
    return {
      companyName: s.companyName,
      address: s.address,
      phone: s.phone,
      email: s.email,
      website: s.website,
      currency: s.currency,
      cancellationPolicy: s.cancellationPolicy,
      rentalTerms: s.rentalTerms,
    };
  },

  async listCategories() {
    const categories = await prisma.vehicleCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
    return { data: categories };
  },

  async listVehicles(q: ListPublicVehiclesQuery) {
    const where: Prisma.VehicleWhereInput = {
      isActive: true,
      status: { notIn: ["MAINTENANCE", "INACTIVE"] },
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.transmission ? { transmission: q.transmission } : {}),
      ...(q.fuelType ? { fuelType: q.fuelType } : {}),
      ...(q.seats ? { seats: { gte: q.seats } } : {}),
      ...(q.minPrice || q.maxPrice
        ? { dailyRate: { ...(q.minPrice ? { gte: q.minPrice } : {}), ...(q.maxPrice ? { lte: q.maxPrice } : {}) } }
        : {}),
      ...(q.search
        ? {
            OR: [
              { brand: { contains: q.search, mode: "insensitive" } },
              { model: { contains: q.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    // When a date window is supplied, hide anything already booked for it so the
    // catalogue only shows cars the customer can actually reserve.
    if (q.pickupAt && q.returnAt) {
      const conflicting = await findConflictingVehicleIds(prisma, q.pickupAt, q.returnAt);
      if (conflicting.size > 0) where.id = { notIn: Array.from(conflicting) };
    }

    const orderBy: Prisma.VehicleOrderByWithRelationInput =
      q.sort === "price_desc" ? { dailyRate: "desc" } : q.sort === "newest" ? { year: "desc" } : { dailyRate: "asc" };

    const [data, total] = await prisma.$transaction([
      prisma.vehicle.findMany({ where, select: PUBLIC_VEHICLE_SELECT, orderBy, ...paginationSkipTake(q.page, q.pageSize) }),
      prisma.vehicle.count({ where }),
    ]);

    return { data: data.map(serializeVehicle), meta: buildPaginationMeta(q.page, q.pageSize, total) };
  },

  async getVehicle(id: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: PUBLIC_VEHICLE_SELECT });
    if (!vehicle || vehicle.status === "INACTIVE") throw AppError.notFound("Vehicle not found");
    return { vehicle: serializeVehicle(vehicle) };
  },

  /**
   * Guest online booking. Finds or creates the customer by email, then reuses
   * the exact same bookingsService.create used by staff - so pricing, the tax
   * calc and the no-double-booking rule are identical, and the resulting
   * booking shows up in the dashboard as a PENDING request for staff to confirm.
   */
  async createBooking(input: CreatePublicBookingInput) {
    const email = input.customer.email.toLowerCase();

    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          firstName: input.customer.firstName,
          lastName: input.customer.lastName,
          email,
          phone: input.customer.phone,
          address: input.customer.address ?? null,
          city: input.customer.city ?? null,
          country: input.customer.country ?? null,
          driverLicenseNumber: input.customer.driverLicenseNumber ?? null,
          notes: "Created via online booking",
          isActive: true,
        },
      });
    } else if (!customer.isActive) {
      customer = await prisma.customer.update({ where: { id: customer.id }, data: { isActive: true } });
    }

    const systemUserId = await getSystemBookingUserId();

    const booking = await bookingsService.create(
      {
        customerId: customer.id,
        vehicleId: input.vehicleId,
        pickupAt: input.pickupAt,
        returnAt: input.returnAt,
        pickupLocation: input.pickupLocation,
        returnLocation: input.returnLocation,
        discount: 0,
        additionalFees: 0,
        notes: input.notes ? `[Online booking] ${input.notes}` : "[Online booking]",
        status: BookingStatus.PENDING,
      },
      systemUserId
    );

    // Email the customer their booking request confirmation (non-blocking).
    void sendBookingReceivedEmail({
      bookingNumber: booking.bookingNumber,
      customerFirstName: customer.firstName,
      customerEmail: customer.email,
      vehicle: { brand: booking.vehicle.brand, model: booking.vehicle.model, year: booking.vehicle.year },
      pickupAt: booking.pickupAt,
      returnAt: booking.returnAt,
      pickupLocation: booking.pickupLocation,
      returnLocation: booking.returnLocation,
      rentalDays: booking.rentalDays,
      totalAmount: toNumber(booking.totalAmount),
      securityDeposit: toNumber(booking.securityDeposit),
    });

    // Confirmation-safe subset for the customer.
    return {
      booking: {
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        pickupAt: booking.pickupAt,
        returnAt: booking.returnAt,
        pickupLocation: booking.pickupLocation,
        returnLocation: booking.returnLocation,
        rentalDays: booking.rentalDays,
        dailyRate: toNumber(booking.dailyRate),
        subtotal: toNumber(booking.subtotal),
        tax: toNumber(booking.tax),
        totalAmount: toNumber(booking.totalAmount),
        securityDeposit: toNumber(booking.securityDeposit),
        vehicle: {
          brand: booking.vehicle.brand,
          model: booking.vehicle.model,
          year: booking.vehicle.year,
        },
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
        },
      },
    };
  },
};
