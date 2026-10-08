import fs from "node:fs";
import path from "node:path";
import { Prisma, VehicleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";

/** Best-effort removal of a stored upload file. Never throws - a dangling file
 * must not break the request. Scoped to the uploads dir to prevent traversal. */
function unlinkUploadByUrl(url: string) {
  try {
    if (!url.startsWith("/uploads/")) return;
    const uploadsRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
    const abs = path.resolve(uploadsRoot, url.replace(/^\/uploads\//, ""));
    if (abs.startsWith(uploadsRoot) && fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore - orphaned file is harmless */
  }
}
import {
  ChangeVehicleStatusInput,
  CreateVehicleInput,
  ListVehiclesQuery,
  UpdateVehicleInput,
} from "./vehicles.schemas";

const INCLUDE_DEFAULT = {
  category: true,
  images: { orderBy: { isPrimary: "desc" as const } },
};

export const vehiclesService = {
  async list(query: ListVehiclesQuery) {
    const { page, pageSize, search, sortBy, sortOrder, status, categoryId, transmission, fuelType, brand, minPrice, maxPrice, minSeats, isActive } = query;

    const where: Prisma.VehicleWhereInput = {
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(transmission ? { transmission } : {}),
      ...(fuelType ? { fuelType } : {}),
      ...(brand ? { brand: { equals: brand, mode: "insensitive" } } : {}),
      ...(minSeats ? { seats: { gte: minSeats } } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(minPrice || maxPrice
        ? { dailyRate: { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) } }
        : {}),
      ...(search
        ? {
            OR: [
              { plateNumber: { contains: search, mode: "insensitive" } },
              { vin: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
              { model: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.vehicle.findMany({
        where,
        include: INCLUDE_DEFAULT,
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: INCLUDE_DEFAULT });
    if (!vehicle) throw AppError.notFound("Vehicle not found");
    return vehicle;
  },

  async create(input: CreateVehicleInput) {
    const [plateTaken, vinTaken] = await Promise.all([
      prisma.vehicle.findUnique({ where: { plateNumber: input.plateNumber } }),
      prisma.vehicle.findUnique({ where: { vin: input.vin } }),
    ]);
    if (plateTaken) throw AppError.conflict("A vehicle with this plate number already exists", "DUPLICATE_PLATE");
    if (vinTaken) throw AppError.conflict("A vehicle with this VIN already exists", "DUPLICATE_VIN");

    const category = await prisma.vehicleCategory.findUnique({ where: { id: input.categoryId } });
    if (!category) throw AppError.badRequest("Vehicle category not found", "CATEGORY_NOT_FOUND");

    return prisma.vehicle.create({ data: input, include: INCLUDE_DEFAULT });
  },

  async update(id: string, input: UpdateVehicleInput) {
    await this.get(id);
    return prisma.vehicle.update({ where: { id }, data: input, include: INCLUDE_DEFAULT });
  },

  async changeStatus(id: string, input: ChangeVehicleStatusInput) {
    const vehicle = await this.get(id);
    if (vehicle.status === VehicleStatus.RENTED) {
      throw AppError.conflict(
        "A rented vehicle's status changes automatically through the rental check-in workflow",
        "VEHICLE_CURRENTLY_RENTED"
      );
    }
    return prisma.vehicle.update({
      where: { id },
      data: { status: input.status, notes: input.notes ?? vehicle.notes },
      include: INCLUDE_DEFAULT,
    });
  },

  async archive(id: string) {
    await this.get(id);
    return prisma.vehicle.update({
      where: { id },
      data: { isActive: false, status: VehicleStatus.INACTIVE },
      include: INCLUDE_DEFAULT,
    });
  },

  /** Only allowed when the vehicle has no historical references - otherwise it must be archived instead. */
  async remove(id: string) {
    await this.get(id);
    const [bookingCount, rentalCount, expenseCount, maintenanceCount] = await Promise.all([
      prisma.booking.count({ where: { vehicleId: id } }),
      prisma.rental.count({ where: { vehicleId: id } }),
      prisma.expense.count({ where: { vehicleId: id } }),
      prisma.maintenanceRecord.count({ where: { vehicleId: id } }),
    ]);
    if (bookingCount || rentalCount || expenseCount || maintenanceCount) {
      throw AppError.conflict(
        "This vehicle has historical bookings, rentals, expenses, or maintenance records and cannot be deleted. Archive it instead.",
        "VEHICLE_HAS_HISTORY"
      );
    }
    await prisma.vehicle.delete({ where: { id } });
  },

  async addImages(id: string, urls: { url: string; isPrimary?: boolean }[]) {
    await this.get(id);
    // If the vehicle has no primary image yet, the first newly-uploaded image
    // becomes the primary (the one shown on the public website). An existing
    // primary is always preserved.
    const existingPrimary = await prisma.vehicleImage.findFirst({
      where: { vehicleId: id, isPrimary: true },
      select: { id: true },
    });
    await prisma.$transaction(
      urls.map((img, idx) =>
        prisma.vehicleImage.create({
          data: { vehicleId: id, url: img.url, isPrimary: !existingPrimary && idx === 0 },
        })
      )
    );
    return this.get(id);
  },

  async removeImage(id: string, imageId: string) {
    const image = await prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId: id } });
    if (!image) throw AppError.notFound("Vehicle image not found");
    await prisma.vehicleImage.delete({ where: { id: imageId } });
    unlinkUploadByUrl(image.url);
    // If the primary image was removed, promote the oldest remaining image so
    // the public site still has a photo to show.
    if (image.isPrimary) {
      const next = await prisma.vehicleImage.findFirst({ where: { vehicleId: id }, orderBy: { createdAt: "asc" } });
      if (next) await prisma.vehicleImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
    return this.get(id);
  },

  async setPrimaryImage(id: string, imageId: string) {
    const image = await prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId: id } });
    if (!image) throw AppError.notFound("Vehicle image not found");
    await prisma.$transaction([
      prisma.vehicleImage.updateMany({ where: { vehicleId: id, isPrimary: true }, data: { isPrimary: false } }),
      prisma.vehicleImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);
    return this.get(id);
  },
};
