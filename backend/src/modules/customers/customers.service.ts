import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake, PaginationQuery } from "../../utils/pagination";
import { toNumber } from "../../utils/money";
import { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from "./customers.schemas";

export const customersService = {
  async list(query: ListCustomersQuery) {
    const { page, pageSize, search, isActive, sortBy, sortOrder } = query;
    const where: Prisma.CustomerWhereInput = {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { driverLicenseNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw AppError.notFound("Customer not found");
    return customer;
  },

  async getWithSummary(id: string) {
    const customer = await this.get(id);
    const [bookingCount, rentalCount, payments, outstandingBookings, outstandingRentals] = await Promise.all([
      prisma.booking.count({ where: { customerId: id } }),
      prisma.rental.count({ where: { customerId: id } }),
      prisma.payment.aggregate({ where: { customerId: id, status: "COMPLETED" }, _sum: { amount: true } }),
      prisma.booking.findMany({ where: { customerId: id, status: { in: ["CONFIRMED", "ACTIVE", "PENDING"] } }, select: { remainingBalance: true } }),
      prisma.rental.findMany({ where: { customerId: id, status: { in: ["ACTIVE", "OVERDUE"] } }, select: { finalAmount: true, additionalCharges: true, lateFee: true, mileageFee: true, fuelFee: true, damageFee: true } }),
    ]);

    const outstandingFromBookings = outstandingBookings.reduce((sum, b) => sum + toNumber(b.remainingBalance), 0);
    const outstandingFromRentals = outstandingRentals.reduce((sum, r) => sum + toNumber(r.finalAmount), 0);

    return {
      customer,
      summary: {
        totalBookings: bookingCount,
        totalRentals: rentalCount,
        totalPaid: toNumber(payments._sum.amount),
        outstandingBalance: Math.max(0, outstandingFromBookings + outstandingFromRentals),
      },
    };
  },

  async create(input: CreateCustomerInput) {
    const existing = await prisma.customer.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw AppError.conflict("A customer with this email already exists", "DUPLICATE_EMAIL");
    return prisma.customer.create({ data: { ...input, email: input.email.toLowerCase() } });
  },

  async update(id: string, input: UpdateCustomerInput) {
    await this.get(id);
    return prisma.customer.update({
      where: { id },
      data: { ...input, ...(input.email ? { email: input.email.toLowerCase() } : {}) },
    });
  },

  async deactivate(id: string) {
    await this.get(id);
    return prisma.customer.update({ where: { id }, data: { isActive: false } });
  },

  async bookingHistory(id: string, pagination: PaginationQuery) {
    await this.get(id);
    const { page, pageSize } = pagination;
    const [data, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where: { customerId: id },
        include: { vehicle: { select: { plateNumber: true, brand: true, model: true } } },
        orderBy: { createdAt: "desc" },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.booking.count({ where: { customerId: id } }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async rentalHistory(id: string, pagination: PaginationQuery) {
    await this.get(id);
    const { page, pageSize } = pagination;
    const [data, total] = await prisma.$transaction([
      prisma.rental.findMany({
        where: { customerId: id },
        include: { vehicle: { select: { plateNumber: true, brand: true, model: true } } },
        orderBy: { createdAt: "desc" },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.rental.count({ where: { customerId: id } }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async paymentHistory(id: string, pagination: PaginationQuery) {
    await this.get(id);
    const { page, pageSize } = pagination;
    const [data, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where: { customerId: id },
        orderBy: { createdAt: "desc" },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.payment.count({ where: { customerId: id } }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },
};
