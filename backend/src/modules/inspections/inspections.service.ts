import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { CreateInspectionInput, ListInspectionsQuery } from "./inspections.schemas";

const INCLUDE_DEFAULT = {
  vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } },
  inspector: { select: { id: true, firstName: true, lastName: true } },
  rental: { select: { id: true, rentalNumber: true } },
} satisfies Prisma.VehicleInspectionInclude;

export const inspectionsService = {
  async list(query: ListInspectionsQuery) {
    const { page, pageSize, vehicleId, rentalId, type, sortBy, sortOrder } = query;
    const where: Prisma.VehicleInspectionWhereInput = {
      ...(vehicleId ? { vehicleId } : {}),
      ...(rentalId ? { rentalId } : {}),
      ...(type ? { type } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.vehicleInspection.findMany({
        where,
        include: INCLUDE_DEFAULT,
        orderBy: { [sortBy ?? "inspectionDate"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.vehicleInspection.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const inspection = await prisma.vehicleInspection.findUnique({ where: { id }, include: INCLUDE_DEFAULT });
    if (!inspection) throw AppError.notFound("Inspection not found");
    return inspection;
  },

  async create(input: CreateInspectionInput, inspectorId: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw AppError.badRequest("Vehicle not found", "VEHICLE_NOT_FOUND");
    return prisma.vehicleInspection.create({
      data: { ...input, images: input.images as unknown as Prisma.InputJsonValue, inspectorId },
      include: INCLUDE_DEFAULT,
    });
  },
};
