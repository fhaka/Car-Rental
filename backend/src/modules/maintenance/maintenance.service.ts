import { Prisma, VehicleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { CreateMaintenanceInput, ListMaintenanceQuery, UpdateMaintenanceInput } from "./maintenance.schemas";

const INCLUDE_DEFAULT = {
  vehicle: { select: { id: true, plateNumber: true, brand: true, model: true, status: true } },
} satisfies Prisma.MaintenanceRecordInclude;

const ACTIVE_STATUSES = ["SCHEDULED", "IN_PROGRESS"] as const;

async function syncVehicleStatus(tx: Prisma.TransactionClient, vehicleId: string) {
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.status === VehicleStatus.RENTED) return; // never override an active rental

  const hasOpenMaintenance = await tx.maintenanceRecord.count({
    where: { vehicleId, status: { in: [...ACTIVE_STATUSES] } },
  });

  if (hasOpenMaintenance > 0 && vehicle.status !== VehicleStatus.MAINTENANCE) {
    await tx.vehicle.update({ where: { id: vehicleId }, data: { status: VehicleStatus.MAINTENANCE } });
  } else if (hasOpenMaintenance === 0 && vehicle.status === VehicleStatus.MAINTENANCE) {
    await tx.vehicle.update({ where: { id: vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
  }
}

export const maintenanceService = {
  async list(query: ListMaintenanceQuery) {
    const { page, pageSize, vehicleId, status, upcoming, sortBy, sortOrder } = query;
    const where: Prisma.MaintenanceRecordWhereInput = {
      ...(vehicleId ? { vehicleId } : {}),
      ...(status ? { status } : {}),
      ...(upcoming ? { nextServiceDate: { gte: new Date() }, status: { not: "CANCELLED" } } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.maintenanceRecord.findMany({
        where,
        include: INCLUDE_DEFAULT,
        orderBy: { [sortBy ?? "serviceDate"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const record = await prisma.maintenanceRecord.findUnique({ where: { id }, include: INCLUDE_DEFAULT });
    if (!record) throw AppError.notFound("Maintenance record not found");
    return record;
  },

  async create(input: CreateMaintenanceInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw AppError.badRequest("Vehicle not found", "VEHICLE_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.create({ data: input, include: INCLUDE_DEFAULT });
      await syncVehicleStatus(tx, input.vehicleId);
      return tx.maintenanceRecord.findUniqueOrThrow({ where: { id: record.id }, include: INCLUDE_DEFAULT });
    });
  },

  async update(id: string, input: UpdateMaintenanceInput) {
    const existing = await this.get(id);
    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.update({ where: { id }, data: input, include: INCLUDE_DEFAULT });

      if (input.status === "COMPLETED") {
        await tx.vehicle.update({
          where: { id: existing.vehicleId },
          data: {
            lastServiceDate: input.serviceDate ?? existing.serviceDate,
            nextServiceDate: input.nextServiceDate ?? existing.nextServiceDate,
          },
        });
      }

      await syncVehicleStatus(tx, existing.vehicleId);
      return tx.maintenanceRecord.findUniqueOrThrow({ where: { id }, include: INCLUDE_DEFAULT });
    });
  },
};
