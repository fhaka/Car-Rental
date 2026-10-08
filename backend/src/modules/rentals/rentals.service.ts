import { Prisma, RentalStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { generateRentalNumber } from "../../utils/idGenerators";
import { computeBookingTotals, computeRentalDays, computeReturnCharges } from "../../utils/pricing";
import { toNumber } from "../../utils/money";
import { findConflictingVehicleIds } from "../availability/availability.service";
import { settingsService } from "../settings/settings.service";
import { CheckinRentalInput, CheckoutRentalInput, ExtendRentalInput, ListRentalsQuery } from "./rentals.schemas";

const INCLUDE_DEFAULT = {
  customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, driverLicenseNumber: true, driverLicenseExpiry: true } },
  vehicle: { select: { id: true, plateNumber: true, brand: true, model: true, year: true, dailyRate: true, status: true, mileage: true } },
  booking: { select: { id: true, bookingNumber: true, status: true } },
} satisfies Prisma.RentalInclude;

export const rentalsService = {
  async list(query: ListRentalsQuery) {
    const { page, pageSize, search, sortBy, sortOrder, status, customerId, vehicleId } = query;
    const where: Prisma.RentalWhereInput = {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(search
        ? {
            OR: [
              { rentalNumber: { contains: search, mode: "insensitive" } },
              { customer: { firstName: { contains: search, mode: "insensitive" } } },
              { customer: { lastName: { contains: search, mode: "insensitive" } } },
              { vehicle: { plateNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.rental.findMany({
        where,
        include: INCLUDE_DEFAULT,
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.rental.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const rental = await prisma.rental.findUnique({
      where: { id },
      include: { ...INCLUDE_DEFAULT, inspections: true, damageReports: true, payments: true },
    });
    if (!rental) throw AppError.notFound("Rental not found");
    return rental;
  },

  /** Outstanding balance = final amount minus completed payments minus completed refunds already applied. */
  async getOutstandingBalance(rentalId: string): Promise<number> {
    const rental = await prisma.rental.findUniqueOrThrow({ where: { id: rentalId } });
    const payments = await prisma.payment.findMany({ where: { rentalId, status: "COMPLETED" } });
    const paid = payments
      .filter((p) => p.type === "PAYMENT")
      .reduce((sum, p) => sum + toNumber(p.amount), 0);
    const refunded = payments
      .filter((p) => p.type === "REFUND")
      .reduce((sum, p) => sum + toNumber(p.amount), 0);
    return Math.max(0, toNumber(rental.finalAmount) - paid + refunded);
  },

  async checkout(input: CheckoutRentalInput, userId: string) {
    const checkoutAt = input.checkoutAt ?? new Date();
    if (input.expectedReturnAt <= checkoutAt) {
      throw AppError.badRequest("expectedReturnAt must be after checkoutAt", "INVALID_DATE_RANGE");
    }

    const [vehicle, customer] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: input.vehicleId } }),
      prisma.customer.findUnique({ where: { id: input.customerId } }),
    ]);
    if (!vehicle || !vehicle.isActive) throw AppError.badRequest("Vehicle not found or inactive", "VEHICLE_NOT_FOUND");
    if (vehicle.status === VehicleStatus.RENTED) throw AppError.conflict("Vehicle is already rented out", "VEHICLE_NOT_AVAILABLE");
    if (vehicle.status === VehicleStatus.MAINTENANCE) throw AppError.conflict("Vehicle is under maintenance", "VEHICLE_NOT_AVAILABLE");
    if (vehicle.status === VehicleStatus.INACTIVE) throw AppError.conflict("Vehicle is inactive", "VEHICLE_NOT_AVAILABLE");
    if (!customer || !customer.isActive) throw AppError.badRequest("Customer not found or inactive", "CUSTOMER_NOT_FOUND");

    // Verify driver's license before handing over the vehicle.
    if (!customer.driverLicenseNumber || !customer.driverLicenseExpiry) {
      throw AppError.unprocessable("Customer does not have a driver's license on file", "DRIVER_LICENSE_MISSING");
    }
    if (customer.driverLicenseExpiry < checkoutAt) {
      throw AppError.unprocessable("Customer's driver's license has expired", "DRIVER_LICENSE_EXPIRED");
    }

    let booking = null;
    if (input.bookingId) {
      booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking) throw AppError.notFound("Booking not found");
      if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
        throw AppError.conflict(`Booking is ${booking.status} and cannot be checked out`, "BOOKING_NOT_CHECKOUTABLE");
      }
      if (booking.customerId !== input.customerId || booking.vehicleId !== input.vehicleId) {
        throw AppError.badRequest("Customer/vehicle does not match the selected booking", "BOOKING_MISMATCH");
      }
    }

    const settings = await settingsService.getSettings();
    const dailyRate = toNumber(vehicle.dailyRate);

    try {
      return await prisma.$transaction(
        async (tx) => {
          const conflicting = await findConflictingVehicleIds(tx, checkoutAt, input.expectedReturnAt, {
            excludeBookingId: input.bookingId,
          });
          if (conflicting.has(input.vehicleId)) {
            throw AppError.conflict("Vehicle is not available for the selected dates", "VEHICLE_NOT_AVAILABLE");
          }

          const rental = await tx.rental.create({
            data: {
              rentalNumber: generateRentalNumber(),
              bookingId: booking?.id,
              customerId: input.customerId,
              vehicleId: input.vehicleId,
              checkoutAt,
              expectedReturnAt: input.expectedReturnAt,
              startMileage: input.startMileage,
              startFuelLevel: input.startFuelLevel,
              initialCondition: input.condition as unknown as Prisma.InputJsonValue,
              dailyRate,
              securityDeposit: booking ? toNumber(booking.securityDeposit) : toNumber(vehicle.securityDeposit) ?? toNumber(settings.defaultSecurityDeposit),
              status: RentalStatus.ACTIVE,
              checkedOutById: userId,
              notes: input.notes,
            },
            include: INCLUDE_DEFAULT,
          });

          await tx.vehicleInspection.create({
            data: {
              vehicleId: input.vehicleId,
              rentalId: rental.id,
              type: "PRE_RENTAL",
              inspectorId: userId,
              mileage: input.startMileage,
              fuelLevel: input.startFuelLevel,
              cleanliness: input.condition.cleanliness,
              exteriorCondition: input.condition.exteriorCondition,
              interiorCondition: input.condition.interiorCondition,
              tireCondition: input.condition.tireCondition,
              windshieldCondition: input.condition.windshieldCondition,
              notes: input.condition.notes,
              images: input.condition.images as unknown as Prisma.InputJsonValue,
            },
          });

          await tx.vehicle.update({ where: { id: input.vehicleId }, data: { status: VehicleStatus.RENTED } });

          if (booking) {
            await tx.booking.update({ where: { id: booking.id }, data: { status: "ACTIVE" } });
          }

          return rental;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.conflict("Vehicle is not available for the selected dates", "VEHICLE_NOT_AVAILABLE");
    }
  },

  async extend(id: string, input: ExtendRentalInput) {
    const rental = await this.get(id);
    if (rental.status !== RentalStatus.ACTIVE && rental.status !== RentalStatus.OVERDUE) {
      throw AppError.conflict("Only active or overdue rentals can be extended", "RENTAL_NOT_ACTIVE");
    }
    if (input.newExpectedReturnAt <= rental.expectedReturnAt) {
      throw AppError.badRequest("New return date must be later than the current expected return date", "INVALID_DATE_RANGE");
    }

    const conflicting = await findConflictingVehicleIds(prisma, rental.expectedReturnAt, input.newExpectedReturnAt, {
      excludeRentalId: id,
    });
    if (conflicting.has(rental.vehicleId)) {
      throw AppError.conflict("Vehicle is booked by another reservation during the requested extension", "VEHICLE_NOT_AVAILABLE");
    }

    return prisma.rental.update({
      where: { id },
      data: { expectedReturnAt: input.newExpectedReturnAt, status: RentalStatus.ACTIVE },
      include: INCLUDE_DEFAULT,
    });
  },

  async checkin(id: string, input: CheckinRentalInput, userId: string) {
    const rental = await this.get(id);
    if (rental.status !== RentalStatus.ACTIVE && rental.status !== RentalStatus.OVERDUE) {
      throw AppError.conflict("Only active or overdue rentals can be checked in", "RENTAL_NOT_ACTIVE");
    }
    if (input.returnMileage < rental.startMileage) {
      throw AppError.badRequest("Return mileage cannot be less than the starting mileage", "INVALID_MILEAGE");
    }

    const actualReturnAt = input.actualReturnAt ?? new Date();
    const settings = await settingsService.getSettings();
    const plannedRentalDays = computeRentalDays(rental.checkoutAt, rental.expectedReturnAt);

    const charges = computeReturnCharges({
      expectedReturnAt: rental.expectedReturnAt,
      actualReturnAt,
      startMileage: rental.startMileage,
      returnMileage: input.returnMileage,
      startFuelLevel: rental.startFuelLevel,
      returnFuelLevel: input.returnFuelLevel,
      plannedRentalDays,
      lateFeePerDay: toNumber(settings.lateFeePerDay),
      freeMileagePerDay: settings.freeMileagePerDay,
      mileageFeePerUnit: toNumber(settings.mileageFeePerUnit),
      fuelChargePerUnit: toNumber(settings.fuelChargePerUnit),
    });

    const damageFee = input.newDamages
      .filter((d) => d.customerResponsible)
      .reduce((sum, d) => sum + (d.estimatedRepairCost ?? 0), 0);

    const baseCharge = rental.booking
      ? toNumber((await prisma.booking.findUnique({ where: { id: rental.booking.id } }))?.totalAmount ?? 0)
      : computeBookingTotals({
          dailyRate: toNumber(rental.dailyRate),
          rentalDays: computeRentalDays(rental.checkoutAt, actualReturnAt),
          taxPercentage: toNumber(settings.taxPercentage),
          discount: 0,
          additionalFees: 0,
        }).totalAmount;

    const tax = round2ForTax(charges.lateFee + charges.mileageFee + charges.fuelFee + input.additionalCharges, toNumber(settings.taxPercentage));
    const finalAmount = Math.max(
      0,
      Math.round(
        (baseCharge + charges.lateFee + charges.mileageFee + charges.fuelFee + damageFee + input.additionalCharges + tax - input.discount) * 100
      ) / 100
    );

    const requiresMaintenance = input.requiresMaintenance || input.newDamages.some((d) => d.customerResponsible && (d.estimatedRepairCost ?? 0) > 0);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.rental.update({
        where: { id },
        data: {
          actualReturnAt,
          returnMileage: input.returnMileage,
          returnFuelLevel: input.returnFuelLevel,
          returnedCondition: input.condition as unknown as Prisma.InputJsonValue,
          lateFee: charges.lateFee,
          mileageFee: charges.mileageFee,
          fuelFee: charges.fuelFee,
          damageFee,
          additionalCharges: input.additionalCharges,
          discount: input.discount,
          tax,
          finalAmount,
          status: RentalStatus.COMPLETED,
          paymentStatus: "PENDING",
          checkedInById: userId,
        },
        include: INCLUDE_DEFAULT,
      });

      await tx.vehicleInspection.create({
        data: {
          vehicleId: rental.vehicleId,
          rentalId: rental.id,
          type: "POST_RENTAL",
          inspectorId: userId,
          mileage: input.returnMileage,
          fuelLevel: input.returnFuelLevel,
          cleanliness: input.condition.cleanliness,
          exteriorCondition: input.condition.exteriorCondition,
          interiorCondition: input.condition.interiorCondition,
          tireCondition: input.condition.tireCondition,
          windshieldCondition: input.condition.windshieldCondition,
          notes: input.condition.notes,
          images: input.condition.images as unknown as Prisma.InputJsonValue,
        },
      });

      for (const damage of input.newDamages) {
        await tx.damageReport.create({
          data: {
            vehicleId: rental.vehicleId,
            rentalId: rental.id,
            customerId: rental.customerId,
            description: damage.description,
            location: damage.location,
            estimatedRepairCost: damage.estimatedRepairCost,
            customerResponsible: damage.customerResponsible,
            photos: damage.photos as unknown as Prisma.InputJsonValue,
            status: "REPORTED",
          },
        });
      }

      await tx.vehicle.update({
        where: { id: rental.vehicleId },
        data: {
          status: requiresMaintenance ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE,
          mileage: Math.max(input.returnMileage, rental.vehicle.mileage),
        },
      });

      if (rental.booking) {
        await tx.booking.update({ where: { id: rental.booking.id }, data: { status: "COMPLETED" } });
      }

      return updated;
    });
  },

  async cancel(id: string, reason: string | undefined) {
    const rental = await this.get(id);
    if (rental.status !== RentalStatus.ACTIVE) {
      throw AppError.conflict("Only an active rental (checked out by mistake) can be cancelled", "RENTAL_NOT_CANCELLABLE");
    }
    return prisma.$transaction(async (tx) => {
      const updated = await tx.rental.update({
        where: { id },
        data: { status: RentalStatus.CANCELLED, notes: reason ? `${rental.notes ?? ""}\n[CANCELLED] ${reason}`.trim() : rental.notes },
        include: INCLUDE_DEFAULT,
      });
      await tx.vehicle.update({ where: { id: rental.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
      if (rental.booking) {
        await tx.booking.update({ where: { id: rental.booking.id }, data: { status: "CONFIRMED" } });
      }
      return updated;
    });
  },

  /** Flips ACTIVE rentals whose expected return has passed into OVERDUE. Called by the notification scheduler. */
  async markOverdueRentals() {
    const result = await prisma.rental.updateMany({
      where: { status: RentalStatus.ACTIVE, expectedReturnAt: { lt: new Date() } },
      data: { status: RentalStatus.OVERDUE },
    });
    return result.count;
  },
};

function round2ForTax(amount: number, taxPercentage: number): number {
  return Math.round(((amount * taxPercentage) / 100) * 100) / 100;
}
