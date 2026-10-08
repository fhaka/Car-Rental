import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { generateBookingNumber } from "../../utils/idGenerators";
import { computeBookingTotals, computeRentalDays } from "../../utils/pricing";
import { toNumber } from "../../utils/money";
import { findConflictingVehicleIds } from "../availability/availability.service";
import { settingsService } from "../settings/settings.service";
import { CreateBookingInput, ListBookingsQuery, UpdateBookingInput } from "./bookings.schemas";

const INCLUDE_DEFAULT = {
  customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  vehicle: { select: { id: true, plateNumber: true, brand: true, model: true, year: true, dailyRate: true, status: true } },
  category: true,
} satisfies Prisma.BookingInclude;

const ALLOWED_MANUAL_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
  CONFIRMED: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
  ACTIVE: [],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export const bookingsService = {
  async list(query: ListBookingsQuery) {
    const { page, pageSize, search, sortBy, sortOrder, status, customerId, vehicleId, from, to } = query;
    const where: Prisma.BookingWhereInput = {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(from ? { pickupAt: { gte: from } } : {}),
      ...(to ? { returnAt: { lte: to } } : {}),
      ...(search
        ? {
            OR: [
              { bookingNumber: { contains: search, mode: "insensitive" } },
              { customer: { firstName: { contains: search, mode: "insensitive" } } },
              { customer: { lastName: { contains: search, mode: "insensitive" } } },
              { vehicle: { plateNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: INCLUDE_DEFAULT,
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.booking.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const booking = await prisma.booking.findUnique({ where: { id }, include: INCLUDE_DEFAULT });
    if (!booking) throw AppError.notFound("Booking not found");
    return booking;
  },

  async create(input: CreateBookingInput, createdById: string) {
    const [vehicle, customer, settings] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: input.vehicleId } }),
      prisma.customer.findUnique({ where: { id: input.customerId } }),
      settingsService.getSettings(),
    ]);
    if (!vehicle || !vehicle.isActive) throw AppError.badRequest("Vehicle not found or inactive", "VEHICLE_NOT_FOUND");
    if (vehicle.status === "INACTIVE" || vehicle.status === "MAINTENANCE") {
      throw AppError.conflict("This vehicle is not currently rentable (maintenance/inactive)", "VEHICLE_NOT_AVAILABLE");
    }
    if (!customer || !customer.isActive) throw AppError.badRequest("Customer not found or inactive", "CUSTOMER_NOT_FOUND");

    const rentalDays = computeRentalDays(input.pickupAt, input.returnAt);
    const dailyRate = toNumber(vehicle.dailyRate);
    const { subtotal, tax, totalAmount } = computeBookingTotals({
      dailyRate,
      rentalDays,
      taxPercentage: toNumber(settings.taxPercentage),
      discount: input.discount,
      additionalFees: input.additionalFees,
    });
    const securityDeposit = input.securityDeposit ?? toNumber(vehicle.securityDeposit) ?? toNumber(settings.defaultSecurityDeposit);

    try {
      return await prisma.$transaction(
        async (tx) => {
          const conflicting = await findConflictingVehicleIds(tx, input.pickupAt, input.returnAt);
          if (conflicting.has(input.vehicleId)) {
            throw AppError.conflict("Vehicle is not available for the selected dates", "VEHICLE_NOT_AVAILABLE");
          }

          const booking = await tx.booking.create({
            data: {
              bookingNumber: generateBookingNumber(),
              customerId: input.customerId,
              vehicleId: input.vehicleId,
              categoryId: vehicle.categoryId,
              pickupAt: input.pickupAt,
              returnAt: input.returnAt,
              pickupLocation: input.pickupLocation,
              returnLocation: input.returnLocation,
              dailyRate,
              rentalDays,
              subtotal,
              tax,
              discount: input.discount,
              additionalFees: input.additionalFees,
              securityDeposit,
              totalAmount,
              amountPaid: 0,
              remainingBalance: totalAmount,
              notes: input.notes,
              status: input.status,
              createdById,
            },
            include: INCLUDE_DEFAULT,
          });

          if (input.status === BookingStatus.CONFIRMED) {
            await tx.vehicle.update({ where: { id: input.vehicleId }, data: { status: "RESERVED" } });
          }

          return booking;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Postgres serialization failure under concurrent booking attempts for the same vehicle/window.
      throw AppError.conflict("Vehicle is not available for the selected dates", "VEHICLE_NOT_AVAILABLE");
    }
  },

  async update(id: string, input: UpdateBookingInput) {
    const existing = await this.get(id);
    if (existing.status !== BookingStatus.PENDING && existing.status !== BookingStatus.CONFIRMED) {
      throw AppError.conflict("Only pending or confirmed bookings can be edited", "BOOKING_NOT_EDITABLE");
    }

    const pickupAt = input.pickupAt ?? existing.pickupAt;
    const returnAt = input.returnAt ?? existing.returnAt;
    const vehicleId = input.vehicleId ?? existing.vehicleId;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || !vehicle.isActive) throw AppError.badRequest("Vehicle not found or inactive", "VEHICLE_NOT_FOUND");

    const settings = await settingsService.getSettings();
    const rentalDays = computeRentalDays(pickupAt, returnAt);
    const dailyRate = toNumber(vehicle.dailyRate);
    const discount = input.discount ?? toNumber(existing.discount);
    const additionalFees = input.additionalFees ?? toNumber(existing.additionalFees);
    const { subtotal, tax, totalAmount } = computeBookingTotals({
      dailyRate,
      rentalDays,
      taxPercentage: toNumber(settings.taxPercentage),
      discount,
      additionalFees,
    });
    const amountPaid = toNumber(existing.amountPaid);

    try {
      return await prisma.$transaction(
        async (tx) => {
          const conflicting = await findConflictingVehicleIds(tx, pickupAt, returnAt, { excludeBookingId: id });
          if (conflicting.has(vehicleId)) {
            throw AppError.conflict("Vehicle is not available for the selected dates", "VEHICLE_NOT_AVAILABLE");
          }
          return tx.booking.update({
            where: { id },
            data: {
              vehicleId,
              pickupAt,
              returnAt,
              pickupLocation: input.pickupLocation ?? existing.pickupLocation,
              returnLocation: input.returnLocation ?? existing.returnLocation,
              dailyRate,
              rentalDays,
              subtotal,
              tax,
              discount,
              additionalFees,
              securityDeposit: input.securityDeposit ?? toNumber(existing.securityDeposit),
              totalAmount,
              remainingBalance: Math.max(0, totalAmount - amountPaid),
              notes: input.notes ?? existing.notes,
            },
            include: INCLUDE_DEFAULT,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.conflict("Vehicle is not available for the selected dates", "VEHICLE_NOT_AVAILABLE");
    }
  },

  async changeStatus(id: string, status: BookingStatus, reason?: string) {
    const existing = await this.get(id);
    const allowed = ALLOWED_MANUAL_TRANSITIONS[existing.status];
    if (!allowed.includes(status)) {
      throw AppError.conflict(
        `Cannot move booking from ${existing.status} to ${status}`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id },
        data: { status, notes: reason ? `${existing.notes ?? ""}\n[${status}] ${reason}`.trim() : existing.notes },
        include: INCLUDE_DEFAULT,
      });

      if (status === BookingStatus.CONFIRMED) {
        await tx.vehicle.update({ where: { id: existing.vehicleId }, data: { status: "RESERVED" } });
      }
      if (status === BookingStatus.CANCELLED || status === BookingStatus.NO_SHOW) {
        // Releases availability: no confirmed/active booking remains, so the vehicle search
        // will surface it again automatically. If nothing else has it reserved, free it up.
        const vehicle = await tx.vehicle.findUnique({ where: { id: existing.vehicleId } });
        if (vehicle?.status === "RESERVED") {
          await tx.vehicle.update({ where: { id: existing.vehicleId }, data: { status: "AVAILABLE" } });
        }
      }

      return booking;
    });
  },
};
