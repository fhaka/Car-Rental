import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { notificationsService } from "../notifications/notifications.service";
import { CreateDamageInput, ListDamagesQuery, UpdateDamageInput } from "./damages.schemas";

const INCLUDE_DEFAULT = {
  vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } },
  rental: { select: { id: true, rentalNumber: true } },
  customer: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.DamageReportInclude;

export const damagesService = {
  async list(query: ListDamagesQuery) {
    const { page, pageSize, vehicleId, status, sortBy, sortOrder } = query;
    const where: Prisma.DamageReportWhereInput = {
      ...(vehicleId ? { vehicleId } : {}),
      ...(status ? { status } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.damageReport.findMany({
        where,
        include: INCLUDE_DEFAULT,
        orderBy: { [sortBy ?? "dateReported"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.damageReport.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const damage = await prisma.damageReport.findUnique({ where: { id }, include: INCLUDE_DEFAULT });
    if (!damage) throw AppError.notFound("Damage report not found");
    return damage;
  },

  async create(input: CreateDamageInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw AppError.badRequest("Vehicle not found", "VEHICLE_NOT_FOUND");
    const damage = await prisma.damageReport.create({
      data: { ...input, photos: input.photos as unknown as Prisma.InputJsonValue, status: "REPORTED" },
      include: INCLUDE_DEFAULT,
    });
    await notificationsService.createOnce({
      type: "DAMAGE_REPORTED",
      title: "New damage report",
      message: `Damage reported on ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber}): ${input.description}`,
      relatedEntityType: "DamageReport",
      relatedEntityId: damage.id,
      dedupeWindowHours: 1,
    });
    return damage;
  },

  async update(id: string, input: UpdateDamageInput) {
    await this.get(id);
    return prisma.damageReport.update({
      where: { id },
      data: { ...input, photos: input.photos as unknown as Prisma.InputJsonValue | undefined },
      include: INCLUDE_DEFAULT,
    });
  },
};
