import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { CreateCategoryInput, ListCategoriesQuery, UpdateCategoryInput } from "./vehicleCategories.schemas";

export const vehicleCategoriesService = {
  async list(query: ListCategoriesQuery) {
    const { page, pageSize, search, isActive, sortBy, sortOrder } = query;
    const where: Prisma.VehicleCategoryWhereInput = {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };

    const [categories, total] = await prisma.$transaction([
      prisma.vehicleCategory.findMany({
        where,
        orderBy: { [sortBy ?? "name"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
        include: { _count: { select: { vehicles: true } } },
      }),
      prisma.vehicleCategory.count({ where }),
    ]);

    const data = categories.map((c) => ({ ...c, vehicleCount: c._count.vehicles, _count: undefined }));
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const category = await prisma.vehicleCategory.findUnique({
      where: { id },
      include: { _count: { select: { vehicles: true } } },
    });
    if (!category) throw AppError.notFound("Vehicle category not found");
    return category;
  },

  async create(input: CreateCategoryInput) {
    const existing = await prisma.vehicleCategory.findUnique({ where: { name: input.name } });
    if (existing) throw AppError.conflict("A category with this name already exists");
    return prisma.vehicleCategory.create({ data: input });
  },

  async update(id: string, input: UpdateCategoryInput) {
    await this.get(id);
    return prisma.vehicleCategory.update({ where: { id }, data: input });
  },

  async archive(id: string) {
    await this.get(id);
    return prisma.vehicleCategory.update({ where: { id }, data: { isActive: false } });
  },
};
