import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { toNumber } from "../../utils/money";
import { rentalsService } from "../rentals/rentals.service";
import { notificationsService } from "./notifications.service";

const RUN_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes
const SOON_HOURS = 24;
const EXPIRY_WARNING_DAYS = 30;
const MAINTENANCE_WARNING_DAYS = 7;

async function evaluateBusinessRules() {
  const now = new Date();

  // 1) Flip ACTIVE rentals past their expected return into OVERDUE, then notify.
  await rentalsService.markOverdueRentals();
  const overdueRentals = await prisma.rental.findMany({
    where: { status: "OVERDUE" },
    include: { vehicle: { select: { plateNumber: true } }, customer: { select: { firstName: true, lastName: true } } },
  });
  for (const rental of overdueRentals) {
    await notificationsService.createOnce({
      type: "RENTAL_OVERDUE",
      title: "Overdue rental",
      message: `Rental ${rental.rentalNumber} (${rental.vehicle.plateNumber}) for ${rental.customer.firstName} ${rental.customer.lastName} is overdue.`,
      relatedEntityType: "Rental",
      relatedEntityId: rental.id,
    });
  }

  // 2) Upcoming returns within the next SOON_HOURS.
  const soon = new Date(now.getTime() + SOON_HOURS * 60 * 60 * 1000);
  const upcomingReturns = await prisma.rental.findMany({
    where: { status: "ACTIVE", expectedReturnAt: { gte: now, lte: soon } },
    include: { vehicle: { select: { plateNumber: true } } },
  });
  for (const rental of upcomingReturns) {
    await notificationsService.createOnce({
      type: "UPCOMING_RETURN",
      title: "Upcoming vehicle return",
      message: `Rental ${rental.rentalNumber} (${rental.vehicle.plateNumber}) is due back ${rental.expectedReturnAt.toLocaleString()}.`,
      relatedEntityType: "Rental",
      relatedEntityId: rental.id,
    });
  }

  // 3) Pending bookings older than 2 hours still awaiting confirmation.
  const staleSince = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const pendingBookings = await prisma.booking.findMany({
    where: { status: "PENDING", createdAt: { lte: staleSince } },
  });
  for (const booking of pendingBookings) {
    await notificationsService.createOnce({
      type: "BOOKING_PENDING",
      title: "Booking awaiting confirmation",
      message: `Booking ${booking.bookingNumber} is still pending confirmation.`,
      relatedEntityType: "Booking",
      relatedEntityId: booking.id,
      dedupeWindowHours: 24,
    });
  }

  // 4) Unpaid balances on active/completed bookings.
  const unpaidBookings = await prisma.booking.findMany({
    where: { remainingBalance: { gt: 0 }, status: { in: ["ACTIVE", "COMPLETED"] } },
  });
  for (const booking of unpaidBookings) {
    await notificationsService.createOnce({
      type: "UNPAID_BALANCE",
      title: "Unpaid balance",
      message: `Booking ${booking.bookingNumber} has an outstanding balance of ${toNumber(booking.remainingBalance).toFixed(2)}.`,
      relatedEntityType: "Booking",
      relatedEntityId: booking.id,
    });
  }

  // 5) Insurance / registration expiring within EXPIRY_WARNING_DAYS.
  const expiryWindow = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  const vehicles = await prisma.vehicle.findMany({ where: { isActive: true } });
  for (const vehicle of vehicles) {
    if (vehicle.insuranceExpiry && vehicle.insuranceExpiry <= expiryWindow && vehicle.insuranceExpiry >= now) {
      await notificationsService.createOnce({
        type: "INSURANCE_EXPIRING",
        title: "Insurance expiring soon",
        message: `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber}) insurance expires ${vehicle.insuranceExpiry.toDateString()}.`,
        relatedEntityType: "Vehicle",
        relatedEntityId: vehicle.id,
        dedupeWindowHours: 72,
      });
    }
    if (vehicle.registrationExpiry && vehicle.registrationExpiry <= expiryWindow && vehicle.registrationExpiry >= now) {
      await notificationsService.createOnce({
        type: "REGISTRATION_EXPIRING",
        title: "Registration expiring soon",
        message: `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber}) registration expires ${vehicle.registrationExpiry.toDateString()}.`,
        relatedEntityType: "Vehicle",
        relatedEntityId: vehicle.id,
        dedupeWindowHours: 72,
      });
    }
  }

  // 6) Maintenance due soon.
  const maintenanceWindow = new Date(now.getTime() + MAINTENANCE_WARNING_DAYS * 24 * 60 * 60 * 1000);
  const dueSoon = await prisma.maintenanceRecord.findMany({
    where: { status: "SCHEDULED", serviceDate: { lte: maintenanceWindow, gte: now } },
    include: { vehicle: { select: { plateNumber: true, brand: true, model: true } } },
  });
  for (const record of dueSoon) {
    await notificationsService.createOnce({
      type: "MAINTENANCE_DUE",
      title: "Maintenance due soon",
      message: `${record.vehicle.brand} ${record.vehicle.model} (${record.vehicle.plateNumber}) has ${record.serviceType} scheduled ${record.serviceDate.toDateString()}.`,
      relatedEntityType: "MaintenanceRecord",
      relatedEntityId: record.id,
      dedupeWindowHours: 48,
    });
  }
}

export function startNotificationScheduler() {
  const run = () => {
    evaluateBusinessRules().catch((err) => logger.error({ err }, "Notification scheduler run failed"));
  };

  // Run once shortly after boot, then on a fixed interval.
  const initialTimer = setTimeout(run, 10_000);
  const interval = setInterval(run, RUN_INTERVAL_MS);

  return () => {
    clearTimeout(initialTimer);
    clearInterval(interval);
  };
}
